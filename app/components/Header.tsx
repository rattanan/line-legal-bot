"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-black/5 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-950">
          Line Legal Bot
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <Link href="/" className="rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
            Home
          </Link>
          <Link href="/chat-test" className="rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
            Chat Test
          </Link>
          <Link href="/faq" className="rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
            FAQ
          </Link>
          <Link href="/chat-log" className="rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
            Chat Log
          </Link>
        </div>
      </nav>
    </header>
  );
}
