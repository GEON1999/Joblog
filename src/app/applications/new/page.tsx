import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { Card, PageHeader } from "@/components/ui/layout";
import { getDb } from "@/lib/db";

import { createApplication } from "../actions";

export const metadata: Metadata = {
  title: "지원 등록 — JobLog",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "회사명과 직무명을 입력해 주세요.",
  "invalid-date": "지원일 형식이 올바르지 않습니다.",
  "invalid-url": "공고 URL은 http(s) 주소여야 합니다.",
};

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const existingCompanies = await getDb().query.companies.findMany({
    columns: { name: true },
    orderBy: (companies, { asc }) => [asc(companies.name)],
  });

  return (
    <AppShell width="narrow">
      <PageHeader title="지원 등록" back={{ href: "/", label: "보드로" }} />
      <Card>
        <form action={createApplication} className="flex flex-col gap-4">
          <Field label="회사명">
            <Input type="text" name="companyName" required list="company-names" />
            <datalist id="company-names">
              {existingCompanies.map((company) => (
                <option key={company.name} value={company.name} />
              ))}
            </datalist>
          </Field>
          <Field label="직무명">
            <Input type="text" name="title" required placeholder="예: 프론트엔드 개발자" />
          </Field>
          <Field label="지원일" hint="비워두면 오늘로 기록됩니다">
            <Input type="date" name="appliedAt" />
          </Field>
          <Field label="공고 URL" hint="(선택)">
            <Input type="url" name="postingUrl" placeholder="https://..." />
          </Field>
          <Field label="공고 본문" hint="(선택) 공고가 내려가기 전에 원문을 보존">
            <Textarea
              name="postingContent"
              rows={7}
              placeholder="공고 본문을 그대로 붙여넣으세요"
              className="font-mono text-xs"
            />
          </Field>
          {errorMessage && <FormError>{errorMessage}</FormError>}
          <Button type="submit" className="mt-1">
            등록
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
