import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, offers, type Offer } from "@/lib/db/schema";

export async function getOfferForApplication(
  applicationId: string,
  userId: string,
): Promise<Offer | null> {
  // 부모 지원을 조인해 소유권을 시그니처에 드러낸다 (ADR 0010) — 내 지원의 오퍼만 반환
  const [row] = await getDb()
    .select({ offer: offers })
    .from(offers)
    .innerJoin(applications, eq(offers.applicationId, applications.id))
    .where(and(eq(offers.applicationId, applicationId), eq(applications.userId, userId)));
  return row?.offer ?? null;
}

export interface OfferComparisonRow {
  offer: Offer;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
}

export async function getOffersForComparison(userId: string): Promise<OfferComparisonRow[]> {
  return (
    getDb()
      .select({
        offer: offers,
        applicationId: applications.id,
        applicationTitle: applications.title,
        companyName: companies.name,
      })
      .from(offers)
      .innerJoin(applications, eq(offers.applicationId, applications.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.userId, userId))
      // 연봉 높은 순, 미정(null)은 맨 뒤로
      .orderBy(sql`${offers.annualSalary} desc nulls last`)
  );
}
