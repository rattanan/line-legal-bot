"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";

type ChatLog = {
  userId: string;
  question: string;
  answer: string;
  source: string;
};

export default function ChatLogPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [userId, setUserId] = useState("");
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!userId.trim()) {
      setLogs([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/chat-log?userId=${encodeURIComponent(userId)}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to load chat logs (${res.status})`);
      }

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat logs");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId.trim()) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(244,244,245,0.95),white_42%,#f8fafc_100%)] text-zinc-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-black/5 bg-white/80 p-6 shadow-[0_10px_40px_rgba(24,24,27,0.06)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Chat log</span>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Conversation history</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                ใส่ `userId` เพื่อดูประวัติข้อความล่าสุด พร้อม source ของคำตอบในมุมมองที่อ่านง่ายขึ้น
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={fetchLogs}
              disabled={isLoading || !userId.trim()}
            >
              {isLoading ? "Loading..." : "Load logs"}
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-700">User ID</span>
              <input
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                placeholder="Enter user id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-700">Limit</span>
              <input
                type="number"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                placeholder="20"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </label>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <p className="text-sm text-zinc-500">
                {logs.length > 0 ? `${logs.length} result(s)` : "No logs loaded yet"}
              </p>
            </div>

            <div className="divide-y divide-zinc-100">
              {logs.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-zinc-500">
                  Enter a user ID and load the conversation history.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <article key={idx} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_140px] lg:items-start">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Question</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-900">{log.question}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Answer</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{log.answer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Source</p>
                      <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {log.source}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
