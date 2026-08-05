"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Send,
  Wrench,
  FileText,
  Download,
  Plus,
  Camera,
  X,
} from "lucide-react"
import { PriorityBadge } from "@/components/priority-badge"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

// Live data is fetched from Supabase inside the component

export default function TenantInbox() {
  const [activeTab, setActiveTab] = useState("messages")
  const [newMessage, setNewMessage] = useState("")
  const [maintenanceFilter, setMaintenanceFilter] = useState<"all" | "open" | "closed">("all")
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  })

  const [userId, setUserId] = useState<string | null>(null)
  const [landlord, setLandlord] = useState<any | null>(null)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  // No documents table exists yet; render an empty list
  const documents: any[] = []

  const formatDateTime = (value?: string | null) => {
    if (!value) return ""
    return new Date(value).toLocaleString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatDate = (value?: string | null) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const loadInbox = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Tenant's lease -> landlord + property
    const { data: lease } = await supabase
      .from("leases")
      .select("landlord_id, property_id")
      .eq("tenant_id", user.id)
      .limit(1)
      .maybeSingle()

    let landlordProfile: any = null
    if (lease?.landlord_id) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("id", lease.landlord_id)
        .maybeSingle()
      landlordProfile = data ?? null
    }

    // Messages involving this tenant (messages table uses sender_id / recipient_id)
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true })

    const mappedMessages = (msgs ?? []).map((m: any) => ({
      id: m.id,
      sender: m.sender_id === user.id ? "tenant" : "landlord",
      content: m.content,
      timestamp: formatDateTime(m.created_at),
    }))

    // Maintenance requests submitted by this tenant
    const { data: requests } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false })

    const mappedRequests = (requests ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      category: r.category ?? "—",
      priority: r.priority ?? "medium",
      status: r.status ?? "open",
      createdAt: formatDate(r.created_at),
      timeline: [],
      // landlord_notes is internal to the landlord — never exposed to tenants
      contractor: "",
      scheduledDate: r.scheduled_date ? formatDate(r.scheduled_date) : "",
    }))

    setLandlord(landlordProfile)
    setPropertyId(lease?.property_id ?? null)
    setMessages(mappedMessages)
    setMaintenanceRequests(mappedRequests)
    setSelectedRequest(mappedRequests[0] ?? null)
  }

  useEffect(() => {
    loadInbox()
  }, [])

  const landlordName =
    [landlord?.first_name, landlord?.last_name].filter(Boolean).join(" ").trim() ||
    landlord?.email ||
    "Landlord"
  const landlordInitials =
    landlordName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "—"

  const filteredRequests = maintenanceRequests.filter((req) => {
    if (maintenanceFilter === "open") return req.status !== "completed"
    if (maintenanceFilter === "closed") return req.status === "completed"
    return true
  })

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    if (!userId || !landlord?.id) {
      toast.error("Unable to send message. No landlord is associated with your account yet.")
      return
    }
    const supabase = createClient()
    const content = newMessage.trim()
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: landlord.id,
      content,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    setNewMessage("")
    toast.success("Message sent")
    loadInbox()
  }

  const handleSubmitRequest = async () => {
    if (!userId) {
      toast.error("You must be signed in to submit a request.")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from("maintenance_requests").insert({
      tenant_id: userId,
      landlord_id: landlord?.id ?? null,
      property_id: propertyId,
      title: newRequest.title,
      description: newRequest.description,
      category: newRequest.category || null,
      priority: newRequest.priority || "medium",
      status: "open",
    })
    if (error) {
      toast.error(error.message)
      return
    }
    setShowNewRequestModal(false)
    setNewRequest({ title: "", description: "", category: "", priority: "" })
    toast.success("Maintenance request submitted")
    loadInbox()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">Inbox</h1>
        <p className="text-sm text-text-muted mt-1">
          Messages, maintenance requests, and documents
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-sage/50">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card className="border-sage/50 h-[600px] flex flex-col">
            <div className="p-4 border-b border-sage/30 flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-sage-light">
                <AvatarFallback className="bg-sage-light text-navy text-sm">
                  {landlordInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-navy">{landlordName}</p>
                <p className="text-xs text-text-muted">Landlord</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-6">No data yet</p>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "tenant" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "tenant"
                          ? "bg-teal text-white"
                          : "bg-cream text-navy"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "tenant"
                            ? "text-white/70"
                            : "text-text-muted"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-sage/30">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Panel - Request List */}
            <Card className="border-sage/50 lg:col-span-1">
              <div className="p-4 border-b border-sage/30 flex items-center justify-between">
                <Select
                  value={maintenanceFilter}
                  onValueChange={(value: "all" | "open" | "closed") =>
                    setMaintenanceFilter(value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog
                  open={showNewRequestModal}
                  onOpenChange={setShowNewRequestModal}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-teal hover:bg-teal-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-navy">
                        New Maintenance Request
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newRequest.title}
                          onChange={(e) =>
                            setNewRequest({ ...newRequest, title: e.target.value })
                          }
                          placeholder="Brief description of the issue"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={newRequest.description}
                          onChange={(e) =>
                            setNewRequest({
                              ...newRequest,
                              description: e.target.value,
                            })
                          }
                          placeholder="Provide details about the issue..."
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={newRequest.category}
                            onValueChange={(value) =>
                              setNewRequest({ ...newRequest, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="hvac">HVAC</SelectItem>
                              <SelectItem value="pest">Pest Control</SelectItem>
                              <SelectItem value="structural">Structural</SelectItem>
                              <SelectItem value="appliance">Appliance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select
                            value={newRequest.priority}
                            onValueChange={(value) =>
                              setNewRequest({ ...newRequest, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Photos (max 5)</Label>
                        <div className="mt-2 border-2 border-dashed border-sage rounded-lg p-6 text-center">
                          <Camera className="h-8 w-8 text-text-muted mx-auto mb-2" />
                          <p className="text-sm text-text-muted">
                            Click or drag photos here
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewRequestModal(false)}
                          className="border-sage text-navy hover:bg-sage/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitRequest}
                          className="bg-teal hover:bg-teal-dark text-white"
                          disabled={!newRequest.title || !newRequest.description}
                        >
                          Submit Request
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[500px]">
                {filteredRequests.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={Wrench}
                      title="No maintenance requests"
                      description="You haven't submitted any maintenance requests yet."
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-sage/30">
                    {filteredRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`w-full p-4 text-left hover:bg-cream/50 transition-colors ${
                          selectedRequest?.id === request.id ? "bg-cream" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <PriorityBadge priority={request.priority} />
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-sm font-medium text-navy mt-2">
                          {request.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {request.createdAt}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Right Panel - Request Details */}
            <Card className="border-sage/50 lg:col-span-2">
              {selectedRequest ? (
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={selectedRequest.priority} />
                        <StatusBadge status={selectedRequest.status} />
                      </div>
                      <h2 className="text-lg font-medium text-navy">
                        {selectedRequest.title}
                      </h2>
                      <p className="text-sm text-text-muted">
                        {selectedRequest.category} - Submitted{" "}
                        {selectedRequest.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                        Description
                      </p>
                      <p className="text-sm text-navy">
                        {selectedRequest.description}
                      </p>
                    </div>

                    {selectedRequest.contractor && (
                      <div className="bg-teal/5 rounded-lg p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                          Assigned Contractor
                        </p>
                        <p className="text-sm font-medium text-navy">
                          {selectedRequest.contractor}
                        </p>
                        <p className="text-sm text-teal-dark">
                          Scheduled: {selectedRequest.scheduledDate}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
                        Status Timeline
                      </p>
                      <div className="space-y-3">
                        {selectedRequest.timeline.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-teal mt-2" />
                            <div>
                              <p className="text-sm text-navy">{item.event}</p>
                              <p className="text-xs text-text-muted">
                                {item.date} by {item.by}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState
                    icon={Wrench}
                    title="Select a request"
                    description="Choose a maintenance request from the list to view details."
                  />
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="border-sage/50">
            <CardContent className="p-6">
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents"
                  description="Your landlord hasn't shared any documents yet."
                />
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-cream"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-teal-dark" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy">
                            {doc.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {doc.uploadedAt} - {doc.size}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-sage text-navy hover:bg-sage/20"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
