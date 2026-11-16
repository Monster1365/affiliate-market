"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

/** 폼 제출 중이면 비활성화되는 저장 버튼 */
export function SubmitButton({
  children,
  pendingText = "저장 중...",
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** 누르면 확인 창을 띄우고, 확인해야 제출되는 버튼 (삭제용) */
export function ConfirmSubmitButton({
  message,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { message: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn(
        "rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {pending ? "삭제 중..." : children}
    </button>
  );
}

/** 필드 아래 오류 문구 */
export function FieldError({ state, name }: { state: FormState; name: string }) {
  const messages = state.errors?.[name];
  if (!messages?.length) return null;
  return (
    <p id={`${name}-error`} className="text-xs text-destructive">
      {messages[0]}
    </p>
  );
}

/** 폼 상단/하단 결과 메시지 */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn("text-sm", state.ok ? "text-primary" : "text-destructive")}
    >
      {state.message}
    </p>
  );
}

/** 오류가 있으면 aria-invalid 등을 붙이기 위한 props */
export function invalidProps(state: FormState, name: string) {
  return state.errors?.[name]?.length
    ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` }
    : {};
}

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";
