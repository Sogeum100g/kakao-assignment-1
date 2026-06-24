import Link from "next/link";
import { createTodo, getTodos } from "./actions";
import TodoList from "./TodoList";
import TodoSearch from "./TodoSearch";
import type { Todo } from "./types";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행 중" },
  { value: "completed", label: "완료" },
] as const;
const WEEKDAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

type TodoFilter = (typeof FILTER_OPTIONS)[number]["value"];

type TodosPageProps = {
  searchParams: Promise<{
    date?: string;
    filter?: string;
    search?: string;
  }>;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekStartDate(dateKey: string) {
  const date = getDateFromKey(dateKey);
  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  date.setDate(date.getDate() - daysFromMonday);
  return date;
}

function getWeekDateKeys(selectedDate: string) {
  const weekStartDate = getWeekStartDate(selectedDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    return getDateKey(date);
  });
}

function getWeekRangeText(weekDateKeys: string[]) {
  const startDate = getDateFromKey(weekDateKeys[0]);
  const endDate = getDateFromKey(weekDateKeys[6]);

  return `${startDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  })} - ${endDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  })}`;
}

function moveWeek(selectedDate: string, weekOffset: number) {
  const date = getDateFromKey(selectedDate);
  date.setDate(date.getDate() + weekOffset * 7);
  return getDateKey(date);
}

function isTodoFilter(filter: string | undefined): filter is TodoFilter {
  return FILTER_OPTIONS.some((option) => option.value === filter);
}

function getTodosByDate(todos: Todo[], selectedDate: string) {
  return todos.filter((todo) => todo.date === selectedDate);
}

function getTodoCountByDateMap(todos: Todo[]) {
  return todos.reduce<Map<string, number>>((countMap, todo) => {
    countMap.set(todo.date, (countMap.get(todo.date) ?? 0) + 1);
    return countMap;
  }, new Map());
}

function createTodosHref(
  date: string,
  filter: TodoFilter = "all",
  search = "",
) {
  const params = new URLSearchParams({ date });

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (search) {
    params.set("search", search);
  }

  return `/todos?${params.toString()}`;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const params = await searchParams;
  const todayKey = getDateKey(new Date());
  const selectedDate = params.date ?? todayKey;
  const currentFilter = isTodoFilter(params.filter) ? params.filter : "all";
  const search = params.search?.trim() ?? "";
  const todos = await getTodos({
    filter: currentFilter,
    search,
  });
  const weekDateKeys = getWeekDateKeys(selectedDate);
  const weekRangeText = getWeekRangeText(weekDateKeys);
  const filteredTodos = getTodosByDate(todos, selectedDate);
  const todoCountByDate = getTodoCountByDateMap(todos);

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-emerald-700">Weekly Todo</p>
          <h1 className="text-3xl font-semibold tracking-normal">오늘의 할 일</h1>
        </header>

        <section
          aria-label="주간 Todo 날짜 이동"
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
        >
          <Link
            href={createTodosHref(moveWeek(selectedDate, -1), currentFilter, search)}
            className="rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            이전 주
          </Link>
          <p className="text-center text-base font-semibold text-zinc-900">
            {weekRangeText}
          </p>
          <Link
            href={createTodosHref(moveWeek(selectedDate, 1), currentFilter, search)}
            className="rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            다음 주
          </Link>
        </section>

        <section
          aria-label="이번 주 날짜 목록"
          className="grid grid-cols-7 gap-2 overflow-x-auto"
        >
          {weekDateKeys.map((dateKey, index) => {
            const date = getDateFromKey(dateKey);
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;

            return (
              <Link
                key={dateKey}
                href={createTodosHref(dateKey, currentFilter, search)}
                aria-label={`${dateKey} Todo 보기`}
                className={`min-w-16 rounded-lg border p-2 text-center transition ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-emerald-700"
                } ${isToday && !isSelected ? "border-emerald-700" : ""}`}
              >
                <span className="block text-xs font-semibold">
                  {WEEKDAY_NAMES[index]}
                </span>
                <span className="mt-1 block text-lg font-bold">
                  {date.getDate()}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    isSelected ? "text-emerald-50" : "text-zinc-500"
                  }`}
                >
                  {todoCountByDate.get(dateKey) ?? 0}개
                </span>
              </Link>
            );
          })}
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <div>
              <p className="text-sm font-medium text-zinc-500">일간 뷰</p>
              <h2 className="text-xl font-semibold">
                {getDateFromKey(selectedDate).toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h2>
            </div>
          </div>

          <form action={createTodo} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="date" value={selectedDate} />
            <label className="sr-only" htmlFor="todo-title">
              할 일 입력
            </label>
            <input
              id="todo-title"
              name="title"
              required
              autoComplete="off"
              placeholder="할 일을 입력하세요"
              className="min-h-11 flex-1 rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              추가
            </button>
          </form>

          <TodoSearch initialSearch={search} />

          <nav className="grid grid-cols-3 gap-2" aria-label="Todo 상태 필터">
            {FILTER_OPTIONS.map((filter) => (
              <Link
                key={filter.value}
                href={createTodosHref(selectedDate, filter.value, search)}
                className={`rounded-md px-3 py-2 text-center text-sm font-semibold transition ${
                  currentFilter === filter.value
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </nav>
        </section>

        <TodoList todos={filteredTodos} />
      </section>
    </main>
  );
}
