"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UTILITY_OPTIONS } from "@/lib/utilities"

// Building-level utility policy: whether each utility is included in rent, the
// tenant's responsibility to set up, or landlord-managed (tenant reimburses).
export interface BuildingUtility {
  utility_type: string
  policy: "included" | "tenant" | "landlord"
  provider: string
  setup_instructions: string
  link: string
}

export interface BuildingFacts {
  garbage_day: string
  recycling_day: string
  telecoms_wired: string
  notes: string
}

export function emptyBuildingUtility(): BuildingUtility {
  return {
    utility_type: "Water",
    policy: "included",
    provider: "",
    setup_instructions: "",
    link: "",
  }
}

export function emptyBuildingFacts(): BuildingFacts {
  return { garbage_day: "", recycling_day: "", telecoms_wired: "", notes: "" }
}

const POLICY_LABELS: Record<BuildingUtility["policy"], string> = {
  included: "Included in rent",
  tenant: "Tenant sets up",
  landlord: "Landlord-managed",
}

interface Props {
  utilities: BuildingUtility[]
  facts: BuildingFacts
  onUtilitiesChange: (next: BuildingUtility[]) => void
  onFactsChange: (next: BuildingFacts) => void
}

export function BuildingSettingsEditor({
  utilities,
  facts,
  onUtilitiesChange,
  onFactsChange,
}: Props) {
  const update = (i: number, patch: Partial<BuildingUtility>) =>
    onUtilitiesChange(utilities.map((u, idx) => (idx === i ? { ...u, ...patch } : u)))
  const remove = (i: number) => onUtilitiesChange(utilities.filter((_, idx) => idx !== i))
  const add = () => onUtilitiesChange([...utilities, emptyBuildingUtility()])

  return (
    <div className="space-y-6">
      {/* Utilities policy */}
      <div className="space-y-4">
        <div>
          <Label className="text-navy">Utilities</Label>
          <p className="text-xs text-text-muted mt-0.5">
            Set how each utility works for the whole building. This copies onto each
            unit&apos;s lease when you create it.
          </p>
        </div>

        {utilities.length === 0 && (
          <p className="text-sm text-text-muted">No utilities added yet.</p>
        )}

        {utilities.map((u, i) => (
          <div key={i} className="rounded-lg border border-sage/50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-navy text-xs">Utility</Label>
                  <Select value={u.utility_type} onValueChange={(v) => update(i, { utility_type: v })}>
                    <SelectTrigger className="border-sage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UTILITY_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-navy text-xs">How it works</Label>
                  <Select
                    value={u.policy}
                    onValueChange={(v) => update(i, { policy: v as BuildingUtility["policy"] })}
                  >
                    <SelectTrigger className="border-sage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POLICY_LABELS) as BuildingUtility["policy"][]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {POLICY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                className="text-destructive hover:bg-destructive/10 mt-5 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Provider + setup only matter when the tenant has something to do */}
            {u.policy !== "included" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-navy text-xs">Provider</Label>
                  <Input
                    value={u.provider}
                    onChange={(e) => update(i, { provider: e.target.value })}
                    placeholder="e.g. BC Hydro, city"
                    className="border-sage"
                  />
                </div>
                <div>
                  <Label className="text-navy text-xs">Link (optional)</Label>
                  <Input
                    value={u.link}
                    onChange={(e) => update(i, { link: e.target.value })}
                    placeholder="Provider website"
                    className="border-sage"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-navy text-xs">Setup instructions</Label>
                  <Input
                    value={u.setup_instructions}
                    onChange={(e) => update(i, { setup_instructions: e.target.value })}
                    placeholder="e.g. Open an account in your name before move-in"
                    className="border-sage"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={add}
          className="border-teal text-teal hover:bg-teal/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add utility
        </Button>
      </div>

      {/* Building facts */}
      <div className="space-y-3 border-t border-sage/30 pt-4">
        <div>
          <Label className="text-navy">Building details</Label>
          <p className="text-xs text-text-muted mt-0.5">
            Handy things tenants ask about.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-navy text-xs">Garbage day</Label>
            <Input
              value={facts.garbage_day}
              onChange={(e) => onFactsChange({ ...facts, garbage_day: e.target.value })}
              placeholder="e.g. Tuesday"
              className="border-sage"
            />
          </div>
          <div>
            <Label className="text-navy text-xs">Recycling day</Label>
            <Input
              value={facts.recycling_day}
              onChange={(e) => onFactsChange({ ...facts, recycling_day: e.target.value })}
              placeholder="e.g. Every other Friday"
              className="border-sage"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-navy text-xs">Wired for (internet/cable providers)</Label>
            <Input
              value={facts.telecoms_wired}
              onChange={(e) => onFactsChange({ ...facts, telecoms_wired: e.target.value })}
              placeholder="e.g. Telus, Rogers"
              className="border-sage"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-navy text-xs">Other notes</Label>
            <Input
              value={facts.notes}
              onChange={(e) => onFactsChange({ ...facts, notes: e.target.value })}
              placeholder="Anything else tenants should know about the building"
              className="border-sage"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
