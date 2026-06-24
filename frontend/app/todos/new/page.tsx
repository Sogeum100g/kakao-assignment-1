import Link from "next/link";
import { createTodo } from "../actions";

type NewTodoPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function NewTodoPage({ searchParams }: NewTodoPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ?? getDateKey(new Date());

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link
            href={`/todos?date=${selectedDate}`}
            className="text-sm font-medium text-emerald-700"
          >
            목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Todo 생성</h1>
          <p className="text-sm text-zinc-600">
            새로 등록할 할 일을 입력해주세요.
          </p>
        </header>

        <form
          action={createTodo}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            할 일
            <input
              name="title"
              required
              className="min-h-11 rounded-md border border-zinc-300 px-3 text-base font-normal text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="새 할 일을 입력하세요"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            날짜
            <input
              name="date"
              type="date"
              required
              defaultValue={selectedDate}
              className="min-h-11 rounded-md border border-zinc-300 px-3 text-base font-normal text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              생성
            </button>
            <Link
              href={`/todos?date=${selectedDate}`}
              className="min-h-11 rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              취소
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
