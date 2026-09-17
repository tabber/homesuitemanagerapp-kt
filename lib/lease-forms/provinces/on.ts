import { PDFDocument } from "pdf-lib"
import type { LeaseFormData, ProvinceForm } from "../types"

// Ontario Residential Tenancy Agreement (Standard Form of Lease), Form 2229E
// (2020/12). Field ids verified against the official fillable PDF (157 fields).
// Field names are long hierarchical paths; prefix is factored out below.

const P = "form1[0].page1[0].body[0]."

function money(v: number | string | undefined): string {
  if (v === undefined || v === null || v === "") return ""
  const n = typeof v === "number" ? v : parseFloat(v)
  if (Number.isNaN(n)) return String(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

// yyyy/mm/dd for Ontario (its date boxes use that format)
function ymd(d?: string): string {
  if (!d) return ""
  const parts = d.split("-")
  if (parts.length !== 3) return d
  return `${parts[0]}/${parts[1]}/${parts[2]}`
}

async function fill2229(template: Uint8Array, data: LeaseFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template)
  const form = doc.getForm()
  const text: Record<string, string> = {}
  const checks: string[] = []

  // --- Section 1: parties ---
  if (data.landlords[0]) {
    const full = [data.landlords[0].first, data.landlords[0].last].filter(Boolean).join(" ")
    text[`${P}section1[0].landlord[0].instructorInfo[0].instructorName[0].instrName[0]`] = full
  }
  data.tenants.slice(0, 4).forEach((t, i) => {
    text[`${P}section1[0].tenantsnames[0].tenant[${i}].instructorInfo[0].instructorName[0].instrName[0]`] = t.last
    text[`${P}section1[0].tenantsnames[0].tenant[${i}].instructorInfo[0].instructorName[0].evalName[0]`] = t.first
  })

  // --- Section 2: rental unit ---
  const ru = data.rental_unit || {}
  text[`${P}section2[0].busUnitNo[0]`] = ru.unit ?? ""
  text[`${P}section2[0].busStreetName[0]`] = ru.street ?? ""
  text[`${P}section2[0].busCity[0]`] = ru.city ?? ""
  text[`${P}section2[0].province[0]`] = ru.province ?? "Ontario"
  text[`${P}section2[0].busPostalCode[0]`] = ru.postal ?? ""
  if (data.parking_spaces) text[`${P}section2[0].vehicle[0]`] = String(data.parking_spaces)

  // --- Section 3: address for giving notices to landlord ---
  const sa = data.service_address
  if (sa) {
    text[`${P}section3[0].unitNo[0]`] = sa.unit ?? ""
    text[`${P}section3[0].streetName[0]`] = sa.street ?? ""
    text[`${P}section3[0].city[0]`] = sa.city ?? ""
    text[`${P}section3[0].province[0]`] = sa.province ?? ""
    text[`${P}section3[0].postalCode[0]`] = sa.postal ?? ""
  }
  // Email-for-service: yes + address, if we have the landlord/tenant emails
  if (data.landlord_email || data.tenant_email) {
    checks.push(`${P}section3[0].question1[0].yes[0]`)
    text[`${P}section3[0].question1[0].email[0]`] =
      [data.landlord_email, data.tenant_email].filter(Boolean).join(", ")
  }

  // --- Section 4: term ---
  text[`${P}section4[0].question1[0].date[0]`] = ymd(data.start_date)
  if (data.tenancy_type === "periodic" && (data.periodic_type ?? "monthly") === "monthly") {
    checks.push(`${P}section4[0].question2[0].choice2[0]`) // monthly tenancy
  } else if (data.tenancy_type === "periodic") {
    checks.push(`${P}section4[0].question2[0].choice3[0]`) // other
    text[`${P}section4[0].question2[0].specify[0]`] = data.periodic_type ?? ""
  } else {
    checks.push(`${P}section4[0].question2[0].choice1[0]`) // fixed length
    text[`${P}section4[0].question2[0].date[0]`] = ymd(data.end_date)
  }

  // --- Section 5: rent ---
  if (data.rent_due_day) text[`${P}section5[0].text[0]`] = String(data.rent_due_day)
  checks.push(`${P}section5[0].month[0]`) // paid monthly
  if (data.monthly_rent !== undefined) {
    // Base rent + total (Row1 = base, Row6 = total). We put the same figure in
    // both since HomeSuite tracks a single monthly rent.
    text[`${P}section5[0].Table1[0].Row1[0].cost[0]`] = money(data.monthly_rent)
    text[`${P}section5[0].Table1[0].Row6[0].totalcost[0]`] = money(data.monthly_rent)
  }

  // --- Section 6: utilities responsibility (Electricity[0], Heat[1], Water[2]) ---
  const included = (data.rent_includes ?? []).map((s) => s.toLowerCase())
  const isLandlord = (u: string) => included.includes(u) // included in rent => landlord
  const utilMap: [string, number][] = [
    ["electricity", 0],
    ["heat", 1],
    ["water", 2],
  ]
  for (const [u, idx] of utilMap) {
    if (isLandlord(u)) checks.push(`${P}section6[0].utilities[0].Landlord[${idx}]`)
    else checks.push(`${P}section6[0].utilities[0].tenant[${idx}]`)
  }

  // --- Section 8: rent deposit ---
  if (data.security_deposit) {
    checks.push(`${P}section8[0].question2[0].c[0]`) // "tenant will pay a deposit"
    text[`${P}section8[0].question2[0].deposit[0]`] = money(data.security_deposit)
  } else {
    checks.push(`${P}section8[0].question2[0].yes[0]`) // "not required"
  }

  // Apply
  for (const [id, val] of Object.entries(text)) {
    if (!val) continue
    try {
      form.getTextField(id).setText(val)
    } catch {
      /* skip unknown field */
    }
  }
  for (const id of checks) {
    try {
      form.getCheckBox(id).check()
    } catch {
      /* skip */
    }
  }

  return await doc.save()
}

export const ON: ProvinceForm = {
  code: "ON",
  name: "Ontario",
  official: {
    formId: "Form 2229",
    templateFile: "on2229_standard-lease.pdf",
    fill: fill2229,
  },
  officialMandatory: true, // Ontario legally requires this standard form
}
