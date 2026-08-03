"use client";

import { useSearchParams } from "next/navigation";

export function SearchForm() {
  const searchParams = useSearchParams();

  return (
    <form action="/" className="flex items-center">
      <label className="hidden items-center gap-2 rounded-full bg-keytabee-surface-muted px-4 py-2.5 sm:flex sm:w-[260px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-keytabee-ink-muted">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8} />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
        <input
          type="text"
          name="search"
          autoComplete="off"
          placeholder="Cari desain..."
          defaultValue={searchParams.get("search") ?? ""}
          className="w-full bg-transparent text-[13px] text-keytabee-ink placeholder:text-keytabee-ink-muted focus:outline-none"
        />
      </label>
      <button type="submit" aria-label="Cari" className="sm:hidden">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8} />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
