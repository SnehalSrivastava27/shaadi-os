import type { StoryChapter } from "@/types";

/** Shown until the couple writes their own story. */
export const DEFAULT_STORY: StoryChapter[] = [
  { id: "met", title: "How it all began", date: "Spring 2023", caption: "A chance meeting, one cup of chai, and a conversation that never really ended.", scene: "chai" },
  { id: "engagement", title: "The Engagement", date: "March 2026", caption: "Two families, one big yes. The sweets ran out long before the blessings did.", scene: "rings", photoUrl: "/story/engagement.jpg" },
  { id: "haldi", title: "Haldi", caption: "Turmeric, laughter and far too much yellow. The glow is real.", scene: "haldi", photoUrl: "/story/haldi.jpg" },
  { id: "mehendi", title: "Mehendi", caption: "Henna, dholak and a name hidden somewhere in the design. Can you find it?", scene: "mehendi" },
];

const SCENES = ["chai", "rings", "haldi", "mehendi"] as const;
export const nextScene = (i: number) => SCENES[i % SCENES.length];

/** Downscale and re-encode a photo so a handful fit comfortably in localStorage (~100 KB each). */
export async function compressPhoto(file: File, maxSide = 1000, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 15 * 1024 * 1024) throw new Error("That photo is over 15 MB");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", quality);
}
