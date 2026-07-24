"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition, type RefObject } from "react";

import { moveApplicationStage } from "@/app/applications/actions";
import type { Stage } from "@/lib/db/schema";
import { daysInStage } from "@/lib/domain/days-in-stage";
import { STAGE_LABELS, STAGES } from "@/lib/domain/stage";

export interface KanbanCard {
  id: string;
  title: string;
  companyName: string;
  stage: Stage;
  stageEnteredAt: Date;
}

type MoveInput = { id: string; toStage: Stage };

export function KanbanBoard({ cards }: { cards: KanbanCard[] }) {
  // 드롭 즉시 화면에 반영하고, 서버 확정(revalidate) 후 실제 데이터로 교체된다.
  // 서버에서 거부되면 revalidate가 원래 상태로 되돌린다
  const [optimisticCards, applyMove] = useOptimistic(cards, (state, { id, toStage }: MoveInput) =>
    state.map((card) =>
      card.id === id ? { ...card, stage: toStage, stageEnteredAt: new Date() } : card,
    ),
  );
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [, startTransition] = useTransition();
  // 드래그를 놓는 순간 브라우저는 click도 발생시킨다 — 카드가 링크라서
  // 그 click이 상세 페이지 이동으로 새지 않게 드래그 직후 한 번 억제한다
  const suppressClick = useRef(false);

  // Pointer+Touch를 같이 쓰면 터치 기기에서 이중 활성화된다 — Mouse/Touch 분리가 표준 조합.
  // distance 제약은 클릭을, delay 제약은 스크롤을 드래그로 오인하지 않게 한다
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    suppressClick.current = true;
    const card = optimisticCards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function releaseClickSuppression() {
    // click 이벤트가 처리된 다음 틱에 해제한다
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    releaseClickSuppression();
    const { active, over } = event;
    if (!over) return;

    const card = optimisticCards.find((c) => c.id === active.id);
    const toStage = over.id as Stage;
    if (!card || card.stage === toStage) return;

    startTransition(async () => {
      applyMove({ id: card.id, toStage });
      await moveApplicationStage(card.id, toStage);
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveCard(null);
        releaseClickSuppression();
      }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            cards={optimisticCards.filter((card) => card.stage === stage)}
            suppressClick={suppressClick}
          />
        ))}
      </section>
      <DragOverlay>{activeCard && <CardContent card={activeCard} overlay />}</DragOverlay>
    </DndContext>
  );
}

function StageColumn({
  stage,
  cards,
  suppressClick,
}: {
  stage: Stage;
  cards: KanbanCard[];
  suppressClick: RefObject<boolean>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-3 transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-gray-100"}`}
    >
      <h2 className="flex items-baseline justify-between text-sm font-semibold">
        {STAGE_LABELS[stage]}
        <span className="text-xs font-normal text-gray-500">{cards.length}</span>
      </h2>
      <ul className="mt-3 flex min-h-8 flex-col gap-2">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} suppressClick={suppressClick} />
        ))}
      </ul>
    </div>
  );
}

function DraggableCard({
  card,
  suppressClick,
}: {
  card: KanbanCard;
  suppressClick: RefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-manipulation ${isDragging ? "opacity-30" : ""}`}
    >
      <Link
        href={`/applications/${card.id}`}
        className="block"
        onClick={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
          }
        }}
      >
        <CardContent card={card} />
      </Link>
    </li>
  );
}

function CardContent({ card, overlay = false }: { card: KanbanCard; overlay?: boolean }) {
  return (
    <div className={`rounded-md border border-gray-200 bg-white p-3 ${overlay ? "shadow-lg" : ""}`}>
      <p className="text-xs text-gray-500">{card.companyName}</p>
      <p className="mt-0.5 text-sm font-medium">{card.title}</p>
      <p className="mt-1.5 text-xs text-gray-400">
        {daysInStage(card.stageEnteredAt, new Date())}일째
      </p>
    </div>
  );
}
