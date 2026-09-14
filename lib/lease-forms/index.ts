import { readFile } from "fs/promises"
import path from "path"
import type { LeaseFormData, ProvinceForm } from "./types"
import { generateGenericLease } from "./generic"
import { BC } from "./provinces/bc"

// Registered provinces. Add a province by adding its module here — the engine
// and the app don't change. Provinces not listed fall back to the generic
// HomeSuite agreement.
const REGISTRY: Record<string, ProvinceForm> = {
  BC,
  // ON: Ontario Form 2229 — add when its PDF + mapping are built.
  // AB, MB, SK, QC, ... — add over time.
}

export interface GenerateResult {
  bytes: Uint8Array
  formLabel: string // e.g. "BC RTB-1" or "HomeSuite Agreement (Alberta)"
  isOfficial: boolean
  officialMandatoryButMissing: boolean // true when the province mandates an official form we haven't mapped
}

const CANADIAN_PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
}

// Provinces that legally mandate a specific standard form. Used to warn honestly
// when we fall back to the generic agreement in one of these.
const MANDATORY_OFFICIAL = new Set(["ON", "QC"])

/**
 * Generate a lease agreement PDF for the given province code.
 * Uses the registered official form if available; otherwise the generic fallback.
 */
export async function generateLeaseForm(
  provinceCode: string,
  data: LeaseFormData,
): Promise<GenerateResult> {
  const code = (provinceCode || "").toUpperCase()
  const provinceName = CANADIAN_PROVINCE_NAMES[code] ?? code ?? "Canada"
  const registered = REGISTRY[code]

  if (registered?.official) {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "forms",
      registered.official.templateFile,
    )
    const template = await readFile(templatePath)
    const bytes = await registered.official.fill(new Uint8Array(template), data)
    return {
      bytes,
      formLabel: `${registered.code} ${registered.official.formId}`,
      isOfficial: true,
      officialMandatoryButMissing: false,
    }
  }

  // Fallback: generic generated agreement.
  const bytes = await generateGenericLease(data, provinceName)
  return {
    bytes,
    formLabel: `HomeSuite Agreement (${provinceName})`,
    isOfficial: false,
    officialMandatoryButMissing: MANDATORY_OFFICIAL.has(code),
  }
}

export function listRegisteredProvinces(): { code: string; official: boolean }[] {
  return Object.values(CANADIAN_PROVINCE_NAMES).length
    ? Object.keys(CANADIAN_PROVINCE_NAMES).map((code) => ({
        code,
        official: Boolean(REGISTRY[code]?.official),
      }))
    : []
}
