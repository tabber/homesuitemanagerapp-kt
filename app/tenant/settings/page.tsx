"use client"

import { useState, useEffect } from "react"
import { User, Phone, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function TenantSettings() {
  const [userId, setUserId] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    relationship: "",
    phone: "",
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone")
        .eq("id", user.id)
        .maybeSingle()

      if (!isMounted) return
      setUserId(user.id)
      setProfile({
        firstName: data?.first_name ?? "",
        lastName: data?.last_name ?? "",
        email: data?.email ?? user.email ?? "",
        phone: data?.phone ?? "",
      })
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const handleProfileUpdate = async () => {
    if (!userId) {
      toast.error("You must be signed in to update your profile.")
      return
    }
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
      })
      .eq("id", userId)
    setSavingProfile(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Profile updated")
  }

  const handleEmergencyContactUpdate = () => {
    // Handle emergency contact update
  }

  const handlePasswordUpdate = () => {
    // Handle password update
    setPasswords({ current: "", new: "", confirm: "" })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your profile and preferences
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-text-muted mt-1">
                Contact your landlord to update your email
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <Button
              onClick={handleProfileUpdate}
              disabled={savingProfile}
              className="bg-teal hover:bg-teal-dark text-white"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-muted">
              Provided to landlord in case of emergency
            </p>
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={emergencyContact.name}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={emergencyContact.relationship}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    relationship: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                value={emergencyContact.phone}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    phone: e.target.value,
                  })
                }
              />
            </div>
            <Button
              onClick={handleEmergencyContactUpdate}
              className="bg-teal hover:bg-teal-dark text-white"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
              />
            </div>
            <Button
              onClick={handlePasswordUpdate}
              className="bg-teal hover:bg-teal-dark text-white"
              disabled={
                !passwords.current ||
                !passwords.new ||
                passwords.new !== passwords.confirm
              }
            >
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
