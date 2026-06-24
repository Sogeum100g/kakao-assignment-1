import Link from "next/link";
import { notFound } from "next/navigation";
import { getTodo, updateTodo } from "../actions";

export const dynamic = "force-dynamic";

type EditTodoPageProps = {
  params: Promise<{
    todoId: string;
  }>;
};

export default async function EditTodoPage({ params }: EditTodoPageProps) {
  const { todoId } = await params;
  const todo = await getTodo(todoId);

  if (!todo) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link href="/todos" className="text-sm font-medium text-emerald-700">
            목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Todo 수정</h1>
          <p className="text-sm text-zinc-600">
            제목과 완료 여부를 변경할 수 있습니다.
          </p>
        </header>

        <form
          action={updateTodo.bind(null, todo.id)}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            할 일
            <input
              name="title"
              required
              defaultValue={todo.title}
              className="min-h-11 rounded-md border border-zinc-300 px-3 text-base font-normal text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            날짜
            <input
              name="date"
              type="date"
              required
              defaultValue={todo.date}
              className="min-h-11 rounded-md border border-zinc-300 px-3 text-base font-normal text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
            <input
              name="completed"
              type="checkbox"
              defaultChecked={todo.completed}
              className="h-5 w-5 rounded border-zinc-300 accent-emerald-700"
            />
            완료됨
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              저장
            </button>
            <Link
              href="/todos"
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
