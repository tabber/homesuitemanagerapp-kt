"use client"

import { useState, useEffect } from "react"
import { Mail } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface LandlordRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: string | null
  subscription_status: string | null
  propertyCount: number
}

export default function AdminDashboard() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const [loading, setLoading] = useState(true)
  const [totalLandlords, setTotalLandlords] = useState(0)
  const [activeProperties, setActiveProperties] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [landlords, setLandlords] = useState<LandlordRow[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      const supabase = createClient()

      const { count: landlordCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "landlord")

      const { count: propertyCount } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })

      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("role", ["landlord", "tenant"])

      const { data: recentLandlords } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, created_at, subscription_status")
        .eq("role", "landlord")
        .order("created_at", { ascending: false })
        .limit(5)

      // Real property counts per recent landlord
      const ids = (recentLandlords ?? []).map((l) => l.id)
      const propsByLandlord: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("landlord_id")
          .in("landlord_id", ids)
        for (const p of props ?? []) {
          if (p.landlord_id) {
            propsByLandlord[p.landlord_id] = (propsByLandlord[p.landlord_id] ?? 0) + 1
          }
        }
      }

      if (!isMounted) return

      setTotalLandlords(landlordCount ?? 0)
      setActiveProperties(propertyCount ?? 0)
      setTotalUsers(userCount ?? 0)
      setLandlords(
        (recentLandlords ?? []).map((l) => ({
          id: l.id,
          first_name: l.first_name,
          last_name: l.last_name,
          email: l.email,
          created_at: l.created_at,
          subscription_status: l.subscription_status,
          propertyCount: propsByLandlord[l.id] ?? 0,
        }))
      )
      setLoading(false)
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const [inviting, setInviting] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail || inviting) return
    setInviting(true)
    try {
      const res = await fetch("/api/admin/invite-landlord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to send invite")
      toast.success(`Invite sent to ${inviteEmail}`)
      setShowInviteModal(false)
      setInviteEmail("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const getStatusBadgeStatus = (status: string | null) => {
    if (status === "active") return "active"
    if (status === "trial" || status === "pending") return "pending"
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
          value={loading ? "—" : totalLandlords}
          sublabel="Registered landlords"
        />
        <StatCard
          label="MRR"
          value="No data yet"
          sublabel="Requires Stripe integration"
        />
        <StatCard
          label="Active Properties"
          value={loading ? "—" : activeProperties}
          sublabel="Across all landlords"
        />
        <StatCard
          label="Total Users"
          value={loading ? "—" : totalUsers}
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
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-text-muted">
                No data yet — requires Stripe integration
              </p>
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
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-text-muted text-center">
                No data yet — requires Stripe integration
              </p>
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
          {landlords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((landlord) => {
                  const fullName = `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim()
                  const initials = `${landlord.first_name?.[0] ?? ""}${landlord.last_name?.[0] ?? ""}`
                  return (
                    <TableRow key={landlord.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-sage-light">
                            <AvatarFallback className="bg-sage-light text-navy text-xs">
                              {initials || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-navy">
                              {fullName || "No data yet"}
                            </p>
                            <p className="text-xs text-text-muted">{landlord.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getStatusBadgeStatus(landlord.subscription_status)} />
                      </TableCell>
                      <TableCell className="text-sm text-navy capitalize">
                        {landlord.subscription_status ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-navy">
                        {landlord.propertyCount}
                      </TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {formatDate(landlord.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-text-muted">No data yet</p>
          )}
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
                disabled={!inviteEmail || inviting}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No data yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No data yet"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}}

export default function AdminDashboard() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const [loading, setLoading] = useState(true)
  const [totalLandlords, setTotalLandlords] = useState(0)
  const [activeProperties, setActiveProperties] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [landlords, setLandlords] = useState<LandlordRow[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      const supabase = createClient()

      const { count: landlordCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "landlord")

      const { count: propertyCount } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })

      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("role", ["landlord", "tenant"])

      const { data: recentLandlords } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, created_at, subscription_status")
        .eq("role", "landlord")
        .order("created_at", { ascending: false })
        .limit(5)

      // Real property counts per recent landlord
      const ids = (recentLandlords ?? []).map((l) => l.id)
      const propsByLandlord: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("landlord_id")
          .in("landlord_id", ids)
        for (const p of props ?? []) {
          if (p.landlord_id) {
            propsByLandlord[p.landlord_id] = (propsByLandlord[p.landlord_id] ?? 0) + 1
          }
        }
      }

      if (!isMounted) return

      setTotalLandlords(landlordCount ?? 0)
      setActiveProperties(propertyCount ?? 0)
      setTotalUsers(userCount ?? 0)
      setLandlords(
        (recentLandlords ?? []).map((l) => ({
          id: l.id,
          first_name: l.first_name,
          last_name: l.last_name,
          email: l.email,
          created_at: l.created_at,
          subscription_status: l.subscription_status,
          propertyCount: propsByLandlord[l.id] ?? 0,
        }))
      )
      setLoading(false)
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const [inviting, setInviting] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail || inviting) return
    setInviting(true)
    try {
      const res = await fetch("/api/admin/invite-landlord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to send invite")
      toast.success(`Invite sent to ${inviteEmail}`)
      setShowInviteModal(false)
      setInviteEmail("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const getStatusBadgeStatus = (status: string | null) => {
    if (status === "active") return "active"
    if (status === "trial" || status === "pending") return "pending"
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
          value={loading ? "—" : totalLandlords}
          sublabel="Registered landlords"
        />
        <StatCard
          label="MRR"
          value="No data yet"
          sublabel="Requires Stripe integration"
        />
        <StatCard
          label="Active Properties"
          value={loading ? "—" : activeProperties}
          sublabel="Across all landlords"
        />
        <StatCard
          label="Total Users"
          value={loading ? "—" : totalUsers}
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
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-text-muted">
                No data yet — requires Stripe integration
              </p>
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
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-text-muted text-center">
                No data yet — requires Stripe integration
              </p>
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
          {landlords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((landlord) => {
                  const fullName = `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim()
                  const initials = `${landlord.first_name?.[0] ?? ""}${landlord.last_name?.[0] ?? ""}`
                  return (
                    <TableRow key={landlord.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-sage-light">
                            <AvatarFallback className="bg-sage-light text-navy text-xs">
                              {initials || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-navy">
                              {fullName || "No data yet"}
                            </p>
                            <p className="text-xs text-text-muted">{landlord.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getStatusBadgeStatus(landlord.subscription_status)} />
                      </TableCell>
                      <TableCell className="text-sm text-navy capitalize">
                        {landlord.subscription_status ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-navy">
                        {landlord.propertyCount}
                      </TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {formatDate(landlord.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-text-muted">No data yet</p>
          )}
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
                disabled={!inviteEmail || inviting}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No data yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No data yet"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}
