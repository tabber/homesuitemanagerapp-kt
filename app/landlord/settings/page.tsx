"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

const CONTRACTOR_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Pest & Rodent",
  "Structural",
  "Appliance",
  "Landscaping",
  "Cleaning",
  "Locksmith",
  "General Handyman",
  "Other",
]

interface Contractor {
  id: string
  name: string
  category: string
  phone: string
  email: string
  website: string
  notes: string
  preferred: boolean
}

const initialContractors: Contractor[] = [
  { id: "1", name: "Joe's Plumbing", category: "Plumbing", phone: "(604) 555-0101", email: "joe@joesplumbing.com", website: "", notes: "Available 24/7 for emergencies", preferred: true },
  { id: "2", name: "Cool Air HVAC Services", category: "HVAC", phone: "(604) 555-0201", email: "service@coolair.ca", website: "coolair.ca", notes: "", preferred: true },
  { id: "3", name: "Bright Spark Electric", category: "Electrical", phone: "(604) 555-0301", email: "", website: "", notes: "", preferred: false },
  { id: "4", name: "Appliance Pros", category: "Appliance", phone: "(604) 555-0401", email: "info@appliancepros.ca", website: "", notes: "Good rates for multiple units", preferred: true },
  { id: "5", name: "Handy Dan's Services", category: "General Handyman", phone: "(604) 555-0501", email: "", website: "", notes: "", preferred: false },
]

export default function SettingsPage() {
  const router = useRouter()
  
  // Account Information
  const [accountForm, setAccountForm] = useState({
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(604) 555-1234",
    company: "Smith Properties",
  })

  // Payment Settings
  const [paymentForm, setPaymentForm] = useState({
    eTransferEmail: "payments@smithproperties.com",
    eTransferMessage: "Rent - {property_address}",
  })

  // Contractors
  const [contractors, setContractors] = useState<Contractor[]>(initialContractors)
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null)
  const [contractorForm, setContractorForm] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
    preferred: false,
  })

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    maintenanceAlerts: true,
    rentReceived: true,
    leaseExpiry: true,
  })

  // Security
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Danger Zone
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Group contractors by category
  const contractorsByCategory = contractors.reduce((acc, contractor) => {
    if (!acc[contractor.category]) {
      acc[contractor.category] = []
    }
    acc[contractor.category].push(contractor)
    return acc
  }, {} as Record<string, Contractor[]>)

  const handleAddContractor = () => {
    setEditingContractor(null)
    setContractorForm({
      name: "",
      category: "",
      phone: "",
      email: "",
      website: "",
      notes: "",
      preferred: false,
    })
    setShowContractorModal(true)
  }

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor)
    setContractorForm({
      name: contractor.name,
      category: contractor.category,
      phone: contractor.phone,
      email: contractor.email,
      website: contractor.website,
      notes: contractor.notes,
      preferred: contractor.preferred,
    })
    setShowContractorModal(true)
  }

  const handleSaveContractor = () => {
    if (editingContractor) {
      setContractors(contractors.map(c => 
        c.id === editingContractor.id 
          ? { ...c, ...contractorForm }
          : c
      ))
    } else {
      setContractors([...contractors, { 
        id: String(Date.now()), 
        ...contractorForm 
      }])
    }
    setShowContractorModal(false)
  }

  const handleDeleteContractor = (id: string) => {
    setContractors(contractors.filter(c => c.id !== id))
  }

  const handleTogglePreferred = (id: string) => {
    setContractors(contractors.map(c =>
      c.id === id ? { ...c, preferred: !c.preferred } : c
    ))
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-medium text-navy mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-navy">First Name</Label>
                <Input
                  id="firstName"
                  value={accountForm.firstName}
                  onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                  className="mt-1.5 border-sage"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-navy">Last Name</Label>
                <Input
                  id="lastName"
                  value={accountForm.lastName}
                  onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                  className="mt-1.5 border-sage"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-navy">Email</Label>
              <Input
                id="email"
                type="email"
                value={accountForm.email}
                disabled
                className="mt-1.5 border-sage bg-sage/10"
              />
              <p className="text-xs text-text-muted mt-1">Contact support to change your email address.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-navy">Phone</Label>
                <Input
                  id="phone"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  className="mt-1.5 border-sage"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-navy">Company (Optional)</Label>
                <Input
                  id="company"
                  value={accountForm.company}
                  onChange={(e) => setAccountForm({ ...accountForm, company: e.target.value })}
                  className="mt-1.5 border-sage"
                />
              </div>
            </div>
            <Button className="bg-teal hover:bg-teal-dark text-white">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="eTransferEmail" className="text-navy">Default e-Transfer Email</Label>
              <Input
                id="eTransferEmail"
                type="email"
                value={paymentForm.eTransferEmail}
                onChange={(e) => setPaymentForm({ ...paymentForm, eTransferEmail: e.target.value })}
                className="mt-1.5 border-sage"
              />
              <p className="text-xs text-text-muted mt-1">This will be used as the default e-Transfer email for new leases.</p>
            </div>
            <div>
              <Label htmlFor="eTransferMessage" className="text-navy">Default e-Transfer Message Template</Label>
              <Input
                id="eTransferMessage"
                value={paymentForm.eTransferMessage}
                onChange={(e) => setPaymentForm({ ...paymentForm, eTransferMessage: e.target.value })}
                className="mt-1.5 border-sage"
              />
              <p className="text-xs text-text-muted mt-1">Use {"{property_address}"} as a placeholder for the property address.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-sage/10 rounded-lg">
              <div>
                <p className="font-medium text-navy">Autopay Setup</p>
                <p className="text-sm text-text-muted">Automatically process rent payments</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">Coming Soon</Badge>
            </div>
            <Button className="bg-teal hover:bg-teal-dark text-white">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferred Contractors */}
        <Card className="border-sage/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-navy">Preferred Contractors</CardTitle>
              <Button onClick={handleAddContractor} className="bg-teal hover:bg-teal-dark text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(contractorsByCategory).length === 0 ? (
              <p className="text-text-muted text-center py-8">No contractors added yet. Add your first contractor to get started.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(contractorsByCategory).map(([category, categoryContractors]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-text-muted mb-3">{category}</h4>
                    <div className="space-y-2">
                      {categoryContractors.map((contractor) => (
                        <div
                          key={contractor.id}
                          className="flex items-center justify-between p-4 bg-sage/10 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleTogglePreferred(contractor.id)}
                              className={cn(
                                "p-1 rounded transition-colors",
                                contractor.preferred ? "text-warning" : "text-text-muted hover:text-warning"
                              )}
                            >
                              <Star className={cn("h-4 w-4", contractor.preferred && "fill-current")} />
                            </button>
                            <div>
                              <p className="font-medium text-navy">{contractor.name}</p>
                              <p className="text-sm text-text-muted">{contractor.phone}</p>
                              {contractor.email && (
                                <p className="text-sm text-text-muted">{contractor.email}</p>
                              )}
                              {contractor.notes && (
                                <p className="text-xs text-text-muted mt-1">{contractor.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContractor(contractor)}
                              className="text-navy hover:bg-navy/5"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContractor(contractor.id)}
                              className="text-destructive hover:bg-destructive/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-sage/10 rounded-lg">
                <p className="text-sm text-text-muted">Current Plan</p>
                <p className="text-xl font-medium text-navy">Trial</p>
                <p className="text-sm text-warning">12 days remaining</p>
              </div>
              <div className="p-4 bg-sage/10 rounded-lg">
                <p className="text-sm text-text-muted">Properties</p>
                <p className="text-xl font-medium text-navy">3 of 15</p>
                <p className="text-sm text-text-muted">maximum</p>
              </div>
            </div>
            <div className="p-4 bg-sage/10 rounded-lg">
              <p className="text-sm text-text-muted">Monthly Cost</p>
              <p className="text-xl font-medium text-navy">$0.00</p>
              <p className="text-sm text-text-muted">$49.99/mo after trial</p>
            </div>
            <Button 
              onClick={() => router.push("/pricing")}
              className="bg-teal hover:bg-teal-dark text-white"
            >
              Upgrade / Change Plan
            </Button>
            <div className="border-t border-sage/30 pt-4 mt-4">
              <p className="text-sm font-medium text-navy mb-2">Billing History</p>
              <p className="text-sm text-text-muted">No billing history yet.</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">Email Notifications</p>
                <p className="text-sm text-text-muted">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">Maintenance Alerts</p>
                <p className="text-sm text-text-muted">Get notified of new maintenance requests</p>
              </div>
              <Switch
                checked={notifications.maintenanceAlerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">Rent Received</p>
                <p className="text-sm text-text-muted">Get notified when rent payments are received</p>
              </div>
              <Switch
                checked={notifications.rentReceived}
                onCheckedChange={(checked) => setNotifications({ ...notifications, rentReceived: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy">Lease Expiry Reminders</p>
                <p className="text-sm text-text-muted">Receive reminders before leases expire</p>
              </div>
              <Switch
                checked={notifications.leaseExpiry}
                onCheckedChange={(checked) => setNotifications({ ...notifications, leaseExpiry: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-sage/10 rounded-lg">
              <div>
                <p className="font-medium text-navy">SMS Notifications</p>
                <p className="text-sm text-text-muted">Receive text message alerts</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-navy">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-navy">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={securityForm.newPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-navy">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={securityForm.confirmPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                className="mt-1.5 border-sage"
              />
            </div>
            <Button className="bg-teal hover:bg-teal-dark text-white">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium text-navy">Cancel Subscription</p>
                <p className="text-sm text-text-muted">Your data will be retained for 30 days</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="border-destructive text-destructive hover:bg-destructive/5"
              >
                Cancel Subscription
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium text-navy">Delete Account</p>
                <p className="text-sm text-text-muted">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Contractor Modal */}
      <Dialog open={showContractorModal} onOpenChange={setShowContractorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">
              {editingContractor ? "Edit Contractor" : "Add Contractor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contractorName" className="text-navy">Name *</Label>
              <Input
                id="contractorName"
                value={contractorForm.name}
                onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                placeholder="Contractor name"
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="contractorCategory" className="text-navy">Category *</Label>
              <Select
                value={contractorForm.category}
                onValueChange={(value) => setContractorForm({ ...contractorForm, category: value })}
              >
                <SelectTrigger className="mt-1.5 border-sage">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contractorPhone" className="text-navy">Phone *</Label>
              <Input
                id="contractorPhone"
                value={contractorForm.phone}
                onChange={(e) => setContractorForm({ ...contractorForm, phone: e.target.value })}
                placeholder="(604) 555-1234"
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="contractorEmail" className="text-navy">Email</Label>
              <Input
                id="contractorEmail"
                type="email"
                value={contractorForm.email}
                onChange={(e) => setContractorForm({ ...contractorForm, email: e.target.value })}
                placeholder="contractor@email.com"
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="contractorWebsite" className="text-navy">Website</Label>
              <Input
                id="contractorWebsite"
                value={contractorForm.website}
                onChange={(e) => setContractorForm({ ...contractorForm, website: e.target.value })}
                placeholder="www.example.com"
                className="mt-1.5 border-sage"
              />
            </div>
            <div>
              <Label htmlFor="contractorNotes" className="text-navy">Notes</Label>
              <Textarea
                id="contractorNotes"
                value={contractorForm.notes}
                onChange={(e) => setContractorForm({ ...contractorForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="mt-1.5 border-sage min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={contractorForm.preferred}
                onCheckedChange={(checked) => setContractorForm({ ...contractorForm, preferred: checked })}
              />
              <Label className="text-navy">Mark as Preferred</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractorModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContractor}
              className="bg-teal hover:bg-teal-dark text-white"
              disabled={!contractorForm.name || !contractorForm.category || !contractorForm.phone}
            >
              {editingContractor ? "Save Changes" : "Add Contractor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? Your data will be retained for 30 days, after which it will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
