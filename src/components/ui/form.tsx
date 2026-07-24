import type { ComponentProps, ReactNode } from "react";

const CONTROL =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-input-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-60";

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

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${CONTROL} font-normal ${className}`} {...props} />;
}

export function FormError({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{children}</p>;
}
