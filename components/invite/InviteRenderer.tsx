"use client";

import type { Theme } from "@/types";
import type { TemplateProps } from "./templates/shared";
import { RajasthaniTemplate } from "./templates/Rajasthani";
import { PunjabiTemplate } from "./templates/Punjabi";
import { SouthIndianTemplate } from "./templates/SouthIndian";
import { BengaliTemplate } from "./templates/Bengali";
import { ModernTemplate } from "./templates/Modern";

const TEMPLATES: Record<Theme, (p: TemplateProps) => React.ReactElement> = {
  rajasthani: RajasthaniTemplate,
  punjabi: PunjabiTemplate,
  "south-indian": SouthIndianTemplate,
  bengali: BengaliTemplate,
  modern: ModernTemplate,
};

/** Templates only read from the WeddingConfig; switching theme switches the template. */
export function InviteRenderer(props: TemplateProps) {
  const Template = TEMPLATES[props.config.theme] ?? RajasthaniTemplate;
  return <Template {...props} />;
}

export type { TemplateProps };
