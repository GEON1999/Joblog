import { describe, expect, it } from "vitest";

import { collectExtraLabels, parseOfferExtras } from "./offer";

describe("parseOfferExtras", () => {
  it("'라벨: 값' 줄을 파싱한다", () => {
    expect(parseOfferExtras("스톡옵션: 있음\n사이닝보너스: 500만원")).toEqual([
      { label: "스톡옵션", value: "있음" },
      { label: "사이닝보너스", value: "500만원" },
    ]);
  });

  it("콜론 없는 줄과 빈 줄은 무시한다", () => {
    expect(parseOfferExtras("메모만 있음\n\n복지: 좋음")).toEqual([
      { label: "복지", value: "좋음" },
    ]);
  });

  it("값 안의 콜론은 첫 콜론만 기준으로 나눠 보존한다", () => {
    expect(parseOfferExtras("근무시간: 10:00~19:00")).toEqual([
      { label: "근무시간", value: "10:00~19:00" },
    ]);
  });

  it("같은 라벨은 마지막 값이 이긴다", () => {
    expect(parseOfferExtras("복지: 보통\n복지: 좋음")).toEqual([{ label: "복지", value: "좋음" }]);
  });
});

describe("collectExtraLabels", () => {
  it("여러 오퍼의 라벨을 처음 등장 순서로 합집합한다", () => {
    const offers = [
      {
        extras: [
          { label: "스톡옵션", value: "있음" },
          { label: "복지", value: "좋음" },
        ],
      },
      {
        extras: [
          { label: "복지", value: "보통" },
          { label: "재택", value: "주3일" },
        ],
      },
    ];
    expect(collectExtraLabels(offers)).toEqual(["스톡옵션", "복지", "재택"]);
  });

  it("빈 목록은 빈 배열", () => {
    expect(collectExtraLabels([])).toEqual([]);
  });
});
