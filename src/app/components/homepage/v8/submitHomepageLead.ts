import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sendToZapier } from "@/app/utils/zapier";
import { recordAttribution } from "@/app/utils/attribution";
import type { LeadFormData } from "../types";

export type QualifyingAnswers = {
  situation?: string;
  timeline?: string;
  home_type?: string;
  design_level?: string;
  budget_range?: string;
  biggest_concern?: string;
  is_decision_maker?: string;
  meeting_preference?: string;
};

export async function submitHomepageLead(
  form: LeadFormData,
  answers: QualifyingAnswers,
  opts: { leadFormLabel?: string; zapierHook?: "hero-lead" | "ad-lp-lead" } = {},
): Promise<void> {
  const sbUrl = `https://${projectId}.supabase.co`;
  const sbKey = publicAnonKey;

  // 1) Save lead row — same table + column shape as the homepage form
  fetch(`${sbUrl}/rest/v1/homepage_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
    },
    body: JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      ...answers,
    }),
  })
    .then((r) => {
      if (!r.ok) console.error("Lead save failed:", r.status);
      else console.log("Lead saved to homepage_leads");
    })
    .catch((err) => console.error("Lead save error:", err));

  // Attach ad attribution (no-op if the visitor didn't arrive via a tagged ad)
  recordAttribution("homepage-lead", form.email);

  // 2) Zapier hook — same payload shape the CRM already maps. Defaults to
  // the hero-lead hook; the ad LP routes to its own dedicated Zap.
  sendToZapier(opts.zapierHook || "hero-lead", {
    "First Name": form.name,
    "Contact Phone": form.phone,
    "Email Address": form.email || "",
    Situation: answers.situation || "",
    "Key Date": answers.timeline || "",
    "Property Type": answers.home_type || "",
    "Design Level": answers.design_level || "",
    "Renovation Budget":
      (answers.budget_range || "").match(/^\$[\d,]+K?\+?(?:[–\-]+\$[\d,]+K?\+?)?/)?.[0] ||
      answers.budget_range ||
      "",
    "Biggest Concern": answers.biggest_concern || "",
    "Decision Maker": answers.is_decision_maker || "",
    "Meeting Preference": answers.meeting_preference || "",
    "Lead Form": opts.leadFormLabel || "Homepage Lead Form",
  });
}
