"use client"

import { useState } from "react"
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

// Mock data
const mockMessages = [
  {
    id: "1",
    sender: "landlord",
    senderName: "John Smith",
    content:
      "Hi Sarah, just wanted to let you know that there will be maintenance work in the building lobby tomorrow between 9 AM and 12 PM.",
    timestamp: "May 28, 2026 at 10:30 AM",
  },
  {
    id: "2",
    sender: "tenant",
    senderName: "Sarah Chen",
    content: "Thanks for letting me know! Will this affect access to the parking garage?",
    timestamp: "May 28, 2026 at 10:45 AM",
  },
  {
    id: "3",
    sender: "landlord",
    senderName: "John Smith",
    content:
      "No, the parking garage entrance will remain accessible. Only the main lobby will have limited access during that time.",
    timestamp: "May 28, 2026 at 11:00 AM",
  },
]

const mockMaintenanceRequests = [
  {
    id: "1",
    title: "Kitchen faucet leaking",
    description:
      "The kitchen faucet has been dripping constantly for the past few days. It's getting worse and wasting water.",
    category: "Plumbing",
    priority: "medium" as const,
    status: "in-progress" as const,
    createdAt: "May 25, 2026",
    timeline: [
      { date: "May 25, 2026", event: "Request submitted", by: "Sarah Chen" },
      { date: "May 26, 2026", event: "Request reviewed", by: "John Smith" },
      {
        date: "May 27, 2026",
        event: "Contractor assigned - Mike's Plumbing",
        by: "John Smith",
      },
    ],
    landlordNotes: "Contractor will arrive on June 2nd at 2:00 PM. Please ensure someone is home.",
    contractor: "Mike's Plumbing",
    scheduledDate: "June 2, 2026 at 2:00 PM",
  },
  {
    id: "2",
    title: "Bathroom exhaust fan not working",
    description: "The exhaust fan in the main bathroom stopped working last week.",
    category: "Electrical",
    priority: "low" as const,
    status: "completed" as const,
    createdAt: "March 10, 2026",
    timeline: [
      { date: "March 10, 2026", event: "Request submitted", by: "Sarah Chen" },
      { date: "March 11, 2026", event: "Request reviewed", by: "John Smith" },
      {
        date: "March 12, 2026",
        event: "Contractor assigned - ABC Electric",
        by: "John Smith",
      },
      { date: "March 15, 2026", event: "Repair completed", by: "ABC Electric" },
    ],
    landlordNotes: "Fan replaced with new energy-efficient model.",
    contractor: "ABC Electric",
    scheduledDate: "March 15, 2026",
  },
]

const mockDocuments = [
  {
    id: "1",
    name: "Lease Agreement - 2025-2026.pdf",
    uploadedAt: "August 15, 2025",
    size: "245 KB",
  },
  {
    id: "2",
    name: "Building Rules and Regulations.pdf",
    uploadedAt: "August 15, 2025",
    size: "128 KB",
  },
  {
    id: "3",
    name: "Move-in Inspection Report.pdf",
    uploadedAt: "September 1, 2025",
    size: "1.2 MB",
  },
]

export default function TenantInbox() {
  const [activeTab, setActiveTab] = useState("messages")
  const [newMessage, setNewMessage] = useState("")
  const [selectedRequest, setSelectedRequest] = useState(mockMaintenanceRequests[0])
  const [maintenanceFilter, setMaintenanceFilter] = useState<"all" | "open" | "closed">("all")
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  })

  const filteredRequests = mockMaintenanceRequests.filter((req) => {
    if (maintenanceFilter === "open") return req.status !== "completed"
    if (maintenanceFilter === "closed") return req.status === "completed"
    return true
  })

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    // Handle sending message
    setNewMessage("")
  }

  const handleSubmitRequest = () => {
    // Handle submitting maintenance request
    setShowNewRequestModal(false)
    setNewRequest({ title: "", description: "", category: "", priority: "" })
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
                  JS
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-navy">John Smith</p>
                <p className="text-xs text-text-muted">Landlord</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((message) => (
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
                  <SelectTrigger className="w-32">
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
                      <div className="grid grid-cols-2 gap-4">
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

                    {selectedRequest.landlordNotes && (
                      <div className="bg-cream rounded-lg p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                          Landlord Notes
                        </p>
                        <p className="text-sm text-navy">
                          {selectedRequest.landlordNotes}
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
              {mockDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents"
                  description="Your landlord hasn't shared any documents yet."
                />
              ) : (
                <div className="space-y-3">
                  {mockDocuments.map((doc) => (
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
