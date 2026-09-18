"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/empty-state"
import { createClient } from "@/lib/supabase/client"

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

const fmtDate = (d: string | null) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
    : "—"

export function PropertyImprovements({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: "", category: "", cost: "", date_completed: "", notes: "" })

  const load = useCallback(async () => {
    if (!propertyId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("property_improvements")
      .select("*")
      .eq("property_id", propertyId)
      .order("date_completed", { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [propertyId])

  useEffect(() => {
    load()
  }, [load])

  const total = rows.reduce((sum, r) => sum + (typeof r.cost === "number" ? r.cost : 0), 0)

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Enter what was done")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    let receiptUrl: string | null = null
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop() || "jpg"
      const path = `property-improvements/${propertyId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, receiptFile, { contentType: receiptFile.type || undefined })
      if (!upErr) receiptUrl = path
    }

    const { error } = await supabase.from("property_improvements").insert({
      property_id: propertyId,
      landlord_id: user.id,
      title: form.title.trim(),
      category: form.category || null,
      cost: form.cost.trim() ? Number(form.cost) : null,
      date_completed: form.date_completed || null,
      notes: form.notes || null,
      receipt_url: receiptUrl,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setForm({ title: "", category: "", cost: "", date_completed: "", notes: "" })
    setReceiptFile(null)
    setShowAdd(false)
    toast.success("Improvement logged")
    load()
  }

  const openReceipt = async (path: string) => {
    const supabase = createClient()
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-navy">Improvements &amp; Repairs</h3>
          <p className="text-sm text-text-muted">
            Capital work done to this property.
            {total > 0 && <span className="font-medium text-navy"> Total: {fmtMoney(total)}</span>}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAdd((s) => !s)}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Log improvement
        </Button>
      </div>

      {showAdd && (
        <Card className="border-sage/50 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-navy text-xs">What was done</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. New roof, furnace replacement"
                className="border-sage"
              />
            </div>
            <div>
              <Label className="text-navy text-xs">Category (optional)</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Roof, HVAC"
                className="border-sage"
              />
            </div>
            <div>
              <Label className="text-navy text-xs">Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
                className="border-sage"
              />
            </div>
            <div>
              <Label className="text-navy text-xs">Date completed</Label>
              <Input
                type="date"
                value={form.date_completed}
                onChange={(e) => setForm((f) => ({ ...f, date_completed: e.target.value }))}
                className="border-sage"
              />
            </div>
            <div>
              <Label className="text-navy text-xs">Receipt (optional)</Label>
              <label className="flex items-center h-10 px-3 rounded-md border border-sage text-sm text-teal cursor-pointer hover:bg-teal/5">
                {receiptFile ? receiptFile.name.slice(0, 20) : "Attach file"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-navy text-xs">Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Contractor, warranty, details…"
                className="border-sage"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-sage text-navy hover:bg-sage/20">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal-dark text-white">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Home} title="No improvements logged" description="Track roof, HVAC, and other capital work here." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="border-sage/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-navy">{r.title}</span>
                    {r.category && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-sage/30 text-navy">{r.category}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{fmtDate(r.date_completed)}</p>
                  {r.notes && <p className="text-sm text-text-muted mt-1">{r.notes}</p>}
                  {r.receipt_url && (
                    <button onClick={() => openReceipt(r.receipt_url)} className="text-xs text-teal hover:underline mt-1">
                      View receipt
                    </button>
                  )}
                </div>
                {typeof r.cost === "number" && (
                  <span className="text-sm font-medium text-navy whitespace-nowrap">{fmtMoney(r.cost)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
