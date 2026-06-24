"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type TodoSearchProps = {
  initialSearch: string;
};

export default function TodoSearch({ initialSearch }: TodoSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialSearch);

  useEffect(() => {
    const nextSearch = keyword.trim();
    const currentSearch = searchParams.get("search") ?? "";

    if (nextSearch === currentSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextSearch) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, pathname, router, searchParams]);

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
      Todo 검색
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="검색어를 입력하세요"
        className="min-h-11 rounded-md border border-zinc-300 px-3 text-base font-normal text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
