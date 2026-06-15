

import { useState } from "react"
import {
  FileText,
  CreditCard,
  Zap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
  Download,
  Printer,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data
const mockLease = {
  propertyName: "Riverside Apartments",
  address: "456 Oak Street, Unit 4B",
  city: "Toronto, ON M5V 2K1",
  status: "active" as const,
  startDate: "September 1, 2025",
  endDate: "August 31, 2026",
  monthlyRent: 1850,
  securityDeposit: 1850,
  paymentDueDay: 1,
  utilities: ["Hydro", "Internet"],
  parking: "1 underground spot included",
  smokingPolicy: "No smoking on premises",
  petPolicy: "One small pet allowed (under 25 lbs)",
  vehicleDetails: "2022 Honda Civic - License: ABCD 123",
  additionalTenants: ["Michael Chen (spouse)"],
  additionalTerms:
    "Tenant agrees to maintain renter&apos;s insurance throughout the lease term. Landlord will provide 24-hour notice before entry except in emergencies.",
  tenantSigned: true,
  tenantSignedDate: "May 13, 2026",
  landlordSigned: true,
  landlordSignedDate: "May 13, 2026",
}

const mockLandlord = {
  name: "John Smith",
  email: "john.smith@email.com",
  phone: "(416) 555-0123",
  eTransferEmail: "payments@smithproperties.ca",
}

const mockPayments = [
  {
    id: "1",
    date: "May 1, 2026",
    amount: 1850,
    method: "e-Transfer",
    status: "completed" as const,
  },
  {
    id: "2",
    date: "April 1, 2026",
    amount: 1850,
    method: "e-Transfer",
    status: "completed" as const,
  },
  {
    id: "3",
    date: "March 1, 2026",
    amount: 1850,
    method: "e-Transfer",
    status: "completed" as const,
  },
  {
    id: "4",
    date: "February 1, 2026",
    amount: 1850,
    method: "e-Transfer",
    status: "completed" as const,
  },
  {
    id: "5",
    date: "January 1, 2026",
    amount: 1850,
    method: "e-Transfer",
    status: "completed" as const,
  },
]

const mockUtilities = {
  payThroughLandlord: [
    { name: "Water", amount: 45, dueDate: "June 15, 2026" },
    { name: "Gas", amount: 62, dueDate: "June 20, 2026" },
  ],
  payDirectly: ["Hydro (Toronto Hydro)", "Internet (Bell Canada)"],
}

export default function TenantMyHome() {
  const [showLeaseModal, setShowLeaseModal] = useState(false)
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
        <h1 className="text-2xl font-medium text-navy">My Home</h1>
        <p className="text-sm text-text-muted mt-1">
          View your lease details, payments, and utilities
        </p>
      </div>

      {/* Property Overview Card */}
      <Card className="border-sage/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-dark" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-navy">
                    {mockLease.propertyName}
                  </h2>
                  <StatusBadge status={mockLease.status} />
                </div>
                <div className="flex items-start gap-2 mt-1 text-sm text-text-muted">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p>{mockLease.address}</p>
                    <p>{mockLease.city}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-text-muted">
                  <p>
                    <span className="font-medium text-navy">Landlord:</span>{" "}
                    {mockLandlord.name}
                  </p>
                  <p>{mockLandlord.email}</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{mockLandlord.phone}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  Lease: {mockLease.startDate} - {mockLease.endDate}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLeaseModal(true)}
              className="border-sage text-navy hover:bg-sage/20"
            >
              View Lease Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="lease" className="space-y-4">
        <TabsList className="bg-white border border-sage/50">
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>

        {/* Lease Tab */}
        <TabsContent value="lease" className="space-y-4">
          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Monthly Rent"
              value={formatCurrency(mockLease.monthlyRent)}
            />
            <StatCard
              label="Security Deposit"
              value={formatCurrency(mockLease.securityDeposit)}
            />
            <StatCard
              label="Payment Due Day"
              value={`${mockLease.paymentDueDay}${mockLease.paymentDueDay === 1 ? "st" : "th"} of each month`}
            />
          </div>

          {/* Lease Details */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Utilities (Tenant Responsible)
                </p>
                <div className="flex flex-wrap gap-2">
                  {mockLease.utilities.map((utility) => (
                    <Badge
                      key={utility}
                      variant="secondary"
                      className="bg-sage/30 text-navy"
                    >
                      {utility}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Parking
                  </p>
                  <p className="text-sm text-navy">{mockLease.parking}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Smoking Policy
                  </p>
                  <p className="text-sm text-navy">{mockLease.smokingPolicy}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Pet Policy
                  </p>
                  <p className="text-sm text-navy">{mockLease.petPolicy}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Vehicle Details
                  </p>
                  <p className="text-sm text-navy">{mockLease.vehicleDetails}</p>
                </div>
              </div>

              {mockLease.additionalTenants.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Additional Tenants
                  </p>
                  <p className="text-sm text-navy">
                    {mockLease.additionalTenants.join(", ")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Additional Terms
                </p>
                <p className="text-sm text-navy">{mockLease.additionalTerms}</p>
              </div>
            </CardContent>
          </Card>

          {/* Signature Status */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Signature Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-cream">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      mockLease.tenantSigned
                        ? "bg-success/10"
                        : "bg-warning/10"
                    }`}
                  >
                    {mockLease.tenantSigned ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <FileText className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      Tenant Signature
                    </p>
                    <p className="text-sm text-text-muted">
                      {mockLease.tenantSigned
                        ? `Signed on ${mockLease.tenantSignedDate}`
                        : "Awaiting your signature"}
                    </p>
                  </div>
                </div>
                {!mockLease.tenantSigned && (
                  <Button className="bg-teal hover:bg-teal-dark text-white">
                    Sign Now
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-cream">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      mockLease.landlordSigned
                        ? "bg-success/10"
                        : "bg-warning/10"
                    }`}
                  >
                    {mockLease.landlordSigned ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <FileText className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      Landlord Signature
                    </p>
                    <p className="text-sm text-text-muted">
                      {mockLease.landlordSigned
                        ? `Signed on ${mockLease.landlordSignedDate}`
                        : "Awaiting landlord signature"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* e-Transfer Instructions */}
          <Card className="border-sage/50 bg-teal/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-3">
                    e-Transfer Payment Instructions
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-text-muted">Send to:</span>{" "}
                      <span className="font-medium text-navy">
                        {mockLandlord.eTransferEmail}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-muted">Amount:</span>{" "}
                      <span className="font-medium text-navy">
                        {formatCurrency(mockLease.monthlyRent)}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-muted">Message:</span>{" "}
                      <span className="font-medium text-navy">
                        &quot;Rent - {mockLease.address}&quot;
                      </span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowETransferModal(true)}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  I&apos;ve Sent Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-normal text-navy">
                        {payment.date}
                      </TableCell>
                      <TableCell className="text-navy">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {payment.method}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilities Tab */}
        <TabsContent value="utilities" className="space-y-4">
          {/* Pay Through Landlord */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Pay Through Landlord
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUtilities.payThroughLandlord.map((utility) => (
                  <div
                    key={utility.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-cream"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-teal-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {utility.name}
                        </p>
                        <p className="text-sm text-text-muted">
                          Due: {utility.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-navy">
                        {formatCurrency(utility.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pay Directly */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Pay Directly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUtilities.payDirectly.map((utility) => (
                  <div
                    key={utility}
                    className="flex items-center justify-between p-4 rounded-lg bg-cream"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-navy" />
                      </div>
                      <p className="text-sm font-medium text-navy">{utility}</p>
                    </div>
                    <p className="text-sm text-text-muted">
                      Contact your provider
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lease Agreement Summary Modal */}
      <Dialog open={showLeaseModal} onOpenChange={setShowLeaseModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy text-xl">
              RESIDENTIAL LEASE AGREEMENT
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-text-muted">
              Standard residential lease agreement - Ontario Residential
              Tenancies Act
            </p>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Landlord
                </p>
                <p className="text-sm font-medium text-navy">
                  {mockLandlord.name}
                </p>
                <p className="text-sm text-text-muted">{mockLandlord.email}</p>
                <p className="text-sm text-text-muted">{mockLandlord.phone}</p>
              </div>
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Tenant
                </p>
                <p className="text-sm font-medium text-navy">Sarah Chen</p>
                <p className="text-sm text-text-muted">sarah.chen@email.com</p>
              </div>
            </div>

            {/* Property */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Property
              </p>
              <p className="text-sm font-medium text-navy">
                {mockLease.address}
              </p>
              <p className="text-sm text-text-muted">{mockLease.city}</p>
            </div>

            {/* Lease Terms */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Lease Terms
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-navy">
                  {mockLease.startDate} - {mockLease.endDate}
                </span>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Monthly Rent
                </p>
                <p className="text-lg font-medium text-navy">
                  {formatCurrency(mockLease.monthlyRent)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Security Deposit
                </p>
                <p className="text-lg font-medium text-navy">
                  {formatCurrency(mockLease.securityDeposit)}
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Payment
              </p>
              <p className="text-sm text-navy">
                Due on the {mockLease.paymentDueDay}st of each month via
                e-Transfer to {mockLandlord.eTransferEmail}
              </p>
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Utilities
                </p>
                <p className="text-navy">{mockLease.utilities.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Parking
                </p>
                <p className="text-navy">{mockLease.parking}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Smoking
                </p>
                <p className="text-navy">{mockLease.smokingPolicy}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Pets
                </p>
                <p className="text-navy">{mockLease.petPolicy}</p>
              </div>
            </div>

            {/* Additional Terms */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Additional Terms
              </p>
              <p className="text-sm text-navy">{mockLease.additionalTerms}</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sage/30">
              <div className="text-center">
                <div className="h-16 border-b border-navy/30 mb-2 flex items-end justify-center pb-2">
                  {mockLease.landlordSigned && (
                    <span className="text-navy italic">John Smith</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Landlord Signature</p>
                {mockLease.landlordSignedDate && (
                  <p className="text-xs text-text-muted">
                    {mockLease.landlordSignedDate}
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-navy/30 mb-2 flex items-end justify-center pb-2">
                  {mockLease.tenantSigned && (
                    <span className="text-navy italic">Sarah Chen</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Tenant Signature</p>
                {mockLease.tenantSignedDate && (
                  <p className="text-xs text-text-muted">
                    {mockLease.tenantSignedDate}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-sage/30">
              <p className="text-xs text-text-muted text-center mb-4">
                Generated on May 13, 2026
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* e-Transfer Confirmation Modal */}
      <Dialog open={showETransferModal} onOpenChange={setShowETransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Confirm Payment Sent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              By clicking confirm, you&apos;re notifying your landlord that
              you&apos;ve sent an e-Transfer payment for your rent. Your
              landlord will confirm receipt.
            </p>
            <div className="bg-cream rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Amount</span>
                <span className="font-medium text-navy">
                  {formatCurrency(mockLease.monthlyRent)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Sent to</span>
                <span className="font-medium text-navy">
                  {mockLandlord.eTransferEmail}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowETransferModal(false)}
                className="flex-1 border-sage text-navy hover:bg-sage/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowETransferModal(false)}
                className="flex-1 bg-teal hover:bg-teal-dark text-white"
              >
                Confirm Sent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
