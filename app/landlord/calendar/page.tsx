"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

// Event types and their color coding. Colors map to the app's brand tokens so
// the calendar reads as part of the product, not a bolted-on widget.
type EventType = "lease" | "payment" | "maintenance" | "reminder"

const EVENT_STYLES: Record<
  EventType,
  { label: string; dot: string; chipBg: string; chipText: string; href: string }
> = {
  lease: {
    label: "Leases",
    dot: "bg-navy",
    chipBg: "bg-navy/10",
    chipText: "text-navy",
    href: "/landlord/properties",
  },
  payment: {
    label: "Payments",
    dot: "bg-teal",
    chipBg: "bg-teal/15",
    chipText: "text-teal-dark",
    href: "/landlord/payments",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-warning",
    chipBg: "bg-warning/15",
    chipText: "text-navy",
    href: "/landlord/inbox",
  },
  reminder: {
    label: "Reminders",
    dot: "bg-sage-light",
    chipBg: "bg-sage/40",
    chipText: "text-navy",
    href: "/landlord/reminders",
  },
}

interface CalEvent {
  id: string
  type: EventType
  title: string
  date: string // YYYY-MM-DD
  propertyId: string | null
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [events, setEvents] = useState<CalEvent[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [propertyFilter, setPropertyFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<Set<EventType>>(
    new Set(["lease", "payment", "maintenance", "reminder"]),
  )
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [propsRes, leasesRes, paymentsRes, maintRes, remindersRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("landlord_id", user.id),
        supabase
          .from("leases")
          .select("id, start_date, end_date, property_id, tenant_name")
          .eq("landlord_id", user.id),
        supabase
          .from("payments")
          .select("id, payment_date, amount, property_id, status")
          .eq("landlord_id", user.id),
        supabase
          .from("maintenance_requests")
          .select("id, title, scheduled_date, property_id")
          .eq("landlord_id", user.id),
        supabase
          .from("maintenance_reminders")
          .select("id, title, due_date, property_id")
          .eq("landlord_id", user.id),
      ])

      if (!mounted) return

      const evts: CalEvent[] = []

      for (const l of leasesRes.data ?? []) {
        if (l.start_date)
          evts.push({
            id: `lease-start-${l.id}`,
            type: "lease",
            title: `Lease starts${l.tenant_name ? ` — ${l.tenant_name}` : ""}`,
            date: l.start_date,
            propertyId: l.property_id,
          })
        if (l.end_date)
          evts.push({
            id: `lease-end-${l.id}`,
            type: "lease",
            title: `Lease ends${l.tenant_name ? ` — ${l.tenant_name}` : ""}`,
            date: l.end_date,
            propertyId: l.property_id,
          })
      }
      for (const p of paymentsRes.data ?? []) {
        if (p.payment_date)
          evts.push({
            id: `pay-${p.id}`,
            type: "payment",
            title: `Payment${p.amount ? ` — $${Number(p.amount).toLocaleString()}` : ""}`,
            date: p.payment_date,
            propertyId: p.property_id,
          })
      }
      for (const m of maintRes.data ?? []) {
        if (m.scheduled_date)
          evts.push({
            id: `maint-${m.id}`,
            type: "maintenance",
            title: m.title || "Maintenance",
            date: m.scheduled_date,
            propertyId: m.property_id,
          })
      }
      for (const r of remindersRes.data ?? []) {
        if (r.due_date)
          evts.push({
            id: `rem-${r.id}`,
            type: "reminder",
            title: r.title || "Reminder",
            date: r.due_date,
            propertyId: r.property_id,
          })
      }

      setProperties(propsRes.data ?? [])
      setEvents(evts)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Events filtered by property + type, grouped by date string.
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) {
      if (!typeFilter.has(e.type)) continue
      if (propertyFilter !== "all" && e.propertyId !== propertyFilter) continue
      ;(map[e.date] ??= []).push(e)
    }
    return map
  }, [events, typeFilter, propertyFilter])

  // Build the month grid (weeks of days, including leading/trailing blanks).
  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.year, cursor.month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const rows: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cursor])

  const todayStr = ymd(new Date())

  const goPrev = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }))
  const goNext = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }))
  const goToday = () => {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
  }

  const toggleType = (t: EventType) =>
    setTypeFilter((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] ?? [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-navy">Calendar</h1>
          <p className="text-sm text-text-muted">Everything happening across your properties</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px] border-sage">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend / type filters — tap to toggle a type on/off */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(EVENT_STYLES) as EventType[]).map((t) => {
          const on = typeFilter.has(t)
          const s = EVENT_STYLES[t]
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                on
                  ? "border-sage bg-white text-navy"
                  : "border-sage/40 bg-transparent text-text-muted opacity-50"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-navy">
          {MONTHS[cursor.month]} {cursor.year}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToday} className="border-sage text-navy">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goPrev} className="text-navy">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext} className="text-navy">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="border-sage/50 overflow-hidden p-0">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-sage/40 bg-sage/10">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-2 text-center text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {/* Full name on desktop, single letter on mobile */}
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w[0]}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-sage/30 last:border-0">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-16 bg-sage/5 sm:min-h-28" />
                const ds = ymd(day)
                const dayEvents = eventsByDate[ds] ?? []
                const isToday = ds === todayStr
                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDay(ds)}
                    className="min-h-16 border-r border-sage/30 p-1.5 text-left last:border-0 hover:bg-sage/10 sm:min-h-28 sm:p-2"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-teal font-medium text-white" : "text-navy"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    {/* Desktop: event chips. Mobile: colored dots. */}
                    <div className="mt-1 hidden space-y-1 sm:block">
                      {dayEvents.slice(0, 3).map((e) => {
                        const s = EVENT_STYLES[e.type]
                        return (
                          <div
                            key={e.id}
                            className={`truncate rounded px-1.5 py-0.5 text-[11px] ${s.chipBg} ${s.chipText}`}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="px-1.5 text-[11px] text-text-muted">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {dayEvents.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className={`h-1.5 w-1.5 rounded-full ${EVENT_STYLES[e.type].dot}`}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      {loading && <p className="text-sm text-text-muted">Loading your calendar…</p>}

      {/* Selected-day detail (opens as a panel; the main way to read events on mobile) */}
      {selectedDay && (
        <Card className="border-sage/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-navy">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-CA", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
              className="text-text-muted"
            >
              Close
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing scheduled this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e) => {
                const s = EVENT_STYLES[e.type]
                return (
                  <li key={e.id}>
                    <Link
                      href={s.href}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-sage/10"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                      <span className="flex-1 text-sm text-navy">{e.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.chipBg} ${s.chipText}`}>
                        {s.label.replace(/s$/, "")}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
