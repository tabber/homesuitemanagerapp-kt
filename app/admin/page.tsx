"use client"

import { useState } from "react"
import {
  Users,
  Building2,
  DollarSign,
  Eye,
  Mail,
  MoreHorizontal,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"

// Mock MRR data
const mrrData = [
  { month: "Jun", revenue: 2450 },
  { month: "Jul", revenue: 3200 },
  { month: "Aug", revenue: 4100 },
  { month: "Sep", revenue: 5250 },
  { month: "Oct", revenue: 6800 },
  { month: "Nov", revenue: 8100 },
  { month: "Dec", revenue: 9450 },
  { month: "Jan", revenue: 11200 },
  { month: "Feb", revenue: 12800 },
  { month: "Mar", revenue: 14500 },
  { month: "Apr", revenue: 16200 },
  { month: "May", revenue: 18450 },
]

// Mock subscription breakdown
const subscriptionData = [
  { name: "Trial", value: 28, color: "var(--warning)" },
  { name: "Essential", value: 72, color: "var(--teal)" },
]

// Mock recent landlords
const mockLandlords = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    status: "active" as const,
    plan: "Essential",
    properties: 3,
    joinedAt: "May 15, 2026",
  },
  {
    id: "2",
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@email.com",
    status: "active" as const,
    plan: "Essential",
    properties: 5,
    joinedAt: "May 12, 2026",
  },
  {
    id: "3",
    firstName: "David",
    lastName: "Wilson",
    email: "david.wilson@email.com",
    status: "pending" as const,
    plan: "Trial",
    properties: 1,
    joinedAt: "May 28, 2026",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    status: "expired" as const,
    plan: "Trial",
    properties: 2,
    joinedAt: "April 20, 2026",
  },
  {
    id: "5",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@email.com",
    status: "active" as const,
    plan: "Essential",
    properties: 8,
    joinedAt: "March 5, 2026",
  },
]

export default function AdminDashboard() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleInvite = () => {
    // Handle invitation
    setShowInviteModal(false)
    setInviteEmail("")
  }

  const getStatusBadgeStatus = (status: string) => {
    if (status === "active") return "active"
    if (status === "pending") return "pending"
    return "expired"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-navy">Admin Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Platform overview and management
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          <Mail className="h-4 w-4 mr-2" />
          Invite Landlord
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Landlords"
          value="100"
          sublabel="72 active, 28 trial, 5 pending"
        />
        <StatCard
          label="MRR"
          value={formatCurrency(18450)}
          trend={{ direction: "up", value: "12.4%" }}
        />
        <StatCard
          label="Active Properties"
          value="342"
          sublabel="Across all landlords"
        />
        <StatCard
          label="Total Users"
          value="1,247"
          sublabel="Landlords + tenants"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR Chart */}
        <Card className="border-sage/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sage)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid var(--sage)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Subscription Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, ""]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid var(--sage)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {subscriptionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-text-muted">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Landlords */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            Recent Landlords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLandlords.map((landlord) => (
                <TableRow key={landlord.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-sage-light">
                        <AvatarFallback className="bg-sage-light text-navy text-xs">
                          {landlord.firstName[0]}
                          {landlord.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {landlord.firstName} {landlord.lastName}
                        </p>
                        <p className="text-xs text-text-muted">{landlord.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusBadgeStatus(landlord.status)} />
                  </TableCell>
                  <TableCell className="text-sm text-navy">{landlord.plan}</TableCell>
                  <TableCell className="text-sm text-navy">
                    {landlord.properties}
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {landlord.joinedAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Landlord Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Invite Landlord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Send an invitation email to a new landlord to join HomeSuite.
            </p>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="landlord@example.com"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="border-sage text-navy hover:bg-sage/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                className="bg-teal hover:bg-teal-dark text-white"
                disabled={!inviteEmail}
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
