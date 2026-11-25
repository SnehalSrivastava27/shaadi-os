"use client";

import type { Theme } from "@/types";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { EditContext } from "./Editable";
import { MandapTemplate } from "./templates/Mandap";
import type { TemplateProps } from "./templates/shared";
import { RajasthaniTemplate } from "./templates/Rajasthani";
import { PunjabiTemplate } from "./templates/Punjabi";
import { SouthIndianTemplate } from "./templates/SouthIndian";
import { BengaliTemplate } from "./templates/Bengali";
import { ModernTemplate } from "./templates/Modern";

const TEMPLATES: Record<Theme, (p: TemplateProps) => React.ReactElement> = {
  mandap: MandapTemplate,
  rajasthani: RajasthaniTemplate,
  punjabi: PunjabiTemplate,
  "south-indian": SouthIndianTemplate,
  bengali: BengaliTemplate,
  modern: ModernTemplate,
};

/**
 * Templates only read from the WeddingConfig; switching theme switches the template.
 * `editable` (builder preview) lets templates that support it edit text and colours in place.
 */
export function InviteRenderer({ editable = false, ...props }: TemplateProps & { editable?: boolean }) {
  const applyConfigPatch = useShaadiStore((s) => s.applyConfigPatch);
  const Template = TEMPLATES[props.config.theme] ?? RajasthaniTemplate;
  return (
    <EditContext.Provider value={editable ? applyConfigPatch : null}>
      <Template {...props} />
    </EditContext.Provider>
  );
}

export type { TemplateProps };
