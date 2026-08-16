"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Bell,
  Plus,
  Check,
  Trash2,
  CalendarClock,
  Leaf,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Reminder {
  id: string
  title: string
  notes: string | null
  due_date: string
  repeat: string
  visible_to_tenant: boolean
  property_id: string | null
  completed_at: string | null
}

const REPEAT_LABELS: Record<string, string> = {
  none: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Every 6 months",
  annual: "Yearly",
}

// Seasonal defaults a landlord can add with one tap
const SEASONAL_DEFAULTS = [
  { title: "Replace furnace filter", repeat: "quarterly", month: null },
  { title: "Clean gutters", repeat: "biannual", month: 9 },
  { title: "Test smoke & CO detectors", repeat: "biannual", month: 3 },
  { title: "Service heating before winter", repeat: "annual", month: 9 },
  { title: "Service A/C before summer", repeat: "annual", month: 4 },
  { title: "Inspect roof & exterior", repeat: "annual", month: 4 },
  { title: "Flush water heater", repeat: "annual", month: 5 },
  { title: "Check weatherstripping & seals", repeat: "annual", month: 9 },
]

function monthsRepeat(repeat: string): number {
  switch (repeat) {
    case "monthly": return 1
    case "quarterly": return 3
    case "biannual": return 6
    case "annual": return 12
    default: return 0
  }
}

function nextSeasonalDate(month: number | null): string {
  const now = new Date()
  if (month === null) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)
    return d.toISOString().slice(0, 10)
  }
  let year = now.getFullYear()
  if (month - 1 < now.getMonth()) year += 1
  return new Date(year, month - 1, 1).toISOString().slice(0, 10)
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const d = new Date(value + "T00:00:00")
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

function RemindersPageInner() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const searchParams = useSearchParams()

  // Arriving from the dashboard Quick Action (?add=1) opens the dialog
  // straight away — no extra click.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setShowAdd(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("add")
      window.history.replaceState({}, "", url.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    notes: "",
    due_date: new Date().toISOString().slice(0, 10),
    repeat: "none",
    property_id: "",
    visible_to_tenant: true,
  })

  const load = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id)
      .or("archived.is.null,archived.eq.false")
      .order("name", { ascending: true })
    setProperties((props ?? []).map((p: any) => ({ id: p.id, name: p.name })))

    const { data } = await supabase
      .from("maintenance_reminders")
      .select("*")
      .eq("landlord_id", user.id)
      .order("due_date", { ascending: true })
    setReminders((data ?? []) as Reminder[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const propertyName = (id: string | null) =>
    id ? properties.find((p) => p.id === id)?.name ?? "—" : "All properties"

  const handleAdd = async () => {
    if (!form.title || !userId || saving) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_reminders").insert({
      landlord_id: userId,
      property_id: form.property_id || null,
      title: form.title,
      notes: form.notes || null,
      due_date: form.due_date,
      repeat: form.repeat,
      visible_to_tenant: form.visible_to_tenant,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Reminder added")
    setShowAdd(false)
    setForm({
      title: "",
      notes: "",
      due_date: new Date().toISOString().slice(0, 10),
      repeat: "none",
      property_id: "",
      visible_to_tenant: true,
    })
    load()
  }

  const handleAddDefault = async (d: (typeof SEASONAL_DEFAULTS)[number]) => {
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_reminders").insert({
      landlord_id: userId,
      title: d.title,
      due_date: nextSeasonalDate(d.month),
      repeat: d.repeat,
      visible_to_tenant: true,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`Added "${d.title}"`)
    load()
  }

  const handleComplete = async (r: Reminder) => {
    setBusyId(r.id)
    const supabase = createClient()
    const months = monthsRepeat(r.repeat)

    if (months > 0) {
      // Roll the due date forward instead of closing it out
      const next = new Date(r.due_date + "T00:00:00")
      next.setMonth(next.getMonth() + months)
      const { error } = await supabase
        .from("maintenance_reminders")
        .update({ due_date: next.toISOString().slice(0, 10), updated_at: new Date().toISOString() })
        .eq("id", r.id)
      setBusyId(null)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Done — next due ${formatDate(next.toISOString().slice(0, 10))}`)
    } else {
      const { error } = await supabase
        .from("maintenance_reminders")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", r.id)
      setBusyId(null)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Marked complete")
    }
    load()
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_reminders").delete().eq("id", id)
    setBusyId(null)
    if (error) {
      toast.error(error.message)
      return
    }
    setReminders((prev) => prev.filter((r) => r.id !== id))
    toast.success("Reminder deleted")
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = reminders.filter((r) => !r.completed_at)
  const done = reminders.filter((r) => r.completed_at)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-navy">Maintenance reminders</h1>
          <p className="text-sm text-text-muted mt-1">
            Seasonal upkeep and recurring tasks — shared with your tenants so
            everyone&apos;s on the same page
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-teal hover:bg-teal-dark text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add reminder
        </Button>
      </div>

      {/* Seasonal quick-add */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-navy flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal" />
            Add a seasonal reminder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SEASONAL_DEFAULTS.map((d) => (
              <button
                key={d.title}
                onClick={() => handleAddDefault(d)}
                className="px-3 py-1.5 rounded-full text-sm border border-sage bg-white text-navy hover:bg-sage/20 transition-colors"
              >
                + {d.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            {loading ? "Loading..." : `Upcoming (${upcoming.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && upcoming.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No reminders yet"
              description="Add a seasonal reminder above, or create your own. Your tenants will see the ones you share."
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((r) => {
                const overdue = r.due_date < today
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-sage/40"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${
                          overdue ? "bg-warning/15" : "bg-teal/10"
                        }`}
                      >
                        <CalendarClock
                          className={`h-4 w-4 ${overdue ? "text-warning" : "text-teal"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy">{r.title}</p>
                        <p className="text-xs text-text-muted">
                          {overdue ? "Overdue · " : ""}
                          {formatDate(r.due_date)}
                          {" · "}
                          {REPEAT_LABELS[r.repeat] ?? r.repeat}
                          {" · "}
                          {propertyName(r.property_id)}
                          {r.visible_to_tenant ? " · shared with tenant" : " · private"}
                        </p>
                        {r.notes && (
                          <p className="text-xs text-text-muted mt-1">{r.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => handleComplete(r)}
                        className="text-teal hover:bg-teal/10"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Done
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => handleDelete(r.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed one-time reminders */}
      {done.length > 0 && (
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-text-muted">
              Completed ({done.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {done.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-sage/30 opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-teal" />
                    <span className="text-sm text-navy line-through">{r.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => handleDelete(r.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add reminder dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">Add reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="r_title">Title</Label>
              <Input
                id="r_title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Replace furnace filter"
              />
            </div>
            <div>
              <Label htmlFor="r_due">Due date</Label>
              <Input
                id="r_due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="r_repeat">Repeat</Label>
              <Select
                value={form.repeat}
                onValueChange={(v) => setForm((f) => ({ ...f, repeat: v }))}
              >
                <SelectTrigger id="r_repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPEAT_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="r_property">Property (optional)</Label>
              <Select
                value={form.property_id}
                onValueChange={(v) => setForm((f) => ({ ...f, property_id: v }))}
              >
                <SelectTrigger id="r_property">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="r_notes">Notes (optional)</Label>
              <Textarea
                id="r_notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="r_visible"
                checked={form.visible_to_tenant}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, visible_to_tenant: v === true }))
                }
              />
              <Label htmlFor="r_visible" className="cursor-pointer">
                Share with tenant
              </Label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="border-sage text-navy hover:bg-sage/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!form.title || saving}
                className="bg-teal hover:bg-teal-dark text-white"
              >
                {saving ? "Adding..." : "Add reminder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function RemindersPage() {
  return (
    <Suspense fallback={null}>
      <RemindersPageInner />
    </Suspense>
  )
}
