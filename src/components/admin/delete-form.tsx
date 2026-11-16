"use client";

import { ConfirmSubmitButton } from "./form-parts";

export function DeleteForm({
  action,
  id,
  message,
  extra,
  label = "삭제",
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  message: string;
  extra?: Record<string, string>;
  label?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <ConfirmSubmitButton message={message}>{label}</ConfirmSubmitButton>
    </form>
  );
}
