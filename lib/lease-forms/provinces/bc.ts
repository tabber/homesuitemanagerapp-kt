import { PDFDocument } from "pdf-lib"
import type { LeaseFormData, ProvinceForm } from "../types"

// BC Residential Tenancy Agreement (RTB-1, 2023/06). Field ids verified against
// the official fillable PDF (122 fields).

function splitIso(d?: string): [string, string, string] {
  if (!d) return ["", "", ""]
  const parts = d.split("-")
  if (parts.length !== 3) return ["", "", ""]
  return [parts[2], parts[1], parts[0]]
}

function money(v: number | string | undefined): string {
  if (v === undefined || v === null || v === "") return ""
  const n = typeof v === "number" ? v : parseFloat(v)
  if (Number.isNaN(n)) return String(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

const INCLUDED_MAP: Record<string, string> = {
  water: "water",
  "natural gas": "natural gas",
  gas: "natural gas",
  garbage: "Garbage collection",
  "garbage collection": "Garbage collection",
  refrigerator: "Refrigerator",
  carpets: "Carpets",
  cablevision: "Cabblevision",
  cable: "Cabblevision",
  sewage: "Sewage disposal",
  "sewage disposal": "Sewage disposal",
  recycling: "Recycling Services",
  "recycling services": "Recycling Services",
  dishwasher: "Dishwasher",
  parking: "Parking",
  electricity: "Electricity",
  "snow removal": "Snow removal",
  "kitchen scrap collection": "Kitchen Scrap collection",
  "stove and oven": "Stove and oven",
  stove: "Stove and oven",
  internet: "Internet",
  storage: "Storage",
  "laundry (coin-op)": "Laundry",
  laundry: "Laundry",
  "window coverings": "Window coverings",
  heat: "Heat",
  "recreation facilities": "Recreational facilities",
  "free laundry": "Free laundry",
  furniture: "Furniture",
}

async function fillRTB1(template: Uint8Array, data: LeaseFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template)
  const form = doc.getForm()
  const text: Record<string, string> = {}
  const checks: string[] = []

  if (data.landlords[0]) {
    text["last name"] = data.landlords[0].last
    text["first and middle names"] = data.landlords[0].first
  }
  if (data.landlords[1]) {
    text["last name_2"] = data.landlords[1].last
    text["first and middle names_2"] = data.landlords[1].first
  }
  if (data.tenants[0]) {
    text["last name_3"] = data.tenants[0].last
    text["first and middle names_3"] = data.tenants[0].first
  }
  if (data.tenants[1]) {
    text["last name_4"] = data.tenants[1].last
    text["first and middle names_4"] = data.tenants[1].first
  }
  if (data.tenant_phone) text["undefined_2"] = data.tenant_phone
  if (data.tenant_email) text["TT email 1"] = data.tenant_email

  const ru = data.rental_unit || {}
  text["unit #"] = ru.unit ?? ""
  text["street number and street name1"] = ru.street ?? ""
  text["City1"] = ru.city ?? ""
  text["Province1"] = ru.province ?? ""
  text["Postalcode1"] = ru.postal ?? ""

  const sa = data.service_address || ru
  text["unitsite"] = sa.unit ?? ""
  text["street number and street name_2"] = sa.street ?? ""
  text["city2"] = sa.city ?? ""
  text["province2"] = sa.province ?? ""
  text["postal code2"] = sa.postal ?? ""
  if (data.landlord_phone) text["undefined_4"] = data.landlord_phone
  if (data.landlord_email) text["LL email 1"] = data.landlord_email

  const [sd, sm, sy] = splitIso(data.start_date)
  text["This tenancy created by this agreement starts on"] = sd
  text["month1"] = sm
  text["year1"] = sy

  const ttype = data.tenancy_type || "fixed"
  if (ttype === "periodic") {
    const ptype = data.periodic_type || "monthly"
    if (ptype === "monthly") {
      checks.push("A and continues on a monthtomonth basis until ended in accordance with the Act")
    } else {
      checks.push(
        "B and continues on another periodic basis as specified below until ended in accordance with the Act",
      )
      if (ptype === "weekly") checks.push("weekly")
      else if (ptype === "biweekly") checks.push("biweekly")
      else {
        checks.push("other")
        text["undefined_7"] = ptype
      }
    }
  } else {
    checks.push("C and is for a fixed term ending on")
    const [ed, em, ey] = splitIso(data.end_date)
    text["This tenancy created by this agreement ends on"] = ed
    text["month2"] = em
    text["year2"] = ey
    if (data.end_of_term_action === "vacate") {
      checks.push(
        "E At the end of this time the tenancy is ended and the tenant must vacate the rental unit",
      )
    } else {
      checks.push(
        "D At the end of this time the tenancy will continue on a monthtomonth basis or another fixed length of",
      )
    }
  }

  if (data.monthly_rent !== undefined) {
    text["The tenant will pay the rent of"] = money(data.monthly_rent)
  }
  checks.push("month to the landlord on")
  checks.push("month subject to rent increases given in accordance with the RTA")
  if (data.rent_due_day) {
    text["the first day of the rental period which falls on the due date eg 1st 2nd 3rd  31st"] =
      String(data.rent_due_day)
  }
  for (const label of data.rent_includes ?? []) {
    const key = INCLUDED_MAP[String(label).trim().toLowerCase()]
    if (key) checks.push(key)
  }
  if (data.parking_spaces) {
    checks.push("Parking")
    text["Parking for"] = String(data.parking_spaces)
  }

  if (data.security_deposit !== undefined) {
    text["4 SECURITY DEPOSIT AND PET DAMAGE DEPOSIT"] = money(data.security_deposit)
  }
  if (data.pet_deposit) {
    text["undefined_8"] = money(data.pet_deposit)
  } else {
    checks.push("not applicable")
  }

  if (data.landlords[0]) {
    text["last name_5"] = data.landlords[0].last
    text["Landlords first and middle name"] = data.landlords[0].first
  }
  if (data.tenants[0]) {
    text["last name_7"] = data.tenants[0].last
    text["last name first and middle names Signature Date TENANTSRow1"] = data.tenants[0].first
  }

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
      /* skip unknown checkbox */
    }
  }

  return await doc.save()
}

export const BC: ProvinceForm = {
  code: "BC",
  name: "British Columbia",
  official: {
    formId: "RTB-1",
    templateFile: "rtb1_chrome.pdf",
    fill: fillRTB1,
  },
  officialMandatory: false,
}
