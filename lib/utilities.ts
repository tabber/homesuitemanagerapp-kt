// Single source of truth for utility responsibilities on a lease.
//
// Storage shape: utilities_included is stored as an object map, e.g.
//   { Water: true, Gas: false, Electricity: true }
// where `true` means the utility is included in rent (landlord's
// responsibility) and `false`/absent means the tenant pays it.
//
// Historically some leases were saved as a plain array (e.g. ["Water", "Gas"]).
// The helpers below read BOTH shapes so older leases keep rendering correctly,
// while everything now WRITES the object shape.

export const UTILITY_OPTIONS = [
  "Water",
  "Gas",
  "Electricity",
  "Heat",
  "Internet",
  "Cable",
  "Trash",
] as const

export type UtilityMap = Record<string, boolean>

// Normalize whatever is stored (object, array, null) into an object map.
export function toUtilityMap(value: unknown): UtilityMap {
  if (!value) return {}
  if (Array.isArray(value)) {
    return value.reduce<UtilityMap>((acc, key) => {
      acc[String(key)] = true
      return acc
    }, {})
  }
  if (typeof value === "object") {
    const out: UtilityMap = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = Boolean(v)
    }
    return out
  }
  return {}
}

// Normalize whatever is stored into a flat list of included utility names.
export function toUtilityList(value: unknown): string[] {
  const map = toUtilityMap(value)
  return Object.keys(map).filter((k) => map[k])
}
