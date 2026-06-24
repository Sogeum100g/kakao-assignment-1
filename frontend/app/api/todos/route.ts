import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not configured");
}

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

export async function GET(request: NextRequest) {
  return forwardToFastAPI(`/todos${request.nextUrl.search}`, {
    cache: "no-store",
  });
}

export async function POST(request: NextRequest) {
  return forwardToFastAPI("/todos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
}
