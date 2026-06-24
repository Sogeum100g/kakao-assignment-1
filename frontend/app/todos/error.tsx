"use client";

type TodosErrorProps = {
  error: Error;
  reset: () => void;
};

export default function TodosError({ reset }: TodosErrorProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-red-700">Todo API 오류</p>
        <h1 className="text-2xl font-semibold tracking-normal">
          데이터를 불러오지 못했습니다.
        </h1>
        <p className="text-sm text-zinc-600">
          FastAPI 서버가 실행 중인지 확인한 뒤 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 w-fit rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          다시 시도
        </button>
      </section>
    </main>
  );
}
