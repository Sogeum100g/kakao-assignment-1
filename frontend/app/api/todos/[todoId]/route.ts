import { NextRequest, NextResponse } from "next/server";
import type { Todo } from "@/app/todos/types";

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured");
}

type TodoRouteContext = {
  params: Promise<{
    todoId: string;
  }>;
};

async function forwardToFastAPI(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const body = await response.text();

  return new NextResponse(body || null, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(_request: NextRequest, { params }: TodoRouteContext) {
  const { todoId } = await params;
  const response = await fetch(`${API_BASE_URL}/todos`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status });
  }

  const todos: Todo[] = await response.json();
  const todo = todos.find((currentTodo) => currentTodo.id === Number(todoId));

  if (!todo) {
    return NextResponse.json({ detail: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(todo);
}

export async function PUT(request: NextRequest, { params }: TodoRouteContext) {
  const { todoId } = await params;

  return forwardToFastAPI(`/todos/${todoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: TodoRouteContext,
) {
  const { todoId } = await params;

  return forwardToFastAPI(`/todos/${todoId}`, {
    method: "DELETE",
  });
}
