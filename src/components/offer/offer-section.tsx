import { upsertOffer } from "@/app/offers/actions";
import type { Offer } from "@/lib/db/schema";
import { CONTRACT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/domain/offer";

function crunchDefault(crunch: boolean | null): string {
  if (crunch === null) return "";
  return crunch ? "yes" : "no";
}

export function OfferSection({
  applicationId,
  offer,
  error,
}: {
  applicationId: string;
  offer: Offer | null;
  error?: string;
}) {
  const extrasText = offer?.extras.map((e) => `${e.label}: ${e.value}`).join("\n") ?? "";

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-gray-700">오퍼</h2>
      <p className="mt-1 text-xs text-gray-500">
        기록한 처우는{" "}
        <a href="/offers" className="hover:underline">
          오퍼 비교표
        </a>
        에서 다른 오퍼와 나란히 볼 수 있습니다.
      </p>

      <form
        action={upsertOffer.bind(null, applicationId)}
        className="mt-3 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            연봉 <span className="text-xs font-normal text-gray-400">(만원)</span>
            <input
              type="number"
              name="annualSalary"
              min={0}
              step={1}
              defaultValue={offer?.annualSalary ?? ""}
              placeholder="예: 6000"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 focus:border-gray-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            크런치
            <select
              name="crunch"
              defaultValue={crunchDefault(offer?.crunch ?? null)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 focus:border-gray-500 focus:outline-none"
            >
              <option value="">미확인</option>
              <option value="no">없음</option>
              <option value="yes">있음</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            계약 형태
            <select
              name="contractType"
              defaultValue={offer?.contractType ?? ""}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 focus:border-gray-500 focus:outline-none"
            >
              <option value="">미정</option>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            근무 형태
            <select
              name="workMode"
              defaultValue={offer?.workMode ?? ""}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 focus:border-gray-500 focus:outline-none"
            >
              <option value="">미정</option>
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          자유 항목 <span className="text-xs font-normal text-gray-400">(한 줄에 “라벨: 값”)</span>
          <textarea
            name="extras"
            rows={4}
            defaultValue={extrasText}
            placeholder={"스톡옵션: 있음\n사이닝보너스: 500만원"}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-gray-500 focus:outline-none"
          />
        </label>
        {error === "invalid-salary" && (
          <p className="text-sm text-red-600">연봉은 0 이상의 정수여야 합니다.</p>
        )}
        {error === "not-offer-stage" && (
          <p className="text-sm text-red-600">오퍼 단계의 지원만 처우를 기록할 수 있습니다.</p>
        )}
        <button
          type="submit"
          className="self-start rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          {offer ? "오퍼 수정" : "오퍼 기록"}
        </button>
      </form>
    </section>
  );
}
