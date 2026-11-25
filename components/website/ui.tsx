/** Shared bits of the /welcome editorial look, reused by the invite builder. */

export const sansFont = "font-[family-name:var(--font-jakarta)]";

export const hatch = "bg-[repeating-linear-gradient(-45deg,#f1f1f1_0_1px,transparent_1px_9px)]";

export const darkPill =
  "inline-flex h-9 items-center gap-2 rounded-xl border border-black bg-[#262626] px-4 text-[13px] font-semibold text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.22),inset_0_-3px_0_rgba(0,0,0,0.55),0_12px_24px_-12px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

export const lightPill =
  "inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 text-[13px] font-semibold text-[#161616] shadow-[inset_0_-2px_0_rgba(0,0,0,0.06),0_8px_20px_-14px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 [&_svg]:size-4";

/** Small rounded chip used for suggestions and segmented toggles. */
export const chip = "rounded-full border border-[#ececec] bg-white px-3 py-1 text-xs font-medium text-[#3a3a3a] transition hover:border-[#d6d6d6] hover:bg-[#f7f7f7] disabled:opacity-50";

/** Italic serif accent word inside sans headlines. */
export function Em({ children }: { children: React.ReactNode }) {
  return <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#7a1f2b] italic">{children}</em>;
}
