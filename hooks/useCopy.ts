"use client";

import { toast } from "sonner";

export async function copyText(text: string, successMessage = "Copy ho gaya!") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (ok) toast.success(successMessage);
    else toast.error("Copy nahi ho paaya. Text select karke copy karein.");
  }
}
