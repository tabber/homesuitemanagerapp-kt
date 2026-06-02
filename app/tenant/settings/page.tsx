"use client"

import { useState } from "react"
import { User, Phone, Bell, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

export default function TenantSettings() {
  const [profile, setProfile] = useState({
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@email.com",
    phone: "(416) 555-0456",
  })

  const [emergencyContact, setEmergencyContact] = useState({
    name: "Michael Chen",
    relationship: "Spouse",
    phone: "(416) 555-0789",
  })

  const [notifications, setNotifications] = useState({
    paymentReminders: true,
    maintenanceUpdates: true,
    messages: true,
    propertyUpdates: false,
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handleProfileUpdate = () => {
    // Handle profile update
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

        {/* Notifications */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Payment Reminders</p>
                <p className="text-xs text-text-muted">
                  Get notified before rent is due
                </p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, paymentReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">
                  Maintenance Updates
                </p>
                <p className="text-xs text-text-muted">
                  Updates on your maintenance requests
                </p>
              </div>
              <Switch
                checked={notifications.maintenanceUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({
                    ...notifications,
                    maintenanceUpdates: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Messages</p>
                <p className="text-xs text-text-muted">
                  New messages from your landlord
                </p>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, messages: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Property Updates</p>
                <p className="text-xs text-text-muted">
                  Building announcements and updates
                </p>
              </div>
              <Switch
                checked={notifications.propertyUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, propertyUpdates: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-sage/30">
              <div>
                <p className="text-sm font-medium text-navy flex items-center gap-2">
                  SMS Notifications
                  <Badge
                    variant="secondary"
                    className="bg-teal/10 text-teal-dark text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                </p>
                <p className="text-xs text-text-muted">
                  Receive notifications via text message
                </p>
              </div>
              <Switch disabled />
            </div>
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
