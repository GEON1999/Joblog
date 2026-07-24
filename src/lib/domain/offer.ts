import type { ContractType, Offer, OfferExtra, WorkMode } from "@/lib/db/schema";

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: "정규",
  contract: "계약",
  freelance: "프리랜서",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  office: "사무실",
  remote: "재택",
  hybrid: "하이브리드",
};

/**
 * 자유 항목 입력을 파싱한다. 한 줄에 "라벨: 값" 하나.
 * 콜론 없는 줄·빈 줄은 무시하고, 첫 콜론만 기준으로 나눈다(값 안의 콜론 허용).
 * 같은 라벨은 마지막 값이 이긴다.
 */
export function parseOfferExtras(input: string): OfferExtra[] {
  const byLabel = new Map<string, string>();
  for (const line of input.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const label = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (label && value) {
      byLabel.set(label, value);
    }
  }
  return [...byLabel].map(([label, value]) => ({ label, value }));
}

/** 오퍼들의 자유 항목 라벨을 합집합으로 모은다. 처음 등장한 순서를 보존한다. */
export function collectExtraLabels(offers: Pick<Offer, "extras">[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const offer of offers) {
    for (const extra of offer.extras) {
      if (!seen.has(extra.label)) {
        seen.add(extra.label);
        labels.push(extra.label);
      }
    }
  }
  return labels;
}

/** 자유 항목을 라벨→값 맵으로. 비교표에서 특정 라벨 값을 뽑을 때 쓴다. */
export function extrasToMap(extras: OfferExtra[]): Map<string, string> {
  return new Map(extras.map((extra) => [extra.label, extra.value]));
}
