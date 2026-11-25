"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import type { StoryChapter, WeddingConfig } from "@/types";
import { DEFAULT_STORY, compressPhoto, nextScene } from "@/lib/invite/story";
import { useStoryPhotos } from "@/stores/useStoryPhotos";
import { Editable, useEdit } from "./Editable";
import { StoryIllustration } from "./StoryScenes";

// Native CSS scroll-driven reveal; browsers without it (or reduced motion) just show the content.
const reveal = "motion-safe:[animation:so-rise_linear_both] motion-safe:[animation-timeline:view()] motion-safe:[animation-range:entry_5%_cover_30%]";

const editBtn = "inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 font-sans text-[12px] font-semibold text-[#161616] shadow-md transition hover:bg-white";

function ChapterPhoto({ chapter, onPhoto, onClear }: { chapter: StoryChapter; onPhoto?: (file: File) => void; onClear?: () => void }) {
  const uploaded = useStoryPhotos((s) => (chapter.photoId ? s.photos[chapter.photoId] : undefined));
  const src = uploaded ?? chapter.photoUrl;
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#f3e9cf]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs and small bundled images
        <img src={src} alt={chapter.title} loading="lazy" className="size-full object-cover" />
      ) : (
        <StoryIllustration scene={chapter.scene} className="size-full" />
      )}
      {onPhoto && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/45 to-transparent p-3 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button type="button" className={editBtn} onClick={() => file.current?.click()}>
            <ImagePlus className="size-3.5" /> {src ? "Change photo" : "Upload photo"}
          </button>
          {src && onClear && (
            <button type="button" className={editBtn} onClick={onClear} aria-label="Remove photo">
              <X className="size-3.5" /> Remove
            </button>
          )}
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onPhoto(f);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** The couple's journey, one chapter per scroll. Editable (text, photos, chapters) inside the builder. */
export function Story({
  config,
  live = false,
  primary,
  accent,
  ink,
  headingClass,
  titleClass,
}: {
  config: WeddingConfig;
  /** Real invite: one full-screen, GSAP-animated scene per chapter (the template drives the motion). */
  live?: boolean;
  primary: string;
  accent: string;
  ink: string;
  headingClass: string;
  titleClass: string;
}) {
  const edit = useEdit();
  const addPhoto = useStoryPhotos((s) => s.add);
  const story = config.story ?? DEFAULT_STORY;
  if (!story.length && !edit) return null;

  const save = (next: StoryChapter[], summary: string) => edit?.({ story: next }, summary);
  const update = (id: string, fields: Partial<StoryChapter>, summary: string) => save(story.map((c) => (c.id === id ? { ...c, ...fields } : c)), summary);

  const uploadTo = (c: StoryChapter) => async (f: File) => {
    try {
      const id = addPhoto(await compressPhoto(f));
      update(c.id, { photoId: id, photoUrl: undefined }, `Added a photo to "${c.title}"`);
      toast.success("Photo added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that photo");
    }
  };

  if (live)
    return (
      <>
        {story.map((c, i) => (
          <section key={c.id} data-scene className="relative mx-auto flex min-h-[100svh] w-full max-w-md snap-start snap-always flex-col items-center justify-center overflow-hidden px-7 py-14 text-center">
            <span data-parallax aria-hidden className={`${titleClass} pointer-events-none absolute top-[8%] right-2 text-[150px] leading-none font-semibold opacity-[0.07]`} style={{ color: primary }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {i === 0 && (
              <h2 data-anim className={`${headingClass} mb-5 text-xl font-semibold tracking-wider`} style={{ color: primary }}>
                Our Story
              </h2>
            )}
            <p data-anim className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: accent }}>
              Chapter {String(i + 1).padStart(2, "0")}
              {c.date && ` · ${c.date}`}
            </p>
            <div data-photo className={`mt-4 w-full rounded-[28px] border bg-white/70 p-2 shadow-[0_24px_50px_-28px_rgba(90,60,10,0.8)] ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"}`} style={{ borderColor: `${accent}88` }}>
              <ChapterPhoto chapter={c} />
            </div>
            <h3 data-anim className={`${titleClass} mt-6 text-[40px] leading-tight font-semibold`} style={{ color: primary }}>
              {c.title}
            </h3>
            <p data-anim className="mt-2 max-w-sm text-xl leading-relaxed" style={{ color: ink }}>
              {c.caption}
            </p>
            {i === story.length - 1 && (
              <p data-anim className={`${titleClass} mt-8 text-2xl italic`} style={{ color: primary }}>
                …and now, the wedding.
              </p>
            )}
          </section>
        ))}
      </>
    );

  return (
    <section className="relative mx-auto max-w-md px-6 pb-8">
      <h2 className={`${headingClass} text-center text-xl font-semibold tracking-wider`} style={{ color: primary }}>
        Our Story
      </h2>
      <p className="mt-2 text-center text-lg italic" style={{ color: ink }}>
        Scroll through how we got here
      </p>

      <ol className="mt-8">
        {story.map((c, i) => (
          <li key={c.id} className={`relative ${reveal}`}>
            {i > 0 && (
              <div aria-hidden className="mx-auto mb-6 flex w-fit flex-col items-center">
                <span className="h-10 border-l-2 border-dotted" style={{ borderColor: accent }} />
                <span className="size-3 rounded-full ring-4" style={{ background: "#F59E0B", ["--tw-ring-color" as string]: `${accent}33` }} />
              </div>
            )}
            <article className={`relative ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"}`}>
              <div className="rounded-[28px] border bg-white/70 p-2.5 shadow-[0_18px_40px_-24px_rgba(90,60,10,0.7)]" style={{ borderColor: `${accent}88` }}>
                <ChapterPhoto
                  chapter={c}
                  onPhoto={edit ? uploadTo(c) : undefined}
                  onClear={edit ? () => update(c.id, { photoId: undefined, photoUrl: undefined }, `Removed the photo from "${c.title}"`) : undefined}
                />
                <div className="px-3 pt-4 pb-3 text-center">
                  <p className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: accent }}>
                    Chapter {String(i + 1).padStart(2, "0")}
                    {(c.date || edit) && (
                      <>
                        {" · "}
                        <Editable value={c.date || "Add a date"} onSave={edit && ((v) => update(c.id, { date: v }, `Changed the date of "${c.title}"`))} />
                      </>
                    )}
                  </p>
                  <h3 className={`${titleClass} mt-2 text-3xl font-semibold`} style={{ color: primary }}>
                    <Editable value={c.title} onSave={edit && ((v) => update(c.id, { title: v }, "Renamed a story chapter"))} />
                  </h3>
                  <p className="mt-2 text-lg leading-relaxed" style={{ color: ink }}>
                    <Editable multiline value={c.caption} onSave={edit && ((v) => update(c.id, { caption: v }, `Edited "${c.title}"`))} />
                  </p>
                </div>
              </div>
              {edit && (
                <button
                  type="button"
                  onClick={() => save(story.filter((x) => x.id !== c.id), `Removed "${c.title}" from the story`)}
                  className="absolute -top-2 -right-2 rounded-full bg-white p-1.5 text-[#b42318] shadow-md hover:bg-[#fdecec]"
                  aria-label={`Remove chapter ${c.title}`}
                  title="Remove chapter"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </article>
          </li>
        ))}
      </ol>

      {edit && story.length < 12 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() =>
              save(
                [...story, { id: `ch-${Date.now().toString(36)}`, title: "A new chapter", caption: "Write a line about this moment.", scene: nextScene(story.length) }],
                "Added a story chapter",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-4 py-2 font-sans text-[13px] font-semibold transition hover:bg-white/60"
            style={{ borderColor: accent, color: primary }}
          >
            <Plus className="size-4" /> Add chapter
          </button>
        </div>
      )}

      <p className={`${titleClass} mt-10 text-center text-2xl italic`} style={{ color: primary }}>
        …and now, the wedding.
      </p>
    </section>
  );
}
