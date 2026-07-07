"use client"

import { useState, useEffect, useCallback } from "react"
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
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Static reference content (no backing table)
const provincialForms = {
  ON: [
    { name: "Standard Lease (OREA)", description: "Ontario Standard Form of Lease", category: "Lease", url: "#" },
    { name: "N4 - Notice to End Tenancy", description: "Non-payment of rent", category: "Notice", url: "#" },
    { name: "N11 - Agreement to End Tenancy", description: "Mutual agreement to terminate", category: "Notice", url: "#" },
    { name: "N12 - Notice to End Tenancy", description: "Landlord's own use", category: "Notice", url: "#" },
    { name: "N13 - Notice to End Tenancy", description: "Demolition or major repairs", category: "Notice", url: "#" },
    { name: "N1 - Notice of Rent Increase", description: "Annual rent increase notice", category: "Notice", url: "#" },
    { name: "N2 - Notice of Entry", description: "24-hour notice of entry", category: "Notice", url: "#" },
    { name: "L1 - Application to Evict", description: "Non-payment of rent", category: "Application", url: "#" },
    { name: "L2 - Application to End Tenancy", description: "Persistent late payment", category: "Application", url: "#" },
  ],
  BC: [
    { name: "Standard Lease Agreement", description: "BC Residential Tenancy Agreement", category: "Lease", url: "#" },
    { name: "RTB-33 - Ten Day Notice", description: "Non-payment of rent", category: "Notice", url: "#" },
    { name: "RTB-32 - One Month Notice", description: "End of tenancy", category: "Notice", url: "#" },
    { name: "Rent Increase Notice", description: "Annual rent increase", category: "Notice", url: "#" },
    { name: "Notice of Entry", description: "24-hour entry notice", category: "Notice", url: "#" },
  ],
  AB: [
    { name: "Residential Tenancy Agreement", description: "Alberta standard lease", category: "Lease", url: "#" },
    { name: "14-Day Notice to Terminate", description: "Non-payment of rent", category: "Notice", url: "#" },
    { name: "Rent Increase Notice", description: "Annual rent increase", category: "Notice", url: "#" },
    { name: "Notice of Entry", description: "24-hour entry notice", category: "Notice", url: "#" },
  ],
}

const messageTemplates = [
  { id: "1", icon: "DollarSign", name: "Late Rent Reminder", preview: "This is a reminder that your rent payment..." },
  { id: "2", icon: "Wrench", name: "Maintenance Update", preview: "We wanted to update you on the status of..." },
  { id: "3", icon: "Calendar", name: "Lease Renewal Notice", preview: "Your lease is set to expire on..." },
  { id: "4", icon: "AlertTriangle", name: "Entry Notice (24hrs)", preview: "Please be advised that entry to..." },
  { id: "5", icon: "DollarSign", name: "Rent Increase Notice", preview: "We are writing to inform you of..." },
  { id: "6", icon: "FileText", name: "General Notice", preview: "We would like to inform you that..." },
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
  const [conversations, setConversations] = useState<any[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([])
  const [dbProperties, setDbProperties] = useState<any[]>([])
  // No documents table exists yet; render an empty list
  const documents: any[] = []
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("all")
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false)
  const [showUploadDocModal, setShowUploadDocModal] = useState(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const loadInbox = useCallback(async () => {
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
          tenant: profileNameMap.get(otherId) || "Unknown",
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
      if (m.property_id) convo.propertyId = m.property_id
      if (m.recipient_id === user.id && !m.read) convo.unread = true
    })
    const convos = Array.from(convoMap.values())

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
      notes: r.landlord_notes ?? "",
    }))

    setDbProperties(props ?? [])
    setConversations(convos)
    setMaintenanceRequests(mappedRequests)
    // Preserve the currently selected conversation across refreshes
    setSelectedConversation((prev: any) =>
      prev ? convos.find((c) => c.id === prev.id) ?? convos[0] ?? null : convos[0] ?? null
    )
    setSelectedRequest((prev: any) =>
      prev ? mappedRequests.find((r) => r.id === prev.id) ?? mappedRequests[0] ?? null : mappedRequests[0] ?? null
    )
  }, [])

  useEffect(() => {
    loadInbox()
  }, [loadInbox])

  const handleSendMessage = async () => {
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
      ...(selectedConversation.propertyId ? { property_id: selectedConversation.propertyId } : {}),
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

  const properties = [{ id: "all", name: "All Properties" }, ...dbProperties]

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-navy">Inbox</h1>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-48 border-sage">
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
          <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-navy">
            Documents
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
                  <Label className="text-navy">Message</Label>
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
          <div className="flex gap-4 h-full">
            {/* Conversation List */}
            <Card className="w-80 border-sage/50 flex flex-col">
              <div className="p-3 border-b border-sage/20">
                <Button
                  onClick={openCompose}
                  className="w-full bg-teal hover:bg-teal-dark text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </div>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {conversations.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">No data yet</div>
                  )}
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
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
            <Card className="flex-1 border-sage/50 flex flex-col">
              {!selectedConversation ? (
                <CardContent className="flex-1 flex items-center justify-center text-sm text-text-muted">
                  No data yet
                </CardContent>
              ) : (
              <>
              <CardHeader className="border-b border-sage/20 py-4">
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
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[70%]",
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
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className={cn(
                          "text-xs text-text-muted mt-1",
                          message.sender === "landlord" ? "text-right" : "text-left"
                        )}>
                          {message.timestamp}
                        </p>
                      </div>
                    ))}
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
                        <Button variant="outline" className="border-navy/20 text-navy" disabled>
                          Templates
                          <Lock className="h-3 w-3 ml-1.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        {messageTemplates.map((template) => (
                          <DropdownMenuItem key={template.id} className="flex flex-col items-start py-2">
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
          <div className="flex gap-4 h-full">
            {/* Request List */}
            <Card className="w-80 border-sage/50 flex flex-col">
              <CardHeader className="py-3 border-b border-sage/20">
                <div className="flex items-center justify-between">
                  <Select value={maintenanceStatusFilter} onValueChange={setMaintenanceStatusFilter}>
                    <SelectTrigger className="w-32 border-sage h-8 text-sm">
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
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredRequests.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">No data yet</div>
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
            <Card className="flex-1 border-sage/50">
              {!selectedRequest ? (
                <CardContent className="h-full flex items-center justify-center text-sm text-text-muted">
                  No data yet
                </CardContent>
              ) : (
              <ScrollArea className="h-full">
                <CardContent className="p-6">
                  <div className="space-y-6">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-text-muted text-xs">Category</Label>
                        <p className="text-navy mt-1">{selectedRequest.category}</p>
                      </div>
                      <div>
                        <Label className="text-text-muted text-xs">Priority</Label>
                        <div className="mt-1">
                          <Select defaultValue={selectedRequest.priority}>
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
                          <Select defaultValue={selectedRequest.status}>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-text-muted text-xs">Scheduled Date</Label>
                          <Input
                            type="date"
                            defaultValue={selectedRequest.scheduledDate}
                            className="mt-1 border-sage"
                          />
                        </div>
                        <div>
                          <Label className="text-text-muted text-xs">Scheduled Time</Label>
                          <Input
                            type="time"
                            defaultValue={selectedRequest.scheduledTime ? "10:00" : ""}
                            className="mt-1 border-sage"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assign Contractor */}
                    <div className="border-t border-sage/30 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-navy">Assign Contractor</h3>
                        <span className="flex items-center gap-1 text-xs text-navy bg-sage/30 px-2 py-1 rounded-full">
                          <Lock className="h-3 w-3" />
                          Essential
                        </span>
                      </div>
                      <Select disabled defaultValue={selectedRequest.contractor || ""}>
                        <SelectTrigger className="border-sage opacity-70">
                          <SelectValue placeholder="Select contractor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(contractors).map(([category, list]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-medium text-text-muted">{category}</div>
                              {list.map((contractor) => (
                                <SelectItem key={contractor.id} value={contractor.name}>
                                  <div className="flex items-center gap-2">
                                    {contractor.starred && <Star className="h-3 w-3 text-warning fill-warning" />}
                                    {contractor.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-sm text-teal cursor-pointer hover:bg-sage/10">
                            <Plus className="h-3 w-3 inline mr-1" />
                            Add New Contractor
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="border-t border-sage/30 pt-4">
                      <Label className="text-navy">Landlord Notes</Label>
                      <Textarea
                        placeholder="Add internal notes about this request..."
                        defaultValue={selectedRequest.notes}
                        className="mt-2 border-sage min-h-[80px]"
                      />
                    </div>

                    <Button className="bg-teal hover:bg-teal-dark text-white">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </ScrollArea>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="h-[calc(100%-3rem)] mt-0">
          <div className="space-y-6">
            {/* Document List */}
            <Card className="border-sage/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">Documents</CardTitle>
                  <Button
                    onClick={() => setShowUploadDocModal(true)}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">No data yet</div>
                  )}
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-sage/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-white border border-sage/30 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-navy" />
                        </div>
                        <div>
                          <p className="font-medium text-navy text-sm">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Badge variant="outline" className="text-xs border-sage">
                              {doc.type}
                            </Badge>
                            <span>{doc.property}</span>
                            <span>{formatDate(doc.date)}</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-navy hover:bg-navy/5">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Provincial Forms */}
            <Card className="border-sage/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">Provincial Rental Forms</CardTitle>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-48 border-sage">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {provincialForms[selectedProvince as keyof typeof provincialForms]?.map((form, index) => (
                    <a
                      key={index}
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 bg-sage/10 rounded-lg hover:bg-sage/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy text-sm">{form.name}</p>
                          <ExternalLink className="h-3 w-3 text-text-muted" />
                        </div>
                        <p className="text-xs text-text-muted mt-1">{form.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs border-sage">
                          {form.category}
                        </Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Maintenance Request Modal */}
      <Dialog open={showCreateRequestModal} onOpenChange={setShowCreateRequestModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">Create Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-navy">Title *</Label>
              <Input id="title" placeholder="Brief description of the issue" className="mt-1.5 border-sage" />
            </div>
            <div>
              <Label htmlFor="description" className="text-navy">Description *</Label>
              <Textarea id="description" placeholder="Detailed description..." className="mt-1.5 border-sage min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-navy">Property *</Label>
                <Select>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Viceroy</SelectItem>
                    <SelectItem value="2">Oak Street House</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-navy">Unit</Label>
                <Select>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="101">101</SelectItem>
                    <SelectItem value="102">102</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-navy">Category</Label>
                <Select>
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
                <Select>
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
            <Button variant="outline" onClick={() => setShowCreateRequestModal(false)} className="border-navy/20 text-navy">
              Cancel
            </Button>
            <Button className="bg-teal hover:bg-teal-dark text-white">
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={showUploadDocModal} onOpenChange={setShowUploadDocModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-sage rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted mb-2">Drag and drop your file here, or click to browse</p>
              <Button variant="outline" className="border-navy/20 text-navy">
                Choose File
              </Button>
            </div>
            <div>
              <Label htmlFor="docName" className="text-navy">Document Name</Label>
              <Input id="docName" placeholder="e.g., Lease Agreement" className="mt-1.5 border-sage" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-navy">Type</Label>
                <Select>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-navy">Property</Label>
                <Select>
                  <SelectTrigger className="mt-1.5 border-sage">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Viceroy</SelectItem>
                    <SelectItem value="2">Oak Street House</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-navy">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Add any notes about this document..." className="mt-1.5 border-sage min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDocModal(false)} className="border-navy/20 text-navy">
              Cancel
            </Button>
            <Button className="bg-teal hover:bg-teal-dark text-white">
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
