"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import {
  applications,
  companies,
  interviewQuestions,
  interviews,
  nextActions,
  offers,
  stageTransitions,
} from "@/lib/db/schema";

// 온보딩 체험용 가상 데이터 (ADR 0010). 완전히 가공된 데이터로, 개인정보를 담지 않는다.
// 신규 가입자가 "샘플 채우기"로 채워진 보드·차트를 즉시 보게 하고, "비우기"로 초기화한다.

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(now: number, n: number): Date {
  return new Date(now - n * DAY);
}

function daysFromNow(now: number, n: number): Date {
  return new Date(now + n * DAY);
}

export async function seedSampleData() {
  const user = await requireUser();
  const now = Date.now();

  await getDb().transaction(async (tx) => {
    const [acme, globex, initech] = await tx
      .insert(companies)
      .values([
        { userId: user.id, name: "Acme (샘플)" },
        { userId: user.id, name: "Globex (샘플)" },
        { userId: user.id, name: "Initech (샘플)" },
      ])
      .returning({ id: companies.id });

    // 서류 단계 진행중
    const [screening] = await tx
      .insert(applications)
      .values({
        userId: user.id,
        companyId: acme.id,
        title: "프론트엔드 엔지니어",
        stage: "screening",
        outcome: "in_progress",
        appliedAt: daysAgo(now, 12),
      })
      .returning({ id: applications.id });
    await tx.insert(stageTransitions).values([
      {
        applicationId: screening.id,
        fromStage: null,
        toStage: "applied",
        occurredAt: daysAgo(now, 12),
      },
      {
        applicationId: screening.id,
        fromStage: "applied",
        toStage: "screening",
        occurredAt: daysAgo(now, 7),
      },
    ]);
    await tx.insert(nextActions).values({
      applicationId: screening.id,
      title: "포트폴리오 링크 회신",
      kind: "follow_up",
      dueAt: daysFromNow(now, 2),
    });

    // 면접 단계 진행중 (면접 + 질문 포함)
    const [interviewing] = await tx
      .insert(applications)
      .values({
        userId: user.id,
        companyId: globex.id,
        title: "시니어 웹 개발자",
        stage: "interview",
        outcome: "in_progress",
        appliedAt: daysAgo(now, 20),
      })
      .returning({ id: applications.id });
    await tx.insert(stageTransitions).values([
      {
        applicationId: interviewing.id,
        fromStage: null,
        toStage: "applied",
        occurredAt: daysAgo(now, 20),
      },
      {
        applicationId: interviewing.id,
        fromStage: "applied",
        toStage: "screening",
        occurredAt: daysAgo(now, 14),
      },
      {
        applicationId: interviewing.id,
        fromStage: "screening",
        toStage: "interview",
        occurredAt: daysAgo(now, 5),
      },
    ]);
    const [interview] = await tx
      .insert(interviews)
      .values({
        applicationId: interviewing.id,
        round: "1차 기술",
        scheduledAt: daysAgo(now, 3),
        format: "화상",
        retrospective: "자료구조 질문에 약했다. 다음엔 복잡도 설명을 준비하자.",
      })
      .returning({ id: interviews.id });
    await tx.insert(interviewQuestions).values({
      interviewId: interview.id,
      question: "가장 도전적이었던 프로젝트는?",
      answerAtTime: "실시간 협업 에디터를 맡았다고 답함",
      preparedAnswer: "CRDT 충돌 해결과 성능 트레이드오프를 구체 수치로 설명",
      tags: ["behavioral", "project"],
    });
    await tx.insert(nextActions).values({
      applicationId: interviewing.id,
      title: "2차 면접 일정 조율",
      kind: "interview",
      dueAt: daysFromNow(now, 4),
    });

    // 오퍼 단계 진행중 (오퍼 처우 포함)
    const [offered] = await tx
      .insert(applications)
      .values({
        userId: user.id,
        companyId: initech.id,
        title: "풀스택 엔지니어",
        stage: "offer",
        outcome: "in_progress",
        appliedAt: daysAgo(now, 35),
      })
      .returning({ id: applications.id });
    await tx.insert(stageTransitions).values([
      {
        applicationId: offered.id,
        fromStage: null,
        toStage: "applied",
        occurredAt: daysAgo(now, 35),
      },
      {
        applicationId: offered.id,
        fromStage: "applied",
        toStage: "screening",
        occurredAt: daysAgo(now, 28),
      },
      {
        applicationId: offered.id,
        fromStage: "screening",
        toStage: "interview",
        occurredAt: daysAgo(now, 18),
      },
      {
        applicationId: offered.id,
        fromStage: "interview",
        toStage: "offer",
        occurredAt: daysAgo(now, 6),
      },
    ]);
    await tx.insert(offers).values({
      applicationId: offered.id,
      annualSalary: 6800,
      contractType: "permanent",
      workMode: "hybrid",
      crunch: false,
      extras: [{ label: "사이닝 보너스", value: "500만원" }],
    });

    // 탈락(종료) — 파이프라인/전환율 차트가 의미 있게 보이도록
    const [rejected] = await tx
      .insert(applications)
      .values({
        userId: user.id,
        companyId: acme.id,
        title: "백엔드 엔지니어",
        stage: "interview",
        outcome: "rejected",
        appliedAt: daysAgo(now, 40),
        closedAt: daysAgo(now, 10),
      })
      .returning({ id: applications.id });
    await tx.insert(stageTransitions).values([
      {
        applicationId: rejected.id,
        fromStage: null,
        toStage: "applied",
        occurredAt: daysAgo(now, 40),
      },
      {
        applicationId: rejected.id,
        fromStage: "applied",
        toStage: "screening",
        occurredAt: daysAgo(now, 32),
      },
      {
        applicationId: rejected.id,
        fromStage: "screening",
        toStage: "interview",
        occurredAt: daysAgo(now, 22),
      },
    ]);
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/offers");
  revalidatePath("/archive");
}

// 현재 유저의 파이프라인 데이터를 비운다 (체험 초기화).
// applications 를 먼저 지우면 자식(transitions·interviews·offers·next_actions)은 cascade 로 정리된다.
// 업로드 문서는 스토리지 파일을 동반하므로 여기서 건드리지 않는다 — 문서는 라이브러리에서 개별 삭제한다.
export async function clearMyData() {
  const user = await requireUser();

  await getDb().transaction(async (tx) => {
    await tx.delete(applications).where(eq(applications.userId, user.id));
    await tx.delete(companies).where(eq(companies.userId, user.id));
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/offers");
  revalidatePath("/archive");
}
