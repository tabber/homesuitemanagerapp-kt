"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  Send,
  Plus,
  Download,
  Trash2,
  Upload,
  FileText,
  ExternalLink,
  Lock,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  Star,
  Wrench,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { CreateRequestModal } from "@/components/create-request-modal"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

// Static reference content (no backing table)

// Templates the landlord can drop into a message. `preview` is the short
// label shown in the dropdown; `body` is the full text inserted into the
// message field. Square brackets mark the bits they need to fill in.
const messageTemplates = [
  {
    id: "1",
    icon: "DollarSign",
    name: "Late Rent Reminder",
    preview: "A friendly nudge about rent that's past due",
    body: `Hi there,

This is a friendly reminder that rent for this month is now past due. If you've already sent it, thank you — please disregard this message and let me know so I can confirm receipt.

If not, could you let me know when you expect to send it? Happy to work something out if you're having difficulty.

Thanks,`,
  },
  {
    id: "2",
    icon: "Wrench",
    name: "Maintenance Update",
    preview: "Let a tenant know where their request stands",
    body: `Hi there,

I wanted to give you an update on the maintenance request you submitted.

[Describe the status — e.g. a contractor has been assigned and will attend on DATE between TIME and TIME.]

Please let me know if that timing doesn't work, or if anything changes in the meantime.

Thanks,`,
  },
  {
    id: "3",
    icon: "Calendar",
    name: "Lease Renewal Notice",
    preview: "Start the conversation about renewing",
    body: `Hi there,

Your current lease is set to end on [DATE]. I wanted to reach out early to ask whether you're planning to stay on.

If you'd like to renew, let me know and I'll get the paperwork started. If you're planning to move on, that's completely fine — just let me know so we can plan accordingly.

Thanks,`,
  },
  {
    id: "4",
    icon: "AlertTriangle",
    name: "Entry Notice",
    preview: "Give notice before entering the unit",
    body: `Hi there,

I'm writing to give notice that I (or someone on my behalf) will need to enter the unit on [DATE] between [TIME] and [TIME].

Reason for entry: [e.g. repairs, inspection, showing the unit]

Please let me know if this timing is a problem and we can arrange something else. Note that provincial tenancy rules set the required notice period — please check your lease or your provincial tenancy authority for specifics.

Thanks,`,
  },
  {
    id: "5",
    icon: "DollarSign",
    name: "Rent Increase Notice",
    preview: "Notify a tenant of an upcoming rent change",
    body: `Hi there,

I'm writing to let you know that rent will be changing from [CURRENT AMOUNT] to [NEW AMOUNT], effective [DATE].

Rent increases are subject to provincial rules on notice periods and allowable amounts — please confirm the requirements with your provincial tenancy authority before sending this.

Please let me know if you have any questions.

Thanks,`,
  },
  {
    id: "6",
    icon: "FileText",
    name: "General Notice",
    preview: "A blank starting point for anything else",
    body: `Hi there,

[Your message here.]

Thanks,`,
  },
]

const contractors = {
  Plumbing: [
    { id: "1", name: "Joe's Plumbing", phone: "(604) 555-0101", starred: true },
    { id: "2", name: "Quick Fix Plumbers", phone: "(604) 555-0102", starred: false },
  ],
  HVAC: [
    { id: "3", name: "Cool Air HVAC Services", phone: "(604) 555-0201", starred: true },
  ],
  Electrical: [
    { id: "4", name: "Bright Spark Electric", phone: "(604) 555-0301", starred: false },
  ],
  Appliance: [
    { id: "5", name: "Appliance Pros", phone: "(604) 555-0401", starred: true },
  ],
  General: [
    { id: "6", name: "Handy Dan's Services", phone: "(604) 555-0501", starred: false },
  ],
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("messages")

  // Honor a ?tab= deep link (e.g. from the dashboard's recent-activity list).
  // Read from window.location to avoid the Suspense boundary that
  // useSearchParams would require at build time.
  useEffect(() => {
    if (typeof window === "undefined") return
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab === "maintenance" || tab === "messages" || tab === "documents") {
      setActiveTab(tab)
    }
  }, [])
  const [conversations, setConversations] = useState<any[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([])
  const [dbProperties, setDbProperties] = useState<any[]>([])
  // No documents table exists yet; render an empty list
  const documents: any[] = []
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [notesDraft, setNotesDraft] = useState("")
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [logDraft, setLogDraft] = useState("")
  const [loggingUpdate, setLoggingUpdate] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("all")
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false)
  const [showUploadDocModal, setShowUploadDocModal] = useState(false)
  const [contractorRows, setContractorRows] = useState<any[]>([])
  const [selectedProvince, setSelectedProvince] = useState("ON")
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Compose (new message) modal
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeMode, setComposeMode] = useState<"tenant" | "property" | "all">("tenant")
  const [composeTenantId, setComposeTenantId] = useState("")
  const [composePropertyId, setComposePropertyId] = useState("")
  const [composeText, setComposeText] = useState("")
  const [composeSending, setComposeSending] = useState(false)
  const [activeLeases, setActiveLeases] = useState<any[]>([])

  // Upload Document modal
  const [uploadLeaseId, setUploadLeaseId] = useState("")
  const [uploadDocType, setUploadDocType] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatActivityTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-CA", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const ACTIVITY_LABELS: Record<string, string> = {
    status_change: "Status changed",
    contractor_assigned: "Contractor assigned",
    scheduled: "Scheduled",
    note: "Update",
  }

  const loadInbox = useCallback(async () => {
    // Contractors available for maintenance assignment
    try {
      const sb = createClient()
      const {
        data: { user: cu },
      } = await sb.auth.getUser()
      if (cu) {
        const { data: crows } = await sb
          .from("contractors")
          .select("id, name, category")
          .eq("landlord_id", cu.id)
          .order("name", { ascending: true })
        setContractorRows(crows ?? [])
      }
    } catch {
      // non-fatal
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Properties owned by this landlord (for the filter + name lookups)
    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id)
    const propertyNameMap = new Map<string, string>((props ?? []).map((p: any) => [p.id, p.name]))

    // Messages involving this user (messages table uses sender_id / recipient_id)
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true })

    // Maintenance requests for this landlord
    const { data: requests } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })

    // Leases give us tenant names and the property behind each conversation,
    // including for tenancies that have ended.
    const { data: leaseRows } = await supabase
      .from("leases")
      .select("id, tenant_id, tenant_name, tenant_email, property_id, unit_id, status")
      .eq("landlord_id", user.id)

    const leaseById = new Map<string, any>()
    const leaseByTenant = new Map<string, any>()
    ;(leaseRows ?? []).forEach((l: any) => {
      leaseById.set(l.id, l)
      if (l.tenant_id && !leaseByTenant.has(l.tenant_id)) leaseByTenant.set(l.tenant_id, l)
    })

    // Collect every other-party / tenant id so we can resolve names in one query
    const profileIds = new Set<string>()
    ;(msgs ?? []).forEach((m: any) => {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
      if (otherId) profileIds.add(otherId)
    })
    ;(requests ?? []).forEach((r: any) => {
      if (r.tenant_id) profileIds.add(r.tenant_id)
    })

    const profileNameMap = new Map<string, string>()
    if (profileIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", Array.from(profileIds))
      ;(profiles ?? []).forEach((p: any) => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || "Unknown"
        profileNameMap.set(p.id, name)
      })
    }

    // Group messages into conversations keyed by the other participant
    const convoMap = new Map<string, any>()
    ;(msgs ?? []).forEach((m: any) => {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
      if (!otherId) return
      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, {
          id: otherId,
          recipientId: otherId,
          propertyId: null,
          leaseId: null,
          tenant:
            profileNameMap.get(otherId) ||
            leaseByTenant.get(otherId)?.tenant_name ||
            leaseByTenant.get(otherId)?.tenant_email ||
            "Former tenant",
          property: "",
          unit: null,
          lastMessage: "",
          timestamp: "",
          unread: false,
          messages: [],
        })
      }
      const convo = convoMap.get(otherId)
      const text = m.body ?? m.content ?? ""
      convo.messages.push({
        id: m.id,
        sender: m.sender_id === user.id ? "landlord" : "tenant",
        text,
        timestamp: m.created_at ? formatDate(m.created_at) : "",
      })
      convo.lastMessage = text
      convo.timestamp = m.created_at ? formatDate(m.created_at) : ""
      // Raw value for sorting — the display string above isn't sortable
      convo.lastMessageAt = m.created_at ? new Date(m.created_at).getTime() : 0
      // Messages carry a lease_id; the property comes from that lease.
      const msgLease = m.lease_id ? leaseById.get(m.lease_id) : null
      const fallbackLease = leaseByTenant.get(otherId)
      const lease = msgLease ?? fallbackLease
      if (lease) {
        convo.leaseId = lease.id ?? convo.leaseId
        convo.propertyId = lease.property_id ?? convo.propertyId
        convo.property = propertyNameMap.get(lease.property_id) ?? convo.property
        if (lease.status && lease.status !== "active") convo.former = true
      }
      if (m.recipient_id === user.id && !m.read) convo.unread = true
    })
    // Most recent conversation first — messages arrive oldest-first, so
    // without this the stalest threads sit at the top.
    const convos = Array.from(convoMap.values()).sort(
      (a: any, b: any) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    )

    // Reshape maintenance requests for the existing UI
    const mappedRequests = (requests ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      category: r.category ?? "—",
      priority: r.priority ?? "medium",
      status: r.status ?? "open",
      property_id: r.property_id,
      property: r.property_id ? propertyNameMap.get(r.property_id) ?? "—" : "—",
      unit: r.unit_id ?? null,
      tenant: r.tenant_id ? profileNameMap.get(r.tenant_id) ?? "—" : "—",
      submittedDate: r.created_at,
      scheduledDate: r.scheduled_date ?? "",
      scheduledTime: r.scheduled_time ?? "",
      contractor: "",
      contractor_token: r.contractor_token ?? null,
      notes: r.landlord_notes ?? "",
    }))

    setDbProperties(props ?? [])
    setConversations(convos)
    setMaintenanceRequests(mappedRequests)
    // Preserve the currently selected conversation across refreshes
    // On desktop, auto-select the first item so the detail pane isn't empty.
    // On mobile the list IS the first screen, so don't auto-open a thread.
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

    setSelectedConversation((prev: any) =>
      prev
        ? convos.find((c) => c.id === prev.id) ?? (isDesktop ? convos[0] ?? null : null)
        : isDesktop
          ? convos[0] ?? null
          : null
    )
    setSelectedRequest((prev: any) =>
      prev
        ? mappedRequests.find((r) => r.id === prev.id) ?? (isDesktop ? mappedRequests[0] ?? null : null)
        : isDesktop
          ? mappedRequests[0] ?? null
          : null
    )
  }, [])

  useEffect(() => {
    loadInbox()
  }, [loadInbox])

  // Keep the notes draft in sync with whichever request is open
  useEffect(() => {
    setNotesDraft(selectedRequest?.notes ?? "")
    if (selectedRequest?.id) {
      loadActivity(selectedRequest.id)
    } else {
      setActivityLog([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.id])

  // Jump to the newest message when a thread opens or updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [selectedConversation?.id, selectedConversation?.messages?.length])


 // Append an immutable activity record for a request, and optimistically show it.
  const logActivity = async (requestId: string, action: string, detail?: string) => {
    if (!userId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("maintenance_activity")
      .insert({
        request_id: requestId,
        landlord_id: userId,
        action,
        detail: detail || null,
      })
      .select()
      .single()
    if (error) {
      // History is best-effort — never block the primary action on it, but
      // surface it so a missing table/migration doesn't fail silently.
      console.error("Could not log maintenance activity:", error.message)
      return
    }
    if (data) setActivityLog((prev) => [data, ...prev])
  }

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

  const handleLogUpdate = async () => {
    const text = logDraft.trim()
    if (!text || !selectedRequest) return
    setLoggingUpdate(true)
    await logActivity(selectedRequest.id, "note", text)
    setLoggingUpdate(false)
    setLogDraft("")
    toast.success("Update logged")
  }

 const handleAssignContractor = async (requestId: string, contractorId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ contractor_id: contractorId || null })
      .eq("id", requestId)
    if (error) {
      toast.error(error.message)
      return
    }
    // Update local state so the dropdown reflects the new selection immediately
    setSelectedRequest((prev: any) =>
      prev && prev.id === requestId ? { ...prev, contractor_id: contractorId } : prev
    )
    setMaintenanceRequests((prev: any[]) =>
      prev.map((r) => (r.id === requestId ? { ...r, contractor_id: contractorId } : r))
    )
    if (contractorId) {
      const contractorName =
        contractorRows.find((c: any) => c.id === contractorId)?.name ?? "a contractor"
      await logActivity(requestId, "contractor_assigned", `Assigned ${contractorName}`)
    }
    toast.success("Contractor assigned")
  }

  const handleUpdateStatus = async (requestId: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ status })
      .eq("id", requestId)
    if (error) {
      toast.error(error.message)
      return
    }
    setSelectedRequest((prev: any) =>
      prev && prev.id === requestId ? { ...prev, status } : prev
    )
    setMaintenanceRequests((prev: any[]) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    )
    const statusLabel =
      status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)
    await logActivity(requestId, "status_change", `Status set to ${statusLabel}`)
    toast.success("Status updated")
  }  
  // Opening a conversation marks its incoming messages as read.
  const openConversation = async (conversation: any) => {
    setSelectedConversation(conversation)
    if (!conversation?.unread || !userId) return

    // Optimistically clear the badge so the UI responds immediately
    setConversations((prev: any[]) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unread: false } : c))
    )

    const supabase = createClient()
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("sender_id", conversation.recipientId)
      .eq("read", false)
  }

  const handleUpdatePriority = async (requestId: string, priority: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ priority })
      .eq("id", requestId)
    if (error) {
      toast.error(error.message)
      return
    }
    setSelectedRequest((prev: any) =>
      prev && prev.id === requestId ? { ...prev, priority } : prev
    )
    setMaintenanceRequests((prev: any[]) =>
      prev.map((r) => (r.id === requestId ? { ...r, priority } : r))
    )
    toast.success("Priority updated")
  }

  const handleUpdateSchedule = async (
    requestId: string,
    field: "scheduled_date" | "scheduled_time",
    value: string
  ) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ [field]: value || null })
      .eq("id", requestId)
    if (error) {
      toast.error(error.message)
      return
    }
    const localField = field === "scheduled_date" ? "scheduledDate" : "scheduledTime"
    setSelectedRequest((prev: any) =>
      prev && prev.id === requestId ? { ...prev, [localField]: value } : prev
    )
    setMaintenanceRequests((prev: any[]) =>
      prev.map((r) => (r.id === requestId ? { ...r, [localField]: value } : r))
    )
    if (value) {
      const label = field === "scheduled_date" ? "date" : "time"
      await logActivity(requestId, "scheduled", `Set scheduled ${label} to ${value}`)
    }
    toast.success("Schedule updated")
  }

  // Notes save on blur, and only when the text actually changed, so clicking
  // in and out of the field doesn't fire a pointless save.
  const handleSaveNotes = async (requestId: string, notes: string) => {
    const current = maintenanceRequests.find((r) => r.id === requestId)
    if ((current?.notes ?? "") === notes) return

    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ landlord_notes: notes || null })
      .eq("id", requestId)
    if (error) {
      toast.error(error.message)
      return
    }
    setSelectedRequest((prev: any) =>
      prev && prev.id === requestId ? { ...prev, notes } : prev
    )
    setMaintenanceRequests((prev: any[]) =>
      prev.map((r) => (r.id === requestId ? { ...r, notes } : r))
    )
    toast.success("Notes saved")
  }
    const handleSendMessage = async () => 
      {
    const text = messageInput.trim()
    if (!text || sending) return
    if (!userId || !selectedConversation?.recipientId) {
      toast.error("Unable to send message: no recipient selected.")
      return
    }
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: selectedConversation.recipientId,
      content: text,
      ...(selectedConversation.leaseId ? { lease_id: selectedConversation.leaseId } : {}),
    })
    setSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setMessageInput("")
    toast.success("Message sent")
    loadInbox()
  }

  // Load this landlord's active leases (tenant + property + lease id) for the compose modal
  const loadActiveLeases = async () => {
    if (!userId) return
    const supabase = createClient()
    const { data: leases } = await supabase
      .from("leases")
      .select("id, tenant_id, tenant_name, property_id")
      .eq("landlord_id", userId)
      .eq("status", "active")
    const rows = (leases ?? []).filter((l: any) => l.tenant_id)

    // Resolve names for leases that don't carry a tenant_name
    const missing = rows.filter((r: any) => !r.tenant_name).map((r: any) => r.tenant_id)
    const nameMap = new Map<string, string>()
    if (missing.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", missing)
      ;(profs ?? []).forEach((p: any) => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || "Tenant"
        nameMap.set(p.id, name)
      })
    }

    setActiveLeases(
      rows.map((r: any) => ({
        leaseId: r.id,
        tenantId: r.tenant_id,
        tenantName: r.tenant_name || nameMap.get(r.tenant_id) || "Tenant",
        propertyId: r.property_id,
      }))
    )
  }

  const openCompose = () => {
    setComposeMode("tenant")
    setComposeTenantId("")
    setComposePropertyId("")
    setComposeText("")
    loadActiveLeases()
    setShowComposeModal(true)
  }

  const handleComposeSend = async () => {
    const text = composeText.trim()
    if (!text || composeSending) return
    if (!userId) {
      toast.error("You must be signed in to send a message.")
      return
    }

    // Resolve recipients based on the selected mode
    let targets: { tenantId: string; leaseId: string }[] = []
    if (composeMode === "tenant") {
      if (!composeTenantId) {
        toast.error("Please select a tenant.")
        return
      }
      const lease = activeLeases.find((l) => l.tenantId === composeTenantId)
      if (lease) targets = [{ tenantId: lease.tenantId, leaseId: lease.leaseId }]
    } else if (composeMode === "property") {
      if (!composePropertyId) {
        toast.error("Please select a property.")
        return
      }
      targets = activeLeases
        .filter((l) => l.propertyId === composePropertyId)
        .map((l) => ({ tenantId: l.tenantId, leaseId: l.leaseId }))
    } else {
      targets = activeLeases.map((l) => ({ tenantId: l.tenantId, leaseId: l.leaseId }))
    }

    // Skip duplicate recipients
    const seen = new Set<string>()
    targets = targets.filter((t) => {
      if (!t.tenantId || seen.has(t.tenantId)) return false
      seen.add(t.tenantId)
      return true
    })

    if (targets.length === 0) {
      toast.error("No active tenants found for this selection.")
      return
    }

    setComposeSending(true)
    const supabase = createClient()
    const { error } = await supabase.from("messages").insert(
      targets.map((t) => ({
        sender_id: userId,
        recipient_id: t.tenantId,
        content: text,
        lease_id: t.leaseId,
      }))
    )
    setComposeSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`Message sent to ${targets.length} tenant(s)`)
    setShowComposeModal(false)
    setComposeText("")
    setComposeTenantId("")
    setComposePropertyId("")
    loadInbox()
  }

  const openUploadDoc = () => {
    setUploadLeaseId("")
    setUploadDocType("")
    setUploadFile(null)
    loadActiveLeases()
    setShowUploadDocModal(true)
  }

  const handleUploadDocument = async () => {
    if (uploading) return
    if (!userId) {
      toast.error("You must be signed in to upload a document.")
      return
    }
    if (!uploadFile) {
      toast.error("Please choose a file to upload.")
      return
    }
    if (!uploadLeaseId) {
      toast.error("Please select a lease/tenant.")
      return
    }

    setUploading(true)
    const supabase = createClient()

    // Resolve the property for the selected lease
    const { data: lease } = await supabase
      .from("leases")
      .select("id, property_id")
      .eq("id", uploadLeaseId)
      .maybeSingle()

    if (!lease) {
      setUploading(false)
      toast.error("Selected lease could not be found.")
      return
    }

    const filePath = `${uploadLeaseId}/${uploadFile.name}`
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, uploadFile, { upsert: true })

    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from("documents").insert({
      lease_id: uploadLeaseId,
      property_id: lease.property_id,
      uploaded_by: userId,
      document_type: uploadDocType || "other",
      file_url: filePath,
      file_name: uploadFile.name,
      file_size: uploadFile.size,
    })

    setUploading(false)
    if (insertError) {
      toast.error(insertError.message)
      return
    }

    toast.success("Document uploaded")
    setShowUploadDocModal(false)
    setUploadLeaseId("")
    setUploadDocType("")
    setUploadFile(null)
  }

  const properties = [{ id: "all", name: "All Properties" }, ...dbProperties]

  const filteredConversations = conversations.filter(
    (c) => propertyFilter === "all" || c.propertyId === propertyFilter
  )

  const unreadMessages = conversations.filter((c) => c.unread).length
  const openRequests = maintenanceRequests.filter((r) => r.status === "open" || r.status === "in-progress").length

  // Filter maintenance requests
  const filteredRequests = maintenanceRequests.filter((request) => {
    const matchesProperty = propertyFilter === "all" || request.property_id === propertyFilter
    const matchesStatus = maintenanceStatusFilter === "all" || request.status === maintenanceStatusFilter
    return matchesProperty && matchesStatus
  })

  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-medium text-navy">Inbox</h1>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-full sm:w-48 border-sage">
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-4rem)]">
        <TabsList className="bg-sage/20 border border-sage/30 mb-4">
          <TabsTrigger value="messages" className="data-[state=active]:bg-white data-[state=active]:text-navy">
            Messages
            {unreadMessages > 0 && (
              <Badge className="ml-2 bg-teal text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:text-navy">
            Maintenance
            {openRequests > 0 && (
              <Badge className="ml-2 bg-warning text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                {openRequests}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="h-[calc(100%-3rem)] mt-0">
          <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-navy">New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-navy">To</Label>
                  <Select
                    value={composeMode}
                    onValueChange={(v) => setComposeMode(v as "tenant" | "property" | "all")}
                  >
                    <SelectTrigger className="border-sage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Specific tenant</SelectItem>
                      <SelectItem value="property">Property / building</SelectItem>
                      <SelectItem value="all">All tenants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {composeMode === "tenant" && (
                  <div className="space-y-2">
                    <Label className="text-navy">Tenant</Label>
                    <Select value={composeTenantId} onValueChange={setComposeTenantId}>
                      <SelectTrigger className="border-sage">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLeases.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-text-muted">No active tenants</div>
                        )}
                        {activeLeases.map((l) => (
                          <SelectItem key={l.leaseId} value={l.tenantId}>
                            {l.tenantName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {composeMode === "property" && (
                  <div className="space-y-2">
                    <Label className="text-navy">Property</Label>
                    <Select value={composePropertyId} onValueChange={setComposePropertyId}>
                      <SelectTrigger className="border-sage">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {dbProperties.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-text-muted">No properties</div>
                        )}
                        {dbProperties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-navy">Message</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-teal hover:bg-teal/10 h-auto py-1"
                        >
                          Use a template
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        {messageTemplates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => setComposeText(template.body)}
                            className="flex flex-col items-start py-2 cursor-pointer"
                          >
                            <span className="font-medium text-navy">{template.name}</span>
                            <span className="text-xs text-text-muted truncate w-full">
                              {template.preview}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    placeholder="Type your message..."
                    className="border-sage min-h-28"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-navy/20 text-navy hover:bg-navy/5"
                  onClick={() => setShowComposeModal(false)}
                  disabled={composeSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleComposeSend}
                  disabled={composeSending || !composeText.trim()}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  {composeSending ? "Sending..." : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Conversation List — hidden on mobile once a thread is open */}
            <Card className={cn(
              "w-full md:w-80 border-sage/50 flex flex-col flex-shrink-0",
              selectedConversation && "hidden md:flex"
            )}>
              <div className="p-3 border-b border-sage/20">
                <Button
                  onClick={openCompose}
                  className="w-full bg-teal hover:bg-teal-dark text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </div>
              <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredConversations.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">
                      No conversations yet. Use Compose to message a tenant.
                    </div>
                  )}
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation)}
                      className={cn(
                        "w-full p-4 text-left border-b border-sage/20 hover:bg-sage/10 transition-colors",
                        selectedConversation?.id === conversation.id && "bg-sage/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-medium">
                            {conversation.tenant.split(" ").map((n) => n[0]).join("")}
                          </div>
                          {conversation.unread && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn("font-medium text-navy text-sm", conversation.unread && "font-semibold")}>
                              {conversation.tenant}
                            </p>
                            <span className="text-xs text-text-muted">{conversation.timestamp}</span>
                          </div>
                          <p className="text-xs text-text-muted">{conversation.property}{conversation.unit && ` - Unit ${conversation.unit}`}</p>
                          <p className="text-sm text-text-muted truncate mt-1">{conversation.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className={cn(
              "flex-1 border-sage/50 flex flex-col",
              !selectedConversation && "hidden md:flex"
            )}>
              {!selectedConversation ? (
                <CardContent className="flex-1 flex items-center justify-center text-sm text-text-muted">
                  No data yet
                </CardContent>
              ) : (
              <>
              <CardHeader className="border-b border-sage/20 py-4">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden flex items-center gap-1 text-sm text-teal mb-3"
                >
                  ← All conversations
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-medium">
                    {selectedConversation.tenant.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-navy">{selectedConversation.tenant}</p>
                    <p className="text-sm text-text-muted">
                      {selectedConversation.property}{selectedConversation.unit && ` - Unit ${selectedConversation.unit}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 min-h-0 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[70%] min-w-0",
                          message.sender === "landlord" ? "ml-auto" : "mr-auto"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            message.sender === "landlord"
                              ? "bg-navy text-white"
                              : "bg-sage/30 text-navy"
                          )}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <p className={cn(
                          "text-xs text-text-muted mt-1",
                          message.sender === "landlord" ? "text-right" : "text-left"
                        )}>
                          {message.timestamp}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-sage/20">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 border-sage"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-navy/20 text-navy">
                          Templates
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        {messageTemplates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => setMessageInput(template.body)}
                            className="flex flex-col items-start py-2 cursor-pointer"
                          >
                            <span className="font-medium text-navy">{template.name}</span>
                            <span className="text-xs text-text-muted truncate w-full">{template.preview}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !messageInput.trim()}
                      className="bg-teal hover:bg-teal-dark text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="h-[calc(100%-3rem)] mt-0">
          <div className="flex items-center justify-end mb-3">
            <Link
              href="/landlord/reminders"
              className="inline-flex items-center gap-1.5 text-sm text-teal hover:underline"
            >
              <Bell className="h-4 w-4" />
              Manage seasonal reminders
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Request List — hidden on mobile once a request is open */}
            <Card className={cn(
              "w-full md:w-80 border-sage/50 flex flex-col flex-shrink-0",
              selectedRequest && "hidden md:flex"
            )}>
              <CardHeader className="py-3 border-b border-sage/20">
                <div className="flex items-center justify-between">
                  <Select value={maintenanceStatusFilter} onValueChange={setMaintenanceStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32 border-sage h-8 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateRequestModal(true)}
                    className="bg-teal hover:bg-teal-dark text-white h-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredRequests.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">
                      No conversations yet. Use Compose to message a tenant.
                    </div>
                  )}
                  {filteredRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={cn(
                        "w-full p-4 text-left border-b border-sage/20 hover:bg-sage/10 transition-colors",
                        selectedRequest?.id === request.id && "bg-sage/20"
                      )}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <PriorityBadge priority={request.priority} />
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="font-medium text-navy text-sm">{request.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {request.property}{request.unit && ` - Unit ${request.unit}`}
                      </p>
                      <p className="text-xs text-text-muted">
                        Submitted {formatDate(request.submittedDate)}
                      </p>
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Request Detail */}
            <Card className={cn(
              "flex-1 border-sage/50",
              !selectedRequest && "hidden md:block"
            )}>
              {!selectedRequest ? (
                <CardContent className="h-full flex items-center justify-center text-sm text-text-muted">
                  No data yet
                </CardContent>
              ) : (
              <ScrollArea className="h-full">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="md:hidden flex items-center gap-1 text-sm text-teal"
                    >
                      ← All requests
                    </button>
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={selectedRequest.priority} />
                        <StatusBadge status={selectedRequest.status} />
                      </div>
                      <h2 className="text-xl font-medium text-navy">{selectedRequest.title}</h2>
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-text-muted text-xs">Description</Label>
                      <p className="text-navy mt-1">{selectedRequest.description}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-text-muted text-xs">Category</Label>
                        <p className="text-navy mt-1">{selectedRequest.category}</p>
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Priority</Label>
                        <div className="mt-1">
                          <Select
                            value={selectedRequest.priority}
                            onValueChange={(v) => handleUpdatePriority(selectedRequest.id, v)}
                          >
                            <SelectTrigger className="border-sage">
                              <SelectValue />
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
                      <div>
                        <Label className="text-text-muted text-xs">Status</Label>
                        <div className="mt-1">
                         <Select
                            value={selectedRequest.status}
                            onValueChange={(v) => handleUpdateStatus(selectedRequest.id, v)}
                          >
                            <SelectTrigger className="border-sage">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Property</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-text-muted" />
                          <p className="text-navy">{selectedRequest.property}{selectedRequest.unit && ` - Unit ${selectedRequest.unit}`}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Tenant</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-text-muted" />
                          <p className="text-navy">{selectedRequest.tenant}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Submitted</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-text-muted" />
                          <p className="text-navy">{formatDate(selectedRequest.submittedDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scheduling */}
                    <div className="border-t border-sage/30 pt-4">
                      <h3 className="font-medium text-navy mb-3">Scheduling</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-text-muted text-xs">Scheduled Date</Label>
                          <Input
                            type="date"
                            value={selectedRequest.scheduledDate || ""}
                            onChange={(e) =>
                              handleUpdateSchedule(
                                selectedRequest.id,
                                "scheduled_date",
                                e.target.value
                              )
                            }
                            className="mt-1 border-sage"
                          />
                        </div>
                        <div>
                          <Label className="text-text-muted text-xs">Scheduled Time</Label>
                          <Input
                            type="time"
                            value={selectedRequest.scheduledTime || ""}
                            onChange={(e) =>
                              handleUpdateSchedule(
                                selectedRequest.id,
                                "scheduled_time",
                                e.target.value
                              )
                            }
                            className="mt-1 border-sage"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assign Contractor */}
                    <div className="border-t border-sage/30 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-navy">Assign Contractor</h3>

                      </div>
                      <Select
                        value={selectedRequest.contractor_id || ""}
                        onValueChange={(v) => handleAssignContractor(selectedRequest.id, v)}
                      >
                        <SelectTrigger className="border-sage">
                          <SelectValue placeholder="Select contractor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {contractorRows.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-text-muted">
                              Add contractors in Settings first
                            </div>
                          ) : (
                            contractorRows.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                                {c.category ? ` · ${c.category}` : ""}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedRequest.contractor_id && selectedRequest.contractor_token && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 border-teal text-teal hover:bg-teal/10"
                          onClick={() => {
                            const link = `${window.location.origin}/contractor/${selectedRequest.contractor_token}`
                            navigator.clipboard.writeText(link)
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
                        onBlur={() => handleSaveNotes(selectedRequest.id, notesDraft)}
                        className="mt-2 border-sage min-h-[80px]"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Private to you — saves automatically when you click away.
                      </p>
                    </div>

                    {/* Activity History */}
                    <div className="border-t border-sage/30 pt-4">
                      <Label className="text-navy">Activity History</Label>
                      <p className="text-xs text-text-muted mt-1 mb-3">
                        A timestamped record of what was done — contacted a contractor,
                        ordered a part, and so on. Status, scheduling, and contractor
                        changes are logged automatically.
                      </p>

                      {/* Log a new update */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Called plumber, part ordered — ETA Friday"
                          value={logDraft}
                          onChange={(e) => setLogDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleLogUpdate()
                            }
                          }}
                          className="border-sage"
                        />
                        <Button
                          onClick={handleLogUpdate}
                          disabled={!logDraft.trim() || loggingUpdate}
                          className="bg-teal hover:bg-teal-dark text-white shrink-0"
                        >
                          Log
                        </Button>
                      </div>

                      {/* Timeline */}
                      <div className="mt-4">
                        {activityLoading ? (
                          <p className="text-xs text-text-muted py-2">Loading history…</p>
                        ) : activityLog.length === 0 ? (
                          <p className="text-xs text-text-muted py-2">
                            No activity logged yet.
                          </p>
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
                                    <span className="text-xs font-medium text-navy">
                                      {ACTIVITY_LABELS[entry.action] ?? "Update"}
                                    </span>
                                    <span className="text-xs text-text-muted whitespace-nowrap">
                                      {entry.created_at
                                        ? formatActivityTime(entry.created_at)
                                        : ""}
                                    </span>
                                  </div>
                                  {entry.detail && (
                                    <p className="text-sm text-text-primary mt-0.5 break-words">
                                      {entry.detail}
                                    </p>
                                  )}
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
        </TabsContent>

      </Tabs>

      {/* Create Maintenance Request Modal */}
      <CreateRequestModal
        open={showCreateRequestModal}
        onOpenChange={setShowCreateRequestModal}
        landlordId={userId ?? ""}
        properties={dbProperties}
        onCreated={loadInbox}
      />

      {/* Upload Document Modal */}
      <Dialog open={showUploadDocModal} onOpenChange={setShowUploadDocModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-sage rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted mb-2">
                {uploadFile ? uploadFile.name : "Choose a file to upload"}
              </p>
              <input
                id="docFile"
                type="file"
                className="sr-only"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <Button asChild variant="outline" className="border-navy/20 text-navy">
                <label htmlFor="docFile" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-navy">Type</Label>
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-navy">Lease / Tenant</Label>
                <Select value={uploadLeaseId} onValueChange={setUploadLeaseId}>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLeases.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-text-muted">No active leases</div>
                    )}
                    {activeLeases.map((l) => (
                      <SelectItem key={l.leaseId} value={l.leaseId}>
                        {l.tenantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDocModal(false)} disabled={uploading} className="border-navy/20 text-navy">
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={uploading || !uploadFile || !uploadLeaseId}
              className="bg-teal hover:bg-teal-dark text-white"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
