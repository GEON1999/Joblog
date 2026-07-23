import Link from "next/link";

import { daysInStage } from "@/lib/domain/days-in-stage";
import { STAGE_LABELS, STAGES } from "@/lib/domain/stage";
import { getBoardCards } from "@/lib/queries/board";
import { createClient } from "@/lib/supabase/server";

import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cards = await getBoardCards();
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">JobLog</h1>
        <div className="flex items-center gap-3 text-sm">
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

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage) => {
          const stageCards = cards.filter((card) => card.stage === stage);
          return (
            <div key={stage} className="rounded-lg bg-gray-100 p-3">
              <h2 className="flex items-baseline justify-between text-sm font-semibold">
                {STAGE_LABELS[stage]}
                <span className="text-xs font-normal text-gray-500">{stageCards.length}</span>
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {stageCards.map((card) => (
                  <li key={card.id} className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-xs text-gray-500">{card.companyName}</p>
                    <p className="mt-0.5 text-sm font-medium">{card.title}</p>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {daysInStage(card.stageEnteredAt, now)}일째
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
