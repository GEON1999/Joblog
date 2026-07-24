import { daysInStage } from "./days-in-stage";

// 이 일수를 넘도록 진행중인데 등록된 액션이 없으면 팔로업이 필요하다고 본다
export const FOLLOW_UP_THRESHOLD_DAYS = 7;

/**
 * 팔로업 필요 여부. 저장하지 않는 파생 상태다 — CONTEXT.md.
 * 진행중이고, 현재 단계 체류가 기준을 넘었으며, 미완료 액션이 하나도 없을 때 true.
 */
export function needsFollowUp(params: {
  isInProgress: boolean;
  stageEnteredAt: Date;
  now: Date;
  hasPendingAction: boolean;
}): boolean {
  if (!params.isInProgress || params.hasPendingAction) {
    return false;
  }
  return daysInStage(params.stageEnteredAt, params.now) > FOLLOW_UP_THRESHOLD_DAYS;
}
