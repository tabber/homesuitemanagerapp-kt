"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UTILITY_OPTIONS } from "@/lib/utilities"

export interface UtilityRecord {
  id?: string
  utility_type: string
  account_holder: "tenant" | "landlord"
  provider: string
  account_number: string
  account_number_visible: boolean
  setup_instructions: string
  link: string
  billing_day: string // kept as string for the input; parsed on save
}

export function emptyUtility(): UtilityRecord {
  return {
    utility_type: "Water",
    account_holder: "tenant",
    provider: "",
    account_number: "",
    account_number_visible: true,
    setup_instructions: "",
    link: "",
    billing_day: "",
  }
}

interface Props {
  value: UtilityRecord[]
  onChange: (next: UtilityRecord[]) => void
}

export function UtilitiesEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<UtilityRecord>) =>
    onChange(value.map((u, idx) => (idx === i ? { ...u, ...patch } : u)))
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const add = () => onChange([...value, emptyUtility()])

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <p className="text-sm text-text-muted">
          No utilities added. Add each utility and note who's responsible for the account.
        </p>
      )}

      {value.map((u, i) => (
        <div key={i} className="rounded-lg border border-sage/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-navy text-xs">Utility</Label>
                <Select
                  value={u.utility_type}
                  onValueChange={(v) => update(i, { utility_type: v })}
                >
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
                <Label className="text-navy text-xs">Account holder</Label>
                <Select
                  value={u.account_holder}
                  onValueChange={(v) =>
                    update(i, { account_holder: v as "tenant" | "landlord" })
                  }
                >
                  <SelectTrigger className="border-sage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant's name</SelectItem>
                    <SelectItem value="landlord">Landlord's name</SelectItem>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-navy text-xs">Provider</Label>
              <Input
                value={u.provider}
                onChange={(e) => update(i, { provider: e.target.value })}
                placeholder="e.g. BC Hydro"
                className="border-sage"
              />
            </div>
            <div>
              <Label className="text-navy text-xs">Account number</Label>
              <Input
                value={u.account_number}
                onChange={(e) => update(i, { account_number: e.target.value })}
                placeholder="Optional"
                className="border-sage"
              />
            </div>
          </div>

          <div>
            <Label className="text-navy text-xs">Setup instructions / notes</Label>
            <Input
              value={u.setup_instructions}
              onChange={(e) => update(i, { setup_instructions: e.target.value })}
              placeholder="e.g. Call to set up in your name before move-in"
              className="border-sage"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-navy text-xs">Link (optional)</Label>
              <Input
                value={u.link}
                onChange={(e) => update(i, { link: e.target.value })}
                placeholder="Provider website"
                className="border-sage"
              />
            </div>
            {u.account_holder === "landlord" && (
              <div>
                <Label className="text-navy text-xs">Billing day (1–31)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={u.billing_day}
                  onChange={(e) => update(i, { billing_day: e.target.value })}
                  placeholder="Adds a monthly calendar reminder"
                  className="border-sage"
                />
              </div>
            )}
          </div>

          {u.account_number && (
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={u.account_number_visible}
                onCheckedChange={(c) => update(i, { account_number_visible: c })}
              />
              <Label className="text-navy text-xs">Show account number to tenant</Label>
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
  )
}
