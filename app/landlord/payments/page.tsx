"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  CreditCard,
  Eye,
  Copy,
  Mail,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/dialog"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Mock data
const revenueData = [
  { month: "Jan", collected: 18200, expected: 18500 },
  { month: "Feb", collected: 18500, expected: 18500 },
  { month: "Mar", collected: 17800, expected: 18500 },
  { month: "Apr", collected: 18500, expected: 18500 },
  { month: "May", collected: 16500, expected: 18500 },
  { month: "Jun", collected: 15200, expected: 18500 },
]

const payments = [
  { id: "1", tenant: "Amanda Wilson", unit: "Main", property: "Oak Street House", amount: 2800, method: "e-Transfer", date: "2026-05-01", status: "completed" as const },
  { id: "2", tenant: "John Smith", unit: "101", property: "Viceroy", amount: 1500, method: "e-Transfer", date: "2026-05-01", status: "completed" as const },
  { id: "3", tenant: "Sarah Johnson", unit: "102", property: "Viceroy", amount: 1800, method: "e-Transfer", date: "2026-05-02", status: "completed" as const },
  { id: "4", tenant: "Mike Brown", unit: "201", property: "Viceroy", amount: 2000, method: "e-Transfer", date: "2026-05-01", status: "completed" as const },
  { id: "5", tenant: "Emily Davis", unit: "203", property: "Viceroy", amount: 1800, method: "e-Transfer", date: "2026-05-03", status: "completed" as const },
  { id: "6", tenant: "Robert Wilson", unit: "301", property: "Viceroy", amount: 2500, method: "Cheque", date: "2026-05-05", status: "pending" as const },
  { id: "7", tenant: "Lisa Anderson", unit: "302", property: "Viceroy", amount: 2000, method: "e-Transfer", date: "2026-05-01", status: "completed" as const },
  { id: "8", tenant: "David Lee", unit: "303", property: "Viceroy", amount: 1500, method: "e-Transfer", date: "2026-05-08", status: "pending" as const },
  { id: "9", tenant: "Jennifer Taylor", unit: "401", property: "Viceroy", amount: 2100, method: "e-Transfer", date: "2026-05-01", status: "completed" as const },
  { id: "10", tenant: "Chris Martin", unit: "403", property: "Viceroy", amount: 1900, method: "e-Transfer", date: "2026-04-30", status: "failed" as const },
]

const properties = [
  { id: "all", name: "All Properties" },
  { id: "1", name: "Viceroy" },
  { id: "2", name: "Oak Street House" },
  { id: "3", name: "Maple Condo" },
]

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [copiedInstructions, setCopiedInstructions] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.tenant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProperty = propertyFilter === "all" || payment.property === properties.find(p => p.id === propertyFilter)?.name
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesProperty && matchesStatus
  })

  const totalExpected = 21300
  const totalCollected = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const avgDaysToPay = 2.3

  const handleCopyInstructions = () => {
    const instructions = `Send e-Transfer to: payments@email.com\nAmount: $2,800.00\nMessage: Rent - 456 Oak St`
    navigator.clipboard.writeText(instructions)
    setCopiedInstructions(true)
    setTimeout(() => setCopiedInstructions(false), 2000)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-navy">Payments</h1>
        <Button
          onClick={() => setShowRecordModal(true)}
          className="bg-teal hover:bg-teal-dark text-white"
          disabled
        >
          Record Payment
          <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">Essential</span>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This Month Expected"
          value={formatCurrency(totalExpected)}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(totalCollected)}
          className="[&_p:last-of-type]:text-success"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(totalPending)}
          className="[&_p:last-of-type]:text-warning"
        />
        <StatCard
          label="Avg. Days to Pay"
          value={avgDaysToPay}
          sublabel="days after due date"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="border-sage/50 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-navy">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sage)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "var(--navy)" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid var(--sage)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="expected" name="Expected" fill="var(--sage)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="var(--teal)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* e-Transfer Instructions */}
      <Card className="border-sage/50 mb-6 bg-cream/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-navy mb-1">How tenants pay rent</h3>
              <p className="text-sm text-text-muted mb-3">
                Share these instructions with your tenants for e-Transfer payments.
              </p>
              <div className="bg-white rounded-lg p-4 border border-sage/30">
                <div className="space-y-2 text-sm">
                  <p><span className="text-text-muted">Send e-Transfer to:</span> <span className="text-navy font-medium">payments@email.com</span></p>
                  <p><span className="text-text-muted">Amount:</span> <span className="text-navy font-medium">$2,800.00</span></p>
                  <p><span className="text-text-muted">Message:</span> <span className="text-navy font-medium">Rent - 456 Oak St</span></p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleCopyInstructions}
                  className="border-navy/20 text-navy hover:bg-navy/5"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedInstructions ? "Copied!" : "Copy Instructions"}
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="border-navy/20 text-navy opacity-70"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                  <Lock className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="border-sage/50 mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search tenant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-sage"
              />
            </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 border-sage">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-sage/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-navy">{payment.tenant}</TableCell>
                  <TableCell>{payment.unit}</TableCell>
                  <TableCell>{payment.property}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-navy hover:bg-navy/5"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Modal (placeholder - Essential feature) */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Lock className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">This feature is available with the Essential plan.</p>
            <Button className="mt-4 bg-teal hover:bg-teal-dark text-white">
              Upgrade to Essential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
