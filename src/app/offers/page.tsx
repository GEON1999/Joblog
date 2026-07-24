import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/layout";
import {
  CONTRACT_TYPE_LABELS,
  WORK_MODE_LABELS,
  collectExtraLabels,
  extrasToMap,
} from "@/lib/domain/offer";
import { requireUser } from "@/lib/auth/require-user";
import { getOffersForComparison } from "@/lib/queries/offers";

export const metadata: Metadata = {
  title: "오퍼 비교 — JobLog",
};

export const dynamic = "force-dynamic";

const DASH = "—";

export default async function OffersPage() {
  const user = await requireUser();
  const rows = await getOffersForComparison(user.id);
  const extraLabels = collectExtraLabels(rows.map((row) => row.offer));

  // 연봉 최고치 강조 기준. 비교 대상이 하나뿐이면 강조하지 않는다
  const maxSalary =
    rows.length < 2
      ? null
      : rows.reduce<number | null>((max, { offer }) => {
          if (offer.annualSalary === null) return max;
          return max === null ? offer.annualSalary : Math.max(max, offer.annualSalary);
        }, null);

  return (
    <AppShell width="wide">
      <PageHeader
        title="오퍼 비교"
        description="오퍼 단계에 도달한 지원의 처우를 나란히 비교합니다."
        back={{ href: "/", label: "보드로" }}
      />

      {rows.length === 0 ? (
        <EmptyState>
          기록된 오퍼가 없습니다. 오퍼 단계에 도달한 지원의 상세에서 처우를 기록하세요.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border bg-surface-muted p-3 text-left text-xs font-medium text-muted-foreground">
                  항목
                </th>
                {rows.map(({ offer, applicationId, applicationTitle, companyName }) => (
                  <th
                    key={offer.id}
                    className="border-b border-border bg-surface-muted p-3 text-left align-bottom"
                  >
                    <Link href={`/applications/${applicationId}`} className="hover:text-primary">
                      <span className="block text-xs font-normal text-muted-foreground">
                        {companyName}
                      </span>
                      <span className="block font-semibold">{applicationTitle}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr className="border-b border-border">
                <th className="p-3 text-left font-medium text-muted-foreground">연봉</th>
                {rows.map(({ offer }) => (
                  <td
                    key={offer.id}
                    className={`p-3 ${
                      offer.annualSalary !== null && offer.annualSalary === maxSalary
                        ? "font-semibold text-success"
                        : ""
                    }`}
                  >
                    {offer.annualSalary === null
                      ? DASH
                      : `${offer.annualSalary.toLocaleString()}만원`}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <th className="p-3 text-left font-medium text-muted-foreground">계약 형태</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-3">
                    {offer.contractType ? CONTRACT_TYPE_LABELS[offer.contractType] : DASH}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <th className="p-3 text-left font-medium text-muted-foreground">근무 형태</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-3">
                    {offer.workMode ? WORK_MODE_LABELS[offer.workMode] : DASH}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <th className="p-3 text-left font-medium text-muted-foreground">크런치</th>
                {rows.map(({ offer }) => (
                  <td key={offer.id} className="p-3">
                    {offer.crunch === null ? DASH : offer.crunch ? "있음" : "없음"}
                  </td>
                ))}
              </tr>
              {extraLabels.map((label) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <th className="p-3 text-left font-medium text-muted-foreground">{label}</th>
                  {rows.map(({ offer }) => (
                    <td key={offer.id} className="p-3">
                      {extrasToMap(offer.extras).get(label) ?? DASH}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
