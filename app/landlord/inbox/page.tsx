"use client"

import { useState } from "react"
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

// Mock data
const conversations = [
  {
    id: "1",
    tenant: "Amanda Wilson",
    property: "Oak Street House",
    unit: null,
    lastMessage: "Hi, I wanted to follow up on the maintenance request I submitted last week...",
    timestamp: "2 hours ago",
    unread: true,
    messages: [
      { id: "m1", sender: "tenant", text: "Hi, I noticed the kitchen faucet is leaking again. Can someone take a look?", timestamp: "May 28, 2026 at 10:15 AM" },
      { id: "m2", sender: "landlord", text: "Hi Amanda, thanks for letting me know. I'll schedule a plumber to come by this week. Would Thursday work for you?", timestamp: "May 28, 2026 at 11:30 AM" },
      { id: "m3", sender: "tenant", text: "Thursday afternoon would be perfect. Thank you!", timestamp: "May 28, 2026 at 11:45 AM" },
      { id: "m4", sender: "landlord", text: "Great, I've scheduled it for Thursday between 2-4 PM. The plumber will call before arriving.", timestamp: "May 28, 2026 at 12:00 PM" },
      { id: "m5", sender: "tenant", text: "Hi, I wanted to follow up on the maintenance request I submitted last week...", timestamp: "May 30, 2026 at 3:00 PM" },
    ],
  },
  {
    id: "2",
    tenant: "John Smith",
    property: "Viceroy",
    unit: "101",
    lastMessage: "The new dishwasher is working great. Thanks for getting it replaced so quickly!",
    timestamp: "1 day ago",
    unread: false,
    messages: [
      { id: "m1", sender: "tenant", text: "The new dishwasher is working great. Thanks for getting it replaced so quickly!", timestamp: "May 29, 2026 at 4:30 PM" },
    ],
  },
  {
    id: "3",
    tenant: "Sarah Johnson",
    property: "Viceroy",
    unit: "102",
    lastMessage: "Just wanted to confirm my rent payment went through for this month.",
    timestamp: "2 days ago",
    unread: false,
    messages: [
      { id: "m1", sender: "tenant", text: "Just wanted to confirm my rent payment went through for this month.", timestamp: "May 28, 2026 at 9:00 AM" },
      { id: "m2", sender: "landlord", text: "Yes, I received it. Thank you!", timestamp: "May 28, 2026 at 9:30 AM" },
    ],
  },
]

const maintenanceRequests = [
  {
    id: "1",
    title: "HVAC not cooling properly",
    description: "The air conditioning unit in the living room isn't cooling effectively. It's been running constantly but the temperature won't go below 78°F.",
    property: "Viceroy",
    unit: "303",
    tenant: "David Lee",
    category: "HVAC",
    priority: "urgent" as const,
    status: "in-progress" as const,
    submittedDate: "2026-05-25",
    photos: [],
    notes: "",
    scheduledDate: "2026-06-01",
    scheduledTime: "10:00 AM",
    contractor: "Cool Air HVAC Services",
  },
  {
    id: "2",
    title: "Broken window latch",
    description: "The window latch in the bedroom is broken and won't lock properly.",
    property: "Viceroy",
    unit: "201",
    tenant: "Mike Brown",
    category: "Structural",
    priority: "high" as const,
    status: "open" as const,
    submittedDate: "2026-05-28",
    photos: [],
    notes: "",
    scheduledDate: "",
    scheduledTime: "",
    contractor: "",
  },
  {
    id: "3",
    title: "Dishwasher leaking",
    description: "Water is pooling under the dishwasher after each cycle.",
    property: "Viceroy",
    unit: "102",
    tenant: "Sarah Johnson",
    category: "Appliance",
    priority: "medium" as const,
    status: "open" as const,
    submittedDate: "2026-05-20",
    photos: [],
    notes: "",
    scheduledDate: "",
    scheduledTime: "",
    contractor: "",
  },
  {
    id: "4",
    title: "Garbage disposal jammed",
    description: "The garbage disposal is making a grinding noise and won't work.",
    property: "Oak Street House",
    unit: null,
    tenant: "Amanda Wilson",
    category: "Appliance",
    priority: "low" as const,
    status: "completed" as const,
    submittedDate: "2026-05-15",
    photos: [],
    notes: "Fixed by resetting the disposal unit.",
    scheduledDate: "",
    scheduledTime: "",
    contractor: "",
  },
]

const documents = [
  { id: "1", name: "Lease Agreement - Oak Street House", type: "Lease", property: "Oak Street House", date: "2025-09-01", size: "245 KB" },
  { id: "2", name: "Move-in Inspection Report", type: "Inspection", property: "Oak Street House", date: "2025-09-01", size: "1.2 MB" },
  { id: "3", name: "Lease Agreement - Unit 101", type: "Lease", property: "Viceroy", date: "2025-06-15", size: "230 KB" },
  { id: "4", name: "Insurance Certificate 2026", type: "Insurance", property: "Viceroy", date: "2026-01-15", size: "156 KB" },
]

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

const properties = [
  { id: "all", name: "All Properties" },
  { id: "1", name: "Viceroy" },
  { id: "2", name: "Oak Street House" },
]

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("messages")
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [selectedRequest, setSelectedRequest] = useState(maintenanceRequests[0])
  const [messageInput, setMessageInput] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("all")
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false)
  const [showUploadDocModal, setShowUploadDocModal] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("ON")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const unreadMessages = conversations.filter((c) => c.unread).length
  const openRequests = maintenanceRequests.filter((r) => r.status === "open" || r.status === "in-progress").length

  // Filter maintenance requests
  const filteredRequests = maintenanceRequests.filter((request) => {
    const matchesProperty = propertyFilter === "all" || request.property === properties.find(p => p.id === propertyFilter)?.name
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
          <div className="flex gap-4 h-full">
            {/* Conversation List */}
            <Card className="w-80 border-sage/50 flex flex-col">
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "w-full p-4 text-left border-b border-sage/20 hover:bg-sage/10 transition-colors",
                        selectedConversation.id === conversation.id && "bg-sage/20"
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
              <CardHeader className="border-b border-sage/20 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-medium">
                    {selectedConversation.tenant.split(" ").map((n) => n[0]).join("")}
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
                    {selectedConversation.messages.map((message) => (
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
                    <Button className="bg-teal hover:bg-teal-dark text-white">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
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
                  {filteredRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={cn(
                        "w-full p-4 text-left border-b border-sage/20 hover:bg-sage/10 transition-colors",
                        selectedRequest.id === request.id && "bg-sage/20"
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
