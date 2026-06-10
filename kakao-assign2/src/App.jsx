import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'dailyTodoList'
const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'completed', label: '완료' },
]
const WEEKDAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

function loadTodosFromLocalStorage() {
  const savedTodos = localStorage.getItem(STORAGE_KEY)

  if (!savedTodos) {
    return []
  }

  try {
    const parsedTodos = JSON.parse(savedTodos)
    return Array.isArray(parsedTodos) ? parsedTodos : []
  } catch {
    return []
  }
}

function getNextTodoId(todos) {
  return todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1
}

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getWeekStartDate(dateKey) {
  const date = getDateFromKey(dateKey)
  const dayOfWeek = date.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  date.setDate(date.getDate() - daysFromMonday)
  return date
}

function getWeekDateKeys(selectedDate) {
  const weekStartDate = getWeekStartDate(selectedDate)
  const weekDateKeys = []

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + index)
    weekDateKeys.push(getDateKey(date))
  }

  return weekDateKeys
}

function getWeekRangeText(weekDateKeys) {
  const startDate = getDateFromKey(weekDateKeys[0])
  const endDate = getDateFromKey(weekDateKeys[6])

  return `${startDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })}`
}

function getTodoCountByDate(todos, dateKey) {
  return todos.filter((todo) => todo.date === dateKey).length
}

function getFilteredTodos(todos, selectedDate, currentFilter) {
  const todosForSelectedDate = todos.filter((todo) => todo.date === selectedDate)

  if (currentFilter === 'active') {
    return todosForSelectedDate.filter((todo) => !todo.isCompleted)
  }

  if (currentFilter === 'completed') {
    return todosForSelectedDate.filter((todo) => todo.isCompleted)
  }

  return todosForSelectedDate
}

function App() {
  const [todos, setTodos] = useState(loadTodosFromLocalStorage)
  const [todoText, setTodoText] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()))
  const [message, setMessage] = useState('')
  const nextTodoId = useRef(getNextTodoId(todos))

  const weekDateKeys = useMemo(
    () => getWeekDateKeys(selectedDate),
    [selectedDate],
  )
  const weekRangeText = getWeekRangeText(weekDateKeys)
  const todayKey = getDateKey(new Date())
  const filteredTodos = getFilteredTodos(todos, selectedDate, currentFilter)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch {
      setMessage('Todo 저장 중 문제가 발생했습니다.')
    }
  }, [todos])

  function addTodo() {
    const trimmedText = todoText.trim()

    if (!trimmedText) {
      setMessage('할 일을 입력해 주세요.')
      return
    }

    setTodos((prevTodos) => [
      ...prevTodos,
      {
        id: nextTodoId.current,
        text: trimmedText,
        date: selectedDate,
        isCompleted: false,
      },
    ])

    nextTodoId.current += 1
    setTodoText('')
    setMessage('')
  }

  function editTodo(todoId) {
    const targetTodo = todos.find((todo) => todo.id === todoId)

    if (!targetTodo) {
      return
    }

    const editedText = window.prompt('수정할 내용을 입력하세요.', targetTodo.text)

    if (editedText === null) {
      return
    }

    const trimmedText = editedText.trim()

    if (!trimmedText) {
      setMessage('수정할 내용을 입력해 주세요.')
      return
    }

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId ? { ...todo, text: trimmedText } : todo,
      ),
    )
    setMessage('')
  }

  function toggleTodoCompletion(todoId) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId
          ? { ...todo, isCompleted: !todo.isCompleted }
          : todo,
      ),
    )
  }

  function deleteTodo(todoId) {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== todoId))
  }

  function moveSelectedWeek(weekOffset) {
    setSelectedDate((prevSelectedDate) => {
      const date = getDateFromKey(prevSelectedDate)
      date.setDate(date.getDate() + weekOffset * 7)

      return getDateKey(date)
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    addTodo()
  }

  return (
    <main className="todo-app" aria-labelledby="app-title">
      <section className="todo-panel">
        <TodoHeader />
        <WeekNavigator
          weekRangeText={weekRangeText}
          onMoveWeek={moveSelectedWeek}
        />
        <WeekDays
          dateKeys={weekDateKeys}
          selectedDate={selectedDate}
          todayKey={todayKey}
          todos={todos}
          onSelectDate={setSelectedDate}
        />
        <TodoForm
          todoText={todoText}
          onTodoTextChange={setTodoText}
          onSubmit={handleSubmit}
        />
        <p className="message" role="alert" aria-live="polite">
          {message}
        </p>
        <FilterTabs
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />
        <TodoList
          todos={filteredTodos}
          onToggle={toggleTodoCompletion}
          onDelete={deleteTodo}
          onEdit={editTodo}
        />
      </section>
    </main>
  )
}

function TodoHeader() {
  return (
    <header className="todo-header">
      <p className="eyebrow">React Todo</p>
      <h1 id="app-title">오늘의 할 일</h1>
    </header>
  )
}

function WeekNavigator({ weekRangeText, onMoveWeek }) {
  return (
    <div className="week-navigation" aria-label="주간 Todo 날짜 이동">
      <button
        className="week-button"
        type="button"
        onClick={() => onMoveWeek(-1)}
      >
        이전 주
      </button>
      <p className="week-range">{weekRangeText}</p>
      <button
        className="week-button"
        type="button"
        onClick={() => onMoveWeek(1)}
      >
        다음 주
      </button>
    </div>
  )
}

function WeekDays({ dateKeys, selectedDate, todayKey, todos, onSelectDate }) {
  return (
    <div className="week-days" aria-label="이번 주 날짜 목록">
      {dateKeys.map((dateKey, index) => {
        const date = getDateFromKey(dateKey)
        const className = [
          'day-button',
          dateKey === selectedDate ? 'is-selected' : '',
          dateKey === todayKey ? 'is-today' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={dateKey}
            className={className}
            type="button"
            aria-label={`${dateKey} Todo 보기`}
            onClick={() => onSelectDate(dateKey)}
          >
            <span className="day-name">{WEEKDAY_NAMES[index]}</span>
            <span className="day-date">{date.getDate()}</span>
            <span className="day-count">
              {getTodoCountByDate(todos, dateKey)}개
            </span>
          </button>
        )
      })}
    </div>
  )
}

function TodoForm({ todoText, onTodoTextChange, onSubmit }) {
  return (
    <form className="todo-form" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="todo-input">
        할 일 입력
      </label>
      <input
        id="todo-input"
        className="todo-input"
        type="text"
        value={todoText}
        placeholder="할 일을 입력하세요"
        autoComplete="off"
        onChange={(event) => onTodoTextChange(event.target.value)}
      />
      <button className="primary-button" type="submit">
        추가
      </button>
    </form>
  )
}

function FilterTabs({ currentFilter, onFilterChange }) {
  return (
    <div className="filter-tabs" aria-label="Todo 상태 필터">
      {FILTER_OPTIONS.map((filter) => (
        <button
          key={filter.value}
          className={`filter-tab${
            currentFilter === filter.value ? ' is-active' : ''
          }`}
          type="button"
          aria-pressed={currentFilter === filter.value}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

function TodoList({ todos, onToggle, onDelete, onEdit }) {
  return (
    <ul className="todo-list" aria-label="Todo 목록">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  return (
    <li className={`todo-item${todo.isCompleted ? ' is-completed' : ''}`}>
      <span className="todo-text">{todo.text}</span>
      <div className="todo-actions">
        <button
          className="todo-button"
          type="button"
          onClick={() => onEdit(todo.id)}
        >
          수정
        </button>
        <button
          className="todo-button"
          type="button"
          onClick={() => onToggle(todo.id)}
        >
          {todo.isCompleted ? '취소' : '완료'}
        </button>
        <button
          className="todo-button delete-button"
          type="button"
          onClick={() => onDelete(todo.id)}
        >
          삭제
        </button>
      </div>
    </li>
  )
}

export default App
