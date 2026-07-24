import Link from "next/link";

import { KanbanBoard } from "@/components/kanban/board";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { needsFollowUp } from "@/lib/domain/follow-up";
import { getBoardCards } from "@/lib/queries/board";
import { getApplicationIdsWithPendingActions } from "@/lib/queries/next-actions";

export default async function Home() {
  const user = await requireUser();
  const [boardCards, pendingActionIds] = await Promise.all([
    getBoardCards(user.id),
    getApplicationIdsWithPendingActions(user.id),
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
    <AppShell width="wide">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">지원 파이프라인</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            카드를 끌어 단계를 옮기세요. 단계별 체류 일수가 함께 표시됩니다.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          + 새 지원
        </Link>
      </div>
      <KanbanBoard cards={cards} />
    </AppShell>
  );
}
