"use client"

import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

// Mock MRR trend data
const mrrTrendData = [
  { month: "Jun", mrr: 2450 },
  { month: "Jul", mrr: 3200 },
  { month: "Aug", mrr: 4100 },
  { month: "Sep", mrr: 5250 },
  { month: "Oct", mrr: 6800 },
  { month: "Nov", mrr: 8100 },
  { month: "Dec", mrr: 9450 },
  { month: "Jan", mrr: 11200 },
  { month: "Feb", mrr: 12800 },
  { month: "Mar", mrr: 14500 },
  { month: "Apr", mrr: 16200 },
  { month: "May", mrr: 18450 },
]

// Mock subscription by property count
const subscriptionByProperties = [
  { range: "1", count: 28 },
  { range: "2-3", count: 35 },
  { range: "4-5", count: 22 },
  { range: "6-10", count: 12 },
  { range: "11-15", count: 3 },
]

// Mock failed payments
const mockFailedPayments = [
  {
    id: "1",
    landlord: "Emily Davis",
    email: "emily.davis@email.com",
    amount: 94.99,
    failedAt: "May 28, 2026",
    reason: "Insufficient funds",
  },
  {
    id: "2",
    landlord: "Robert Taylor",
    email: "robert.taylor@email.com",
    amount: 124.99,
    failedAt: "May 27, 2026",
    reason: "Card expired",
  },
]

// Mock recent transactions
const mockTransactions = [
  {
    id: "1",
    landlord: "John Smith",
    amount: 94.99,
    type: "Subscription",
    status: "completed" as const,
    date: "May 28, 2026",
  },
  {
    id: "2",
    landlord: "Maria Garcia",
    amount: 124.99,
    type: "Subscription",
    status: "completed" as const,
    date: "May 27, 2026",
  },
  {
    id: "3",
    landlord: "Michael Brown",
    amount: 169.99,
    type: "Subscription",
    status: "completed" as const,
    date: "May 26, 2026",
  },
  {
    id: "4",
    landlord: "Lisa Anderson",
    amount: 64.99,
    type: "Subscription",
    status: "completed" as const,
    date: "May 25, 2026",
  },
  {
    id: "5",
    landlord: "James Miller",
    amount: 79.99,
    type: "Subscription",
    status: "completed" as const,
    date: "May 24, 2026",
  },
]

export default function AdminBilling() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">Billing & Revenue</h1>
        <p className="text-sm text-text-muted mt-1">
          Revenue metrics and subscription analytics
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="MRR"
          value={formatCurrency(18450)}
          trend={{ direction: "up", value: "12.4%" }}
        />
        <StatCard
          label="ARR"
          value={formatCurrency(221400)}
          sublabel="Annualized revenue"
        />
        <StatCard
          label="Active Subscriptions"
          value="72"
          sublabel="Paid accounts"
        />
        <StatCard
          label="Churn Rate"
          value="2.1%"
          sublabel="Last 30 days"
          trend={{ direction: "down", value: "0.3%" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MRR Trend */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              MRR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrTrendData}>
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
                    formatter={(value: number) => [formatCurrency(value), "MRR"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid var(--sage)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="var(--teal)"
                    strokeWidth={2}
                    dot={{ fill: "var(--teal)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions by Property Count */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Subscriptions by Property Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subscriptionByProperties}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sage)" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    label={{
                      value: "Properties",
                      position: "insideBottom",
                      offset: -5,
                      fill: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    label={{
                      value: "Landlords",
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, "Landlords"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid var(--sage)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--navy)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments */}
      {mockFailedPayments.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-destructive">
              Failed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockFailedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-destructive/5"
                >
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {payment.landlord}
                    </p>
                    <p className="text-xs text-text-muted">{payment.email}</p>
                    <p className="text-xs text-destructive mt-1">
                      {payment.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-navy">
                      {formatCurrencyFull(payment.amount)}
                    </p>
                    <p className="text-xs text-text-muted">{payment.failedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-normal text-navy">
                    {transaction.landlord}
                  </TableCell>
                  <TableCell className="text-navy">
                    {formatCurrencyFull(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {transaction.type}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={transaction.status} />
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {transaction.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
