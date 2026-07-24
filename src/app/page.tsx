import Link from "next/link";

import { KanbanBoard } from "@/components/kanban/board";
import { needsFollowUp } from "@/lib/domain/follow-up";
import { getBoardCards } from "@/lib/queries/board";
import { getApplicationIdsWithPendingActions } from "@/lib/queries/next-actions";
import { createClient } from "@/lib/supabase/server";

import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [boardCards, pendingActionIds] = await Promise.all([
    getBoardCards(),
    getApplicationIdsWithPendingActions(),
  ]);
  const now = new Date();
  const cards = boardCards.map((card) => ({
    ...card,
    followUpNeeded: needsFollowUp({
      isInProgress: true, // 보드는 진행중 지원만 담는다
      stageEnteredAt: card.stageEnteredAt,
      now,
      hasPendingAction: pendingActionIds.has(card.id),
    }),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">JobLog</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/questions" className="text-gray-500 hover:underline">
            질문 은행
          </Link>
          <Link href="/offers" className="text-gray-500 hover:underline">
            오퍼
          </Link>
          <Link href="/dashboard" className="text-gray-500 hover:underline">
            대시보드
          </Link>
          <Link href="/archive" className="text-gray-500 hover:underline">
            아카이브
          </Link>
          <Link
            href="/applications/new"
            className="rounded-md bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-700"
          >
            새 지원
          </Link>
          <span className="text-gray-500">{user?.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <KanbanBoard cards={cards} />
    </main>
  );
}
