"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FileText,
  Wrench,
  Mail,
  CreditCard,
  Calendar,
  AlertTriangle,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data
const mockTenant = {
  hasPendingLease: true,
  monthlyRent: 1850,
  rentDueDay: 1,
  leaseExpires: "August 31, 2026",
  leaseExpiresInDays: 91,
  openRequests: 1,
  paymentsMade: 8,
}

const mockProperty = {
  name: "Riverside Apartments",
  address: "456 Oak Street, Unit 4B",
  city: "Toronto, ON M5V 2K1",
  status: "active" as const,
}

const mockLandlord = {
  name: "John Smith",
  email: "john.smith@email.com",
  phone: "(416) 555-0123",
  eTransferEmail: "payments@smithproperties.ca",
}

const mockRecentActivity = [
  {
    id: "1",
    type: "maintenance",
    title: "Maintenance request updated",
    description: "Kitchen faucet repair - Contractor assigned",
    date: "May 28, 2026",
    status: "in-progress" as const,
  },
  {
    id: "2",
    type: "payment",
    title: "Payment received",
    description: "May rent - $1,850.00",
    date: "May 1, 2026",
    status: "completed" as const,
  },
  {
    id: "3",
    type: "message",
    title: "New message from landlord",
    description: "Building maintenance notice",
    date: "April 28, 2026",
    status: "completed" as const,
  },
  {
    id: "4",
    type: "payment",
    title: "Payment received",
    description: "April rent - $1,850.00",
    date: "April 1, 2026",
    status: "completed" as const,
  },
  {
    id: "5",
    type: "maintenance",
    title: "Maintenance request completed",
    description: "Bathroom exhaust fan replacement",
    date: "March 15, 2026",
    status: "completed" as const,
  },
]

export default function TenantDashboard() {
  const [showETransferModal, setShowETransferModal] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">Welcome back, Sarah</h1>
        <p className="text-sm text-text-muted mt-1">
          Here&apos;s what&apos;s happening with your rental
        </p>
      </div>

      {/* Pending Lease Alert */}
      {mockTenant.hasPendingLease && (
        <div className="bg-teal/10 border border-teal/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-teal-dark" />
            <span className="text-sm text-navy">
              You have a lease waiting for your review and signature
            </span>
          </div>
          <Link href="/tenant/home">
            <Button className="bg-teal hover:bg-teal-dark text-white">
              View & Sign Lease
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Rent"
          value={formatCurrency(mockTenant.monthlyRent)}
          sublabel={`Due on the ${mockTenant.rentDueDay}${mockTenant.rentDueDay === 1 ? "st" : "th"}`}
        />
        <StatCard
          label="Lease Expires"
          value={mockTenant.leaseExpires}
          sublabel={
            mockTenant.leaseExpiresInDays < 90 ? (
              <span className="text-destructive">
                {mockTenant.leaseExpiresInDays} days remaining
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Open Requests"
          value={mockTenant.openRequests}
          sublabel="Maintenance requests"
        />
        <StatCard
          label="Payments Made"
          value={mockTenant.paymentsMade}
          sublabel="Total payments"
        />
      </div>

      {/* Property & Landlord Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Property Card */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center justify-between">
              Your Property
              <StatusBadge status={mockProperty.status} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium text-navy">{mockProperty.name}</h3>
            <div className="flex items-start gap-2 mt-2 text-sm text-text-muted">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>{mockProperty.address}</p>
                <p>{mockProperty.city}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Landlord Card */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Your Landlord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium text-navy">{mockLandlord.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-text-muted">
              <p>{mockLandlord.email}</p>
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{mockLandlord.phone}</span>
              </div>
            </div>
            <Link href="/tenant/inbox">
              <Button
                variant="outline"
                className="mt-4 border-teal text-teal hover:bg-teal/10"
              >
                <Mail className="h-4 w-4 mr-2" />
                Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setShowETransferModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">Pay Rent</span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </button>

            <Link
              href="/tenant/inbox?tab=maintenance&action=new"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">
                  Submit Maintenance Request
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>

            <Link
              href="/tenant/my-home"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">
                  View My Lease
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>

            <Link
              href="/tenant/inbox"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">
                  Message Landlord
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-cream">
              <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-teal-dark" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy">Next rent due</p>
                <p className="text-sm text-text-muted">
                  {formatCurrency(mockTenant.monthlyRent)} - June 1, 2026
                </p>
              </div>
            </div>

            {mockTenant.leaseExpiresInDays < 90 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">
                    Lease expiring soon
                  </p>
                  <p className="text-sm text-text-muted">
                    {mockTenant.leaseExpiresInDays} days remaining - Contact
                    your landlord to renew
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-cream">
              <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                <Wrench className="h-4 w-4 text-teal-dark" />
              </div>
              <div>
                <p className="text-sm font-medium text-navy">
                  Scheduled maintenance
                </p>
                <p className="text-sm text-text-muted">
                  Kitchen faucet repair - June 2, 2026 at 2:00 PM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-sage/30 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sage/30 flex items-center justify-center">
                    {activity.type === "maintenance" && (
                      <Wrench className="h-4 w-4 text-navy" />
                    )}
                    {activity.type === "payment" && (
                      <CreditCard className="h-4 w-4 text-navy" />
                    )}
                    {activity.type === "message" && (
                      <Mail className="h-4 w-4 text-navy" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-normal text-navy">
                      {activity.title}
                    </p>
                    <p className="text-sm text-text-muted">
                      {activity.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={activity.status} />
                  <span className="text-sm text-text-muted">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* e-Transfer Instructions Modal */}
      <Dialog open={showETransferModal} onOpenChange={setShowETransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">
              e-Transfer Payment Instructions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-cream rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Send to
                </p>
                <p className="text-sm font-medium text-navy">
                  {mockLandlord.eTransferEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-sm font-medium text-navy">
                  {formatCurrency(mockTenant.monthlyRent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  Message
                </p>
                <p className="text-sm font-medium text-navy">
                  Rent - {mockProperty.address}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowETransferModal(false)}
              className="w-full bg-teal hover:bg-teal-dark text-white"
            >
              I&apos;ve Sent Payment
            </Button>
            <p className="text-xs text-text-muted text-center">
              This will notify your landlord that you&apos;ve sent payment
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
