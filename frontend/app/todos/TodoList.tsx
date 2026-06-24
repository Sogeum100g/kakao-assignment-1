"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { deleteTodo, toggleTodo } from "./actions";
import type { Todo } from "./types";

type TodoListProps = {
  todos: Todo[];
};

type OptimisticAction =
  | {
      type: "toggle";
      todoId: number;
    }
  | {
      type: "delete";
      todoId: number;
    };

export default function TodoList({ todos }: TodoListProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    todos,
    (currentTodos, action: OptimisticAction) => {
      if (action.type === "delete") {
        return currentTodos.filter((todo) => todo.id !== action.todoId);
      }

      return currentTodos.map((todo) =>
        todo.id === action.todoId
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo,
      );
    },
  );

  function handleToggle(todo: Todo) {
    startTransition(async () => {
      updateOptimisticTodos({
        type: "toggle",
        todoId: todo.id,
      });
      await toggleTodo(todo.id, todo.completed);
    });
  }

  function handleDelete(todoId: number) {
    startTransition(async () => {
      updateOptimisticTodos({
        type: "delete",
        todoId,
      });
      await deleteTodo(todoId);
    });
  }

  if (optimisticTodos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
        선택한 날짜에 표시할 Todo가 없습니다.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {optimisticTodos.map((todo) => (
        <li
          key={todo.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-base ${
                todo.completed ? "text-zinc-400 line-through" : "text-zinc-950"
              }`}
            >
              {todo.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {todo.completed ? "완료됨" : "진행 중"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(todo)}
              className="min-h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              {todo.completed ? "완료 취소" : "완료"}
            </button>

            <Link
              href={`/todos/${todo.id}`}
              className="min-h-9 rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              수정
            </Link>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(todo.id)}
              className="min-h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
