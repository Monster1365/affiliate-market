"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

function ToggleButton({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={on}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50",
        on ? "bg-primary text-primary-foreground hover:bg-brand-700" : "bg-muted text-muted-foreground hover:bg-brand-100",
      )}
    >
      {pending ? "..." : on ? onLabel : offLabel}
    </button>
  );
}

/** 켜기/끄기 토글. 누르면 반대 값으로 저장한다 */
export function ToggleForm({
  action,
  fields,
  on,
  onLabel,
  offLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="value" value={String(!on)} />
      <ToggleButton on={on} onLabel={onLabel} offLabel={offLabel} />
    </form>
  );
}
