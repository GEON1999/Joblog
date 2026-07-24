// 온보딩 샘플 데이터 식별용 마커/이름 (ADR 0010).
// 샘플 회사명에 마커를 붙여, "샘플 비우기"가 사용자의 실데이터를 건드리지 않고
// 샘플 회사와 그에 딸린 지원만 골라 지울 수 있게 한다.
export const SAMPLE_COMPANY_MARKER = "(샘플)";

// seedSampleData 가 만드는 회사명 집합 — 시드/클리어/존재확인이 이 목록 하나를 공유한다
export const SAMPLE_COMPANY_NAMES = ["Acme", "Globex", "Initech"].map(
  (base) => `${base} ${SAMPLE_COMPANY_MARKER}`,
);
