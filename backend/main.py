from pathlib import Path
from os import getenv
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Column, Integer, String, create_engine, inspect, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv(dotenv_path=Path(__file__).with_name(".env.local"))

DATABASE_URL = getenv("DATABASE_URL")
if DATABASE_URL is None:
    raise RuntimeError("DATABASE_URL is not configured")

if DATABASE_URL.startswith("sqlite:///./"):
    database_path = Path(__file__).parent / DATABASE_URL.removeprefix("sqlite:///./")
    DATABASE_URL = f"sqlite:///{database_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Todo 데이터를 DB의 todos 테이블에 저장하기 위한 SQLAlchemy ORM 모델입니다.
class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    completed = Column(Boolean, nullable=False, default=False)


# 새 Todo를 만들 때 클라이언트가 보내야 하는 요청 데이터 구조입니다.
class TodoCreate(BaseModel):
    title: str
    date: str
    completed: bool = False


# Todo 수정은 일부 필드만 바꿀 수 있어야 하므로 모든 값을 선택 입력으로 둡니다.
class TodoUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    completed: Optional[bool] = None


# API 응답에는 DB에서 생성된 id까지 포함해 클라이언트가 Todo를 식별할 수 있게 합니다.
class TodoResponse(BaseModel):
    id: int
    title: str
    date: str
    completed: bool

    model_config = ConfigDict(from_attributes=True)


Base.metadata.create_all(bind=engine)


# 기존 todos.db에 id 컬럼만 있는 경우에도 앱이 바로 실행되도록 부족한 컬럼을 보강합니다.
def ensure_todo_columns():
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("todos")}

    with engine.begin() as connection:
        if "title" not in columns:
            connection.execute(text("ALTER TABLE todos ADD COLUMN title VARCHAR NOT NULL DEFAULT ''"))
        if "date" not in columns:
            connection.execute(text("ALTER TABLE todos ADD COLUMN date VARCHAR NOT NULL DEFAULT ''"))
        if "completed" not in columns:
            connection.execute(text("ALTER TABLE todos ADD COLUMN completed BOOLEAN NOT NULL DEFAULT 0"))


ensure_todo_columns()

app = FastAPI(title="Todo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 요청마다 DB 세션을 열고, 처리가 끝나면 반드시 닫아 연결 누수를 막습니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 검색어와 완료 상태 필터를 DB 쿼리에 적용한 뒤 id 오름차순으로 응답합니다.
@app.get("/todos", response_model=list[TodoResponse])
def read_todos(
    search: Optional[str] = None,
    todo_filter: Optional[str] = Query(default=None, alias="filter"),
    db: Session = Depends(get_db),
):
    query = db.query(Todo)

    if search:
        query = query.filter(Todo.title.ilike(f"%{search}%"))

    if todo_filter == "active":
        query = query.filter(Todo.completed.is_(False))
    elif todo_filter == "completed":
        query = query.filter(Todo.completed.is_(True))

    return query.order_by(Todo.id).all()


# 요청 본문으로 받은 값을 DB 모델로 변환해 저장하고, 생성된 id를 포함해 반환합니다.
@app.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = Todo(title=todo.title, date=todo.date, completed=todo.completed)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


# 존재하는 Todo만 수정해야 하므로 먼저 id로 조회하고, 전달된 필드만 반영합니다.
@app.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.get(Todo, todo_id)
    if db_todo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")

    update_data = todo.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    db.commit()
    db.refresh(db_todo)
    return db_todo


# 삭제 대상이 실제로 있는지 확인한 뒤 제거하고, 성공 시 본문 없는 204 응답을 보냅니다.
@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.get(Todo, todo_id)
    if db_todo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")

    db.delete(db_todo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
