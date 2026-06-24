export default function TodosLoading() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] px-5 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="h-9 w-40 rounded bg-zinc-200" />
          <div className="h-4 w-52 rounded bg-zinc-200" />
        </header>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="h-4 w-3/4 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
