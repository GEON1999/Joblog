import { upsertOffer } from "@/app/offers/actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { SectionTitle } from "@/components/ui/layout";
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
      <SectionTitle>오퍼</SectionTitle>
      <p className="mt-1 text-xs text-muted-foreground">
        기록한 처우는{" "}
        <a href="/offers" className="text-primary hover:underline">
          오퍼 비교표
        </a>
        에서 다른 오퍼와 나란히 볼 수 있습니다.
      </p>

      <form
        action={upsertOffer.bind(null, applicationId)}
        className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="연봉" hint="(만원)">
            <Input
              type="number"
              name="annualSalary"
              min={0}
              step={1}
              defaultValue={offer?.annualSalary ?? ""}
              placeholder="예: 6000"
            />
          </Field>
          <Field label="크런치">
            <Select name="crunch" defaultValue={crunchDefault(offer?.crunch ?? null)}>
              <option value="">미확인</option>
              <option value="no">없음</option>
              <option value="yes">있음</option>
            </Select>
          </Field>
          <Field label="계약 형태">
            <Select name="contractType" defaultValue={offer?.contractType ?? ""}>
              <option value="">미정</option>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="근무 형태">
            <Select name="workMode" defaultValue={offer?.workMode ?? ""}>
              <option value="">미정</option>
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="자유 항목" hint="한 줄에 “라벨: 값”">
          <Textarea
            name="extras"
            rows={4}
            defaultValue={extrasText}
            placeholder={"스톡옵션: 있음\n사이닝보너스: 500만원"}
            className="font-mono text-xs"
          />
        </Field>
        {error === "invalid-salary" && <FormError>연봉은 0 이상의 정수여야 합니다.</FormError>}
        {error === "not-offer-stage" && (
          <FormError>오퍼 단계의 지원만 처우를 기록할 수 있습니다.</FormError>
        )}
        <Button type="submit" size="sm" className="self-start">
          {offer ? "오퍼 수정" : "오퍼 기록"}
        </Button>
      </form>
    </section>
  );
}
