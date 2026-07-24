import { eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, offers, type Offer } from "@/lib/db/schema";

export async function getOfferForApplication(applicationId: string): Promise<Offer | null> {
  const [offer] = await getDb()
    .select()
    .from(offers)
    .where(eq(offers.applicationId, applicationId));
  return offer ?? null;
}

export interface OfferComparisonRow {
  offer: Offer;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
}

export async function getOffersForComparison(): Promise<OfferComparisonRow[]> {
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
      // 연봉 높은 순, 미정(null)은 맨 뒤로
      .orderBy(sql`${offers.annualSalary} desc nulls last`)
  );
}
