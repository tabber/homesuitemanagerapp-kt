"use client"

import { useState } from "react"
import { Building2, Mail, Bell, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AdminSettings() {
  const [platform, setPlatform] = useState({
    name: "HomeSuite",
    adminEmail: "admin@homesuite.ca",
    supportEmail: "support@homesuite.ca",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    maintenanceAlerts: true,
    paymentAlerts: true,
  })

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
        <h1 className="text-2xl font-medium text-navy">Admin Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Platform configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Information */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Platform Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={platform.name}
                onChange={(e) =>
                  setPlatform({ ...platform, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={platform.adminEmail}
                onChange={(e) =>
                  setPlatform({ ...platform, adminEmail: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={platform.supportEmail}
                onChange={(e) =>
                  setPlatform({ ...platform, supportEmail: e.target.value })
                }
              />
            </div>
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
                <p className="text-sm font-medium text-navy">
                  Email Notifications
                </p>
                <p className="text-xs text-text-muted">
                  Receive important platform updates
                </p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Maintenance Alerts</p>
                <p className="text-xs text-text-muted">
                  Get notified of system maintenance
                </p>
              </div>
              <Switch
                checked={notifications.maintenanceAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, maintenanceAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Payment Alerts</p>
                <p className="text-xs text-text-muted">
                  Failed payments and billing issues
                </p>
              </div>
              <Switch
                checked={notifications.paymentAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, paymentAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card className="border-sage/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-cream rounded-lg p-6">
              <h3 className="text-lg font-medium text-navy mb-4">
                Essential Plan Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-lg border border-sage/30">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                    Base Price
                  </p>
                  <p className="text-2xl font-medium text-navy">
                    {formatCurrency(79.99)}
                    <span className="text-sm text-text-muted font-normal">
                      /month
                    </span>
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    Includes 1 property
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-sage/30">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                    Per Additional Property
                  </p>
                  <p className="text-2xl font-medium text-navy">
                    {formatCurrency(15)}
                    <span className="text-sm text-text-muted font-normal">
                      /month
                    </span>
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    Up to 15 properties max
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-sage/30">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                    Maximum Price
                  </p>
                  <p className="text-2xl font-medium text-navy">
                    {formatCurrency(289.99)}
                    <span className="text-sm text-text-muted font-normal">
                      /month
                    </span>
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    15 properties included
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-teal/5 rounded-lg border border-teal/20">
                <p className="text-sm text-navy">
                  <strong>7-Day Free Trial:</strong> All new landlords get a
                  7-day free trial with access to all features. Trial includes 1
                  property and 1 lease.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
