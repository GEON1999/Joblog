import type { Metadata } from "next";
import Link from "next/link";

import {
  CONTRACT_TYPE_LABELS,
  WORK_MODE_LABELS,
  collectExtraLabels,
  extrasToMap,
} from "@/lib/domain/offer";
import { getOffersForComparison } from "@/lib/queries/offers";

export const metadata: Metadata = {
  title: "오퍼 비교 — JobLog",
};

export const dynamic = "force-dynamic";

const DASH = "—";

export default async function OffersPage() {
  const rows = await getOffersForComparison();
  const extraLabels = collectExtraLabels(rows.map((row) => row.offer));

  // 연봉 최고치 강조 기준
  const maxSalary = rows.reduce<number | null>((max, { offer }) => {
    if (offer.annualSalary === null) return max;
    return max === null ? offer.annualSalary : Math.max(max, offer.annualSalary);
  }, null);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">오퍼 비교</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 보드로
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-gray-500">
          기록된 오퍼가 없습니다. 오퍼 단계에 도달한 지원의 상세에서 처우를 기록하세요.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-gray-200 p-2 text-left text-xs font-medium text-gray-500">
                  항목
                </th>
                {rows.map(({ offer, applicationId, applicationTitle, companyName }) => (
                  <th
                    key={offer.id}
                    className="border-b border-gray-200 p-2 text-left align-bottom"
                  >
                    <Link href={`/applications/${applicationId}`} className="hover:underline">
                      <span className="block text-xs font-normal text-gray-500">{companyName}</span>
                      <span className="block font-semibold">{applicationTitle}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr className="border-b border-gray-100">
                <th className="p-2 text-left font-medium text-gray-600">연봉</th>
                {rows.map(({ offer }) => (
                  <td
                    key={offer.id}
                    className={`p-2 ${
                      offer.annualSalary !== null && offer.annualSalary === maxSalary
                        ? "font-semibold text-green-700"
                        : ""
                    }`}
                  >
                    {offer.annualSalary === null
                      ? DASH
                      : `${offer.annualSalary.toLocaleString()}만원`}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <th className="p-2 text-left font-medium text-gray-600">계약 형태</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-2">
                    {offer.contractType ? CONTRACT_TYPE_LABELS[offer.contractType] : DASH}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <th className="p-2 text-left font-medium text-gray-600">근무 형태</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-2">
                    {offer.workMode ? WORK_MODE_LABELS[offer.workMode] : DASH}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <th className="p-2 text-left font-medium text-gray-600">크런치</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-2">
                    {offer.crunch === null ? DASH : offer.crunch ? "있음" : "없음"}
                  </td>
                ))}
              </tr>
              {extraLabels.map((label) => (
                <tr key={label} className="border-b border-gray-100">
                  <th className="p-2 text-left font-medium text-gray-600">{label}</th>
                  {rows.map(({ offer }) => (
                    <td key={offer.id} className="p-2">
                      {extrasToMap(offer.extras).get(label) ?? DASH}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
