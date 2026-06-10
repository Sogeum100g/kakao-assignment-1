const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const message = document.querySelector("#message");
const filterTabs = document.querySelectorAll(".filter-tab");
const weekRange = document.querySelector("#week-range");
const weekDays = document.querySelector("#week-days");
const previousWeekButton = document.querySelector("#previous-week-button");
const nextWeekButton = document.querySelector("#next-week-button");

const STORAGE_KEY = "dailyTodoList";

let todos = [];
let nextTodoId = 1;
let currentFilter = "all";
let selectedDate = getDateKey(new Date());

// 안내 메시지를 한 곳에서 관리해 빈 입력 같은 사용자 피드백을 표시합니다.
function showMessage(text) {
  message.textContent = text;
}

// Todo 배열을 JSON 문자열로 바꿔 로컬스토리지에 저장합니다.
function saveTodosToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 로컬스토리지에 저장된 JSON 문자열을 다시 Todo 배열로 복원합니다.
function loadTodosFromLocalStorage() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);
  if (!savedTodos) return;

  todos = JSON.parse(savedTodos);
  nextTodoId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
}

// 날짜 비교에 사용하기 좋은 YYYY-MM-DD 형태의 키를 만듭니다.
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 날짜 키를 Date 객체로 바꿔 이전/다음 날짜 계산에 사용합니다.
function getDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// 선택된 날짜가 포함된 주의 월요일 날짜를 구합니다.
function getWeekStartDate(dateKey) {
  const date = getDateFromKey(dateKey);
  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  date.setDate(date.getDate() - daysFromMonday);
  return date;
}

// 현재 주의 월요일부터 일요일까지 날짜 키를 배열로 만듭니다.
function getWeekDateKeys() {
  const weekStartDate = getWeekStartDate(selectedDate);
  const weekDateKeys = [];

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    weekDateKeys.push(getDateKey(date));
  }

  return weekDateKeys;
}

// 주간 범위를 사용자가 읽기 좋은 형식으로 표시합니다.
function updateWeekRangeText() {
  const weekDateKeys = getWeekDateKeys();
  const startDate = getDateFromKey(weekDateKeys[0]);
  const endDate = getDateFromKey(weekDateKeys[6]);

  weekRange.textContent = `${startDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  })} - ${endDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  })}`;
}

// 날짜별 Todo 개수를 계산해 주간 날짜 버튼 아래에 보여줍니다.
function getTodoCountByDate(dateKey) {
  return todos.filter((todo) => todo.date === dateKey).length;
}

// 이번 주 월요일부터 일요일까지의 날짜 버튼을 다시 그립니다.
function renderWeekDays() {
  const todayKey = getDateKey(new Date());
  const weekdayNames = ["월", "화", "수", "목", "금", "토", "일"];

  weekDays.innerHTML = "";

  getWeekDateKeys().forEach((dateKey, index) => {
    const date = getDateFromKey(dateKey);
    const dayButton = document.createElement("button");
    dayButton.className = "day-button";
    dayButton.type = "button";
    dayButton.dataset.date = dateKey;
    dayButton.setAttribute("aria-label", `${dateKey} Todo 보기`);

    if (dateKey === selectedDate) {
      dayButton.classList.add("is-selected");
    }

    if (dateKey === todayKey) {
      dayButton.classList.add("is-today");
    }

    dayButton.innerHTML = `
      <span class="day-name">${weekdayNames[index]}</span>
      <span class="day-date">${date.getDate()}</span>
      <span class="day-count">${getTodoCountByDate(dateKey)}개</span>
    `;

    weekDays.append(dayButton);
  });
}

// 주간 날짜 영역과 Todo 목록을 함께 갱신합니다.
function renderCalendar() {
  updateWeekRangeText();
  renderWeekDays();
  renderTodos();
}

// 주 이동 버튼을 누르면 같은 요일 기준으로 이전/다음 주를 표시합니다.
function moveSelectedWeek(weekOffset) {
  const date = getDateFromKey(selectedDate);
  date.setDate(date.getDate() + weekOffset * 7);
  selectedDate = getDateKey(date);

  renderCalendar();
}

// 현재 선택된 필터에 맞는 Todo만 골라 화면에 표시할 준비를 합니다.
function getFilteredTodos() {
  const todosForSelectedDate = todos.filter((todo) => todo.date === selectedDate);

  if (currentFilter === "active") {
    return todosForSelectedDate.filter((todo) => !todo.isCompleted);
  }

  if (currentFilter === "completed") {
    return todosForSelectedDate.filter((todo) => todo.isCompleted);
  }

  return todosForSelectedDate;
}

// Todo 목록 데이터를 기준으로 화면의 목록을 다시 그립니다.
function renderTodos() {
  todoList.innerHTML = "";

  getFilteredTodos().forEach((todo) => {
    const todoItem = document.createElement("li");
    todoItem.className = "todo-item";
    todoItem.dataset.id = String(todo.id);

    if (todo.isCompleted) {
      todoItem.classList.add("is-completed");
    }

    const todoText = document.createElement("span");
    todoText.className = "todo-text";
    todoText.textContent = todo.text;

    const actionGroup = document.createElement("div");
    actionGroup.className = "todo-actions";

    const editButton = createActionButton("수정", "edit");
    const completeButton = createActionButton(todo.isCompleted ? "취소" : "완료", "complete");
    const deleteButton = createActionButton("삭제", "delete");
    deleteButton.classList.add("delete-button");

    actionGroup.append(editButton, completeButton, deleteButton);
    todoItem.append(todoText, actionGroup);
    todoList.append(todoItem);
  });
}

// 선택된 필터 탭에만 활성 클래스를 적용해 현재 상태를 시각적으로 구분합니다.
function updateActiveFilterTab() {
  filterTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.filter === currentFilter);
  });
}

// 버튼 생성 방식을 분리해 각 Todo 항목의 버튼 구조를 일정하게 유지합니다.
function createActionButton(label, action) {
  const button = document.createElement("button");
  button.className = "todo-button";
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  return button;
}

// 입력된 텍스트로 새 Todo를 생성합니다.
function addTodo(text) {
  todos.push({
    id: nextTodoId,
    text,
    date: selectedDate,
    isCompleted: false,
  });

  nextTodoId += 1;
  saveTodosToLocalStorage();
  renderCalendar();
}

// Todo 내용을 prompt로 수정하고, 빈 값이면 기존 내용을 유지합니다.
function editTodo(todoId) {
  const targetTodo = todos.find((todo) => todo.id === todoId);
  if (!targetTodo) return;

  const editedText = window.prompt("수정할 내용을 입력하세요.", targetTodo.text);
  if (editedText === null) return;

  const trimmedText = editedText.trim();
  if (!trimmedText) {
    showMessage("수정할 내용을 입력해 주세요.");
    return;
  }

  targetTodo.text = trimmedText;
  saveTodosToLocalStorage();
  showMessage("");
  renderCalendar();
}

// 완료 상태를 반대로 바꿔 취소선 표시 여부를 갱신합니다.
function toggleTodoCompletion(todoId) {
  const targetTodo = todos.find((todo) => todo.id === todoId);
  if (!targetTodo) return;

  targetTodo.isCompleted = !targetTodo.isCompleted;
  saveTodosToLocalStorage();
  renderCalendar();
}

// 선택한 Todo를 목록 데이터에서 제거합니다.
function deleteTodo(todoId) {
  todos = todos.filter((todo) => todo.id !== todoId);
  saveTodosToLocalStorage();
  renderCalendar();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const todoText = todoInput.value.trim();

  if (!todoText) {
    showMessage("할 일을 입력해 주세요.");
    return;
  }

  addTodo(todoText);
  todoInput.value = "";
  showMessage("");
  todoInput.focus();
});

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentFilter = tab.dataset.filter;
    updateActiveFilterTab();
    renderTodos();
  });
});

previousWeekButton.addEventListener("click", () => {
  moveSelectedWeek(-1);
});

nextWeekButton.addEventListener("click", () => {
  moveSelectedWeek(1);
});

weekDays.addEventListener("click", (event) => {
  const clickedDay = event.target.closest(".day-button");
  if (!clickedDay) return;

  selectedDate = clickedDay.dataset.date;
  renderCalendar();
});

todoList.addEventListener("click", (event) => {
  const clickedButton = event.target.closest("button");
  if (!clickedButton) return;

  const todoItem = clickedButton.closest(".todo-item");
  const todoId = Number(todoItem.dataset.id);
  const action = clickedButton.dataset.action;

  if (action === "edit") {
    editTodo(todoId);
  }

  if (action === "complete") {
    toggleTodoCompletion(todoId);
  }

  if (action === "delete") {
    deleteTodo(todoId);
  }
});

loadTodosFromLocalStorage();
renderCalendar();
