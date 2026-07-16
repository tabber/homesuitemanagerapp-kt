"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface PropertyOption {
  id: string
  name: string
}

interface CreateRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  landlordId: string
  properties?: PropertyOption[]
  presetPropertyId?: string
  presetPropertyName?: string
  onCreated?: () => void
}

const emptyForm = {
  title: "",
  description: "",
  propertyId: "",
  unitId: "",
  category: "",
  priority: "",
}

export function CreateRequestModal({
  open,
  onOpenChange,
  landlordId,
  properties = [],
  presetPropertyId,
  presetPropertyName,
  onCreated,
}: CreateRequestModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [units, setUnits] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // The effective property is the preset (when provided) or the one selected in the dropdown.
  const effectivePropertyId = presetPropertyId ?? form.propertyId

  // Reset the form whenever the modal opens (seeding the preset property if given).
  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, propertyId: presetPropertyId ?? "" })
    }
  }, [open, presetPropertyId])

  // Load units for the effective property.
  useEffect(() => {
    let isMounted = true
    async function loadUnits() {
      if (!effectivePropertyId) {
        setUnits([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from("units")
        .select("id, unit_number")
        .eq("property_id", effectivePropertyId)
        .order("unit_number", { ascending: true })
      if (isMounted) setUnits(data ?? [])
    }
    loadUnits()
    return () => {
      isMounted = false
    }
  }, [effectivePropertyId])

  const handleCreate = async () => {
    if (creating) return
    if (!form.title.trim() || !form.description.trim() || !effectivePropertyId) {
      toast.error("Title, description, and property are required.")
      return
    }
    if (!landlordId) {
      toast.error("You must be signed in to create a request.")
      return
    }
    setCreating(true)
    const supabase = createClient()

    // Best-effort: tie the request to the active lease (and its tenant) for the
    // selected property/unit so it shows up against the right tenant.
    let leaseQuery = supabase
      .from("leases")
      .select("id, tenant_id, unit_id")
      .eq("property_id", effectivePropertyId)
      .eq("status", "active")
    if (form.unitId) leaseQuery = leaseQuery.eq("unit_id", form.unitId)
    const { data: lease } = await leaseQuery.limit(1).maybeSingle()

    const { error } = await supabase.from("maintenance_requests").insert({
      landlord_id: landlordId,
      property_id: effectivePropertyId,
      unit_id: form.unitId || null,
      lease_id: lease?.id ?? null,
      tenant_id: lease?.tenant_id ?? null,
      title: form.title,
      description: form.description,
      category: form.category || null,
      priority: form.priority || "medium",
      status: "open",
    })
    setCreating(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Maintenance request created")
    onOpenChange(false)
    setForm(emptyForm)
    setUnits([])
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy font-medium">Create Maintenance Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="request-title" className="text-navy">Title *</Label>
            <Input
              id="request-title"
              placeholder="Brief description of the issue"
              className="mt-1.5 border-sage"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="request-description" className="text-navy">Description *</Label>
            <Textarea
              id="request-description"
              placeholder="Detailed description..."
              className="mt-1.5 border-sage min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-navy">Property *</Label>
              {presetPropertyId ? (
                <div className="mt-1.5 flex h-10 items-center rounded-md border border-sage bg-sage/10 px-3 text-sm text-navy">
                  {presetPropertyName || "Selected property"}
                </div>
              ) : (
                <Select
                  value={form.propertyId}
                  onValueChange={(value) => setForm({ ...form, propertyId: value, unitId: "" })}
                >
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-text-muted">No properties</div>
                    )}
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-navy">Unit</Label>
              <Select
                value={form.unitId}
                onValueChange={(value) => setForm({ ...form, unitId: value })}
                disabled={!effectivePropertyId || units.length === 0}
              >
                <SelectTrigger className="mt-1.5 border-sage">
                  <SelectValue placeholder={units.length === 0 ? "No units" : "Select unit"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-navy">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger className="mt-1.5 border-sage">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="appliance">Appliance</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-navy">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm({ ...form, priority: value })}
              >
                <SelectTrigger className="mt-1.5 border-sage">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-navy/20 text-navy">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              creating ||
              !form.title.trim() ||
              !form.description.trim() ||
              !effectivePropertyId
            }
            className="bg-teal hover:bg-teal-dark text-white"
          >
            {creating ? "Creating..." : "Create Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
