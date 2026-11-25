"use client";

import { createContext, useContext } from "react";
import type { ConfigPatch } from "@/lib/invite/schema";

export type EditFn = (patch: ConfigPatch, summary: string) => void;

/** Present only inside the builder preview; the public invite has no provider, so nothing is editable there. */
export const EditContext = createContext<EditFn | null>(null);
export const useEdit = () => useContext(EditContext);

const editableCls =
  "cursor-text rounded-md outline-2 outline-offset-4 outline-transparent outline-dashed transition-[outline-color] hover:outline-current/35 focus:outline-current/70";

/**
 * Inline text: hover shows a dashed outline, click to type, Enter / click-away saves, Esc cancels.
 * Renders plain text when there is no `onSave` (public invite).
 */
export function Editable({
  value,
  onSave,
  multiline = false,
  className = "",
  style,
}: {
  value: string;
  onSave?: ((next: string) => void) | null;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!onSave) return <span className={className} style={style}>{value}</span>;
  return (
    <span
      key={value /* remount when the saved value changes so the DOM never drifts from state */}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      title="Click to edit"
      spellCheck={false}
      className={`${editableCls} ${className}`}
      style={style}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? "").trim();
        if (!next) e.currentTarget.textContent = value;
        else if (next !== value) onSave(next);
      }}
    >
      {value}
    </span>
  );
}

/** Shows formatted text; in the builder a transparent native date/time input sits on top so a click opens the picker. */
export function EditablePicker({
  type,
  value,
  display,
  onSave,
  className = "",
  style,
}: {
  type: "date" | "time";
  value: string;
  display: string;
  onSave?: ((next: string) => void) | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!onSave) return <span className={className} style={style}>{display}</span>;
  return (
    <span className={`relative inline-block ${editableCls} ${className}`} style={style} title="Click to edit">
      {display}
      <input
        type={type}
        value={value}
        aria-label={type === "date" ? "Change date" : "Change time"}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        onChange={(e) => e.target.value && e.target.value !== value && onSave(e.target.value)}
      />
    </span>
  );
}
