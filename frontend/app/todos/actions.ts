"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Todo } from "./types";

async function getBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Host header is missing");
  }

  return `${protocol}://${host}`;
}

async function fetchApi(path: string, init?: RequestInit) {
  const baseUrl = await getBaseUrl();

  return fetch(`${baseUrl}${path}`, init);
}

type GetTodosParams = {
  filter?: string;
  search?: string;
};

export async function getTodos(params: GetTodosParams = {}): Promise<Todo[]> {
  const searchParams = new URLSearchParams();

  if (params.filter && params.filter !== "all") {
    searchParams.set("filter", params.filter);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const queryString = searchParams.toString();
  const response = await fetchApi(`/api/todos${queryString ? `?${queryString}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }

  return response.json();
}

export async function getTodo(todoId: string): Promise<Todo | null> {
  const response = await fetchApi(`/api/todos/${todoId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch todo");
  }

  return response.json();
}

export async function createTodo(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();

  if (!title) {
    throw new Error("Title is required");
  }

  if (!date) {
    throw new Error("Date is required");
  }

  const response = await fetchApi("/api/todos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, date }),
  });

  if (!response.ok) {
    throw new Error("Failed to create todo");
  }

  revalidatePath("/todos");
  redirect(`/todos?date=${date}`);
}

export async function updateTodo(todoId: number, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const completed = formData.get("completed") === "on";

  if (!title) {
    throw new Error("Title is required");
  }

  if (!date) {
    throw new Error("Date is required");
  }

  const response = await fetchApi(`/api/todos/${todoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      date,
      completed,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update todo");
  }

  revalidatePath("/todos");
  redirect(`/todos?date=${date}`);
}

export async function toggleTodo(todoId: number, completed: boolean) {
  const response = await fetchApi(`/api/todos/${todoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      completed: !completed,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update todo");
  }

  revalidatePath("/todos");
}

export async function deleteTodo(todoId: number) {
  const response = await fetchApi(`/api/todos/${todoId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete todo");
  }

  revalidatePath("/todos");
}
