import type { ComponentProps, ReactNode } from "react";

const CONTROL_BASE =
  "w-full rounded-lg border border-border bg-input py-2 text-sm text-input-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-60";
const CONTROL = `${CONTROL_BASE} px-3`;

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span className="flex items-baseline gap-1.5">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${CONTROL} font-normal ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${CONTROL} font-normal ${className}`} {...props} />;
}

// 네이티브 화살표를 끄고(appearance-none) 커스텀 chevron을 오른쪽 여백과 함께 그린다
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239aa0aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ className = "", style, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={`${CONTROL_BASE} appearance-none bg-no-repeat pr-9 pl-3 font-normal ${className}`}
      style={{
        backgroundImage: SELECT_CHEVRON,
        backgroundPosition: "right 0.75rem center",
        backgroundSize: "1rem",
        ...style,
      }}
      {...props}
    />
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{children}</p>;
}
