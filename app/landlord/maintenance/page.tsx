"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { MapPin, User, Calendar, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PriorityBadge } from "@/components/priority-badge"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { createClient } from "@/lib/supabase/client"

const formatDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : "—"

const formatActivityTime = (d: string) =>
  new Date(d).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const ACTIVITY_LABELS: Record<string, string> = {
  status_change: "Status changed",
  contractor_assigned: "Contractor assigned",
  scheduled: "Scheduled",
  note: "Update",
  cost: "Cost recorded",
}

export default function MaintenancePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [contractorRows, setContractorRows] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "completed">("all")

  const [notesDraft, setNotesDraft] = useState("")
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [logDraft, setLogDraft] = useState("")
  const [costDraft, setCostDraft] = useState("")
  const [loggingUpdate, setLoggingUpdate] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: crows } = await supabase
      .from("contractors")
      .select("id, name, category")
      .eq("landlord_id", user.id)
      .order("name", { ascending: true })
    setContractorRows(crows ?? [])

    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id)
    const propertyNameMap = new Map<string, string>((props ?? []).map((p: any) => [p.id, p.name]))

    const { data: reqs } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })

    const tenantIds = Array.from(
      new Set((reqs ?? []).map((r: any) => r.tenant_id).filter(Boolean)),
    ) as string[]
    const nameMap = new Map<string, string>()
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", tenantIds)
      ;(profiles ?? []).forEach((p: any) => {
        nameMap.set(
          p.id,
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || "Unknown",
        )
      })
    }

    const mapped = (reqs ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      category: r.category ?? "—",
      priority: r.priority ?? "medium",
      status: r.status ?? "open",
      property_id: r.property_id,
      property: r.property_id ? propertyNameMap.get(r.property_id) ?? "—" : "—",
      unit: r.unit_id ?? null,
      tenant: r.tenant_id ? nameMap.get(r.tenant_id) ?? "—" : "—",
      submittedDate: r.created_at,
      scheduledDate: r.scheduled_date ?? "",
      scheduledTime: r.scheduled_time ?? "",
      contractor_id: r.contractor_id ?? "",
      contractor_token: r.contractor_token ?? null,
      notes: r.landlord_notes ?? "",
    }))

    setRequests(mapped)
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
    setSelected((prev: any) =>
      prev ? mapped.find((r) => r.id === prev.id) ?? (isDesktop ? mapped[0] ?? null : null) : isDesktop ? mapped[0] ?? null : null,
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Activity timeline for the open request
  const loadActivity = async (requestId: string) => {
    setActivityLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("maintenance_activity")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
    setActivityLog(data ?? [])
    setActivityLoading(false)
  }

  useEffect(() => {
    setNotesDraft(selected?.notes ?? "")
    if (selected?.id) loadActivity(selected.id)
    else setActivityLog([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  const logActivity = async (requestId: string, action: string, detail?: string, cost?: number | null) => {
    if (!userId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("maintenance_activity")
      .insert({ request_id: requestId, landlord_id: userId, action, detail: detail || null, cost: cost ?? null })
      .select()
      .single()
    if (error) {
      console.error("Could not log maintenance activity:", error.message)
      return
    }
    if (data) setActivityLog((prev) => [data, ...prev])
  }

  const activityCostTotal = activityLog.reduce(
    (sum, e) => sum + (typeof e.cost === "number" ? e.cost : 0),
    0,
  )

  const handleLogUpdate = async () => {
    const text = logDraft.trim()
    const costValue = costDraft.trim() ? Number(costDraft) : null
    if (!selected) return
    if (!text && costValue == null) return
    if (costValue != null && (Number.isNaN(costValue) || costValue < 0)) {
      toast.error("Enter a valid cost")
      return
    }
    setLoggingUpdate(true)
    const detail = text || (costValue != null ? "Cost recorded" : "")
    await logActivity(selected.id, costValue != null ? "cost" : "note", detail, costValue)
    setLoggingUpdate(false)
    setLogDraft("")
    setCostDraft("")
    toast.success(costValue != null ? "Cost logged" : "Update logged")
  }

  const patchRequest = (id: string, patch: any) => {
    setSelected((prev: any) => (prev && prev.id === id ? { ...prev, ...patch } : prev))
    setRequests((prev: any[]) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", id)
    if (error) return toast.error(error.message)
    patchRequest(id, { status })
    const label = status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)
    await logActivity(id, "status_change", `Status set to ${label}`)
    toast.success("Status updated")
  }

  const handleUpdatePriority = async (id: string, priority: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_requests").update({ priority }).eq("id", id)
    if (error) return toast.error(error.message)
    patchRequest(id, { priority })
    toast.success("Priority updated")
  }

  const handleAssignContractor = async (id: string, contractorId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ contractor_id: contractorId || null })
      .eq("id", id)
    if (error) return toast.error(error.message)
    patchRequest(id, { contractor_id: contractorId })
    if (contractorId) {
      const cname = contractorRows.find((c: any) => c.id === contractorId)?.name ?? "a contractor"
      await logActivity(id, "contractor_assigned", `Assigned ${cname}`)
    }
    toast.success("Contractor assigned")
  }

  const handleUpdateSchedule = async (id: string, field: "scheduled_date" | "scheduled_time", value: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_requests").update({ [field]: value || null }).eq("id", id)
    if (error) return toast.error(error.message)
    const localField = field === "scheduled_date" ? "scheduledDate" : "scheduledTime"
    patchRequest(id, { [localField]: value })
    if (value) {
      const label = field === "scheduled_date" ? "date" : "time"
      await logActivity(id, "scheduled", `Set scheduled ${label} to ${value}`)
    }
    toast.success("Schedule updated")
  }

  const handleSaveNotes = async (id: string, notes: string) => {
    const current = requests.find((r) => r.id === id)
    if ((current?.notes ?? "") === notes) return
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_requests").update({ landlord_notes: notes || null }).eq("id", id)
    if (error) return toast.error(error.message)
    patchRequest(id, { notes })
    toast.success("Notes saved")
  }

  const filtered = requests.filter((r) => {
    if (statusFilter === "open") return r.status === "open" || r.status === "in-progress"
    if (statusFilter === "completed") return r.status === "completed"
    return true
  })

  const openCount = requests.filter((r) => r.status === "open" || r.status === "in-progress").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-navy">Maintenance</h1>
          <p className="text-sm text-text-muted">
            {openCount} open {openCount === 1 ? "request" : "requests"}
          </p>
        </div>
        <div className="flex gap-1">
          {(["all", "open", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter(f)}
              className={
                statusFilter === f
                  ? "bg-teal text-white border-teal hover:bg-teal-dark"
                  : "border-sage text-navy hover:bg-sage/20"
              }
            >
              {f === "all" ? "All" : f === "open" ? "Open" : "Completed"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4">
        {/* List */}
        <Card className={`border-sage/50 ${selected ? "hidden md:block" : ""}`}>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {filtered.length === 0 ? (
              <EmptyState icon={Wrench} title="No requests" description="Maintenance requests will appear here." />
            ) : (
              <div className="divide-y divide-sage/30">
                {filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left p-4 hover:bg-sage/10 ${selected?.id === r.id ? "bg-sage/20" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={r.priority} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm font-medium text-navy truncate">{r.title}</p>
                    <p className="text-xs text-text-muted truncate">
                      {r.property}
                      {r.unit ? ` · Unit ${r.unit}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Detail */}
        <Card className={`border-sage/50 ${!selected ? "hidden md:block" : ""}`}>
          {!selected ? (
            <CardContent className="h-full flex items-center justify-center text-sm text-text-muted">
              Select a request
            </CardContent>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <button onClick={() => setSelected(null)} className="md:hidden text-sm text-teal">
                    ← All requests
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PriorityBadge priority={selected.priority} />
                      <StatusBadge status={selected.status} />
                    </div>
                    <h2 className="text-xl font-medium text-navy">{selected.title}</h2>
                  </div>

                  <div>
                    <Label className="text-text-muted text-xs">Description</Label>
                    <p className="text-navy mt-1">{selected.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-text-muted text-xs">Category</Label>
                      <p className="text-navy mt-1">{selected.category}</p>
                    </div>
                    <div>
                      <Label className="text-text-muted text-xs">Priority</Label>
                      <Select value={selected.priority} onValueChange={(v) => handleUpdatePriority(selected.id, v)}>
                        <SelectTrigger className="border-sage mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-text-muted text-xs">Status</Label>
                      <Select value={selected.status} onValueChange={(v) => handleUpdateStatus(selected.id, v)}>
                        <SelectTrigger className="border-sage mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-text-muted text-xs">Property</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-text-muted" />
                        <p className="text-navy">{selected.property}{selected.unit && ` - Unit ${selected.unit}`}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-text-muted text-xs">Tenant</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-text-muted" />
                        <p className="text-navy">{selected.tenant}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-text-muted text-xs">Submitted</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-text-muted" />
                        <p className="text-navy">{formatDate(selected.submittedDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="border-t border-sage/30 pt-4">
                    <h3 className="font-medium text-navy mb-3">Scheduling</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-text-muted text-xs">Scheduled Date</Label>
                        <Input type="date" value={selected.scheduledDate || ""} onChange={(e) => handleUpdateSchedule(selected.id, "scheduled_date", e.target.value)} className="mt-1 border-sage" />
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Scheduled Time</Label>
                        <Input type="time" value={selected.scheduledTime || ""} onChange={(e) => handleUpdateSchedule(selected.id, "scheduled_time", e.target.value)} className="mt-1 border-sage" />
                      </div>
                    </div>
                  </div>

                  {/* Assign Contractor */}
                  <div className="border-t border-sage/30 pt-4">
                    <h3 className="font-medium text-navy mb-3">Assign Contractor</h3>
                    <Select value={selected.contractor_id || ""} onValueChange={(v) => handleAssignContractor(selected.id, v)}>
                      <SelectTrigger className="border-sage"><SelectValue placeholder="Select contractor..." /></SelectTrigger>
                      <SelectContent>
                        {contractorRows.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-text-muted">Add contractors in Settings first</div>
                        ) : (
                          contractorRows.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{c.category ? ` · ${c.category}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selected.contractor_id && selected.contractor_token && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 border-teal text-teal hover:bg-teal/10"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/contractor/${selected.contractor_token}`)
                          toast.success("Contractor link copied — send it to them directly")
                        }}
                      >
                        Copy contractor link
                      </Button>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="border-t border-sage/30 pt-4">
                    <Label className="text-navy">Landlord Notes</Label>
                    <Textarea
                      placeholder="Add internal notes about this request..."
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      onBlur={() => handleSaveNotes(selected.id, notesDraft)}
                      className="mt-2 border-sage min-h-[80px]"
                    />
                    <p className="text-xs text-text-muted mt-1">Private to you — saves automatically when you click away.</p>
                  </div>

                  {/* Activity & Costs */}
                  <div className="border-t border-sage/30 pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <Label className="text-navy">Activity &amp; Costs</Label>
                      {activityCostTotal > 0 && (
                        <span className="text-sm font-medium text-navy">Total spent: {formatCurrency(activityCostTotal)}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 mb-3">
                      A timestamped record of what was done and what it cost. Add a note, a cost, or both. Status,
                      scheduling, and contractor changes are logged automatically.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="e.g. Plumber replaced valve"
                        value={logDraft}
                        onChange={(e) => setLogDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleLogUpdate()
                          }
                        }}
                        className="border-sage flex-1"
                      />
                      <div className="flex gap-2">
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                          <Input
                            type="number" step="0.01" min="0" placeholder="Cost"
                            value={costDraft}
                            onChange={(e) => setCostDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleLogUpdate()
                              }
                            }}
                            className="border-sage pl-6"
                          />
                        </div>
                        <Button onClick={handleLogUpdate} disabled={(!logDraft.trim() && !costDraft.trim()) || loggingUpdate} className="bg-teal hover:bg-teal-dark text-white shrink-0">
                          Log
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {activityLoading ? (
                        <p className="text-xs text-text-muted py-2">Loading history…</p>
                      ) : activityLog.length === 0 ? (
                        <p className="text-xs text-text-muted py-2">No activity logged yet.</p>
                      ) : (
                        <ul className="space-y-3">
                          {activityLog.map((entry) => (
                            <li key={entry.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-teal mt-1.5 shrink-0" />
                                <div className="w-px flex-1 bg-sage/40" />
                              </div>
                              <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-xs font-medium text-navy">{ACTIVITY_LABELS[entry.action] ?? "Update"}</span>
                                  <span className="text-xs text-text-muted whitespace-nowrap">{entry.created_at ? formatActivityTime(entry.created_at) : ""}</span>
                                </div>
                                {entry.detail && <p className="text-sm text-text-primary mt-0.5 break-words">{entry.detail}</p>}
                                {typeof entry.cost === "number" && <p className="text-sm font-medium text-teal mt-0.5">{formatCurrency(entry.cost)}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  )
}
