import { APP_TIME_ZONE } from "@/lib/domain/days-in-stage";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: APP_TIME_ZONE,
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
