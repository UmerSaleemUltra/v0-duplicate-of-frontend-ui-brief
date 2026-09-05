"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState } from "react"
import { Save, Mail, Bell, CreditCard, Users, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [orderNotifications, setOrderNotifications] = useState(true)
  const [paymentNotifications, setPaymentNotifications] = useState(true)

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business and system configuration</p>
      </div>

      {/* Business Information */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Business Information</h2>
            <p className="text-sm text-muted-foreground">Update your company details</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Company Name</Label>
            <Input defaultValue="FormationPro LLC" className="mt-1.5" />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" defaultValue="admin@formationpro.com" className="mt-1.5" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input type="tel" defaultValue="+1 (555) 123-4567" className="mt-1.5" />
          </div>
          <div>
            <Label>Website</Label>
            <Input defaultValue="https://formationpro.com" className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Business Address</Label>
            <Textarea defaultValue="123 Business St, Suite 100, New York, NY 10001" className="mt-1.5" />
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Email Settings */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Email Configuration</h2>
            <p className="text-sm text-muted-foreground">Configure SMTP settings for email notifications</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>SMTP Host</Label>
            <Input defaultValue="smtp.gmail.com" className="mt-1.5" />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input defaultValue="587" className="mt-1.5" />
          </div>
          <div>
            <Label>SMTP Username</Label>
            <Input defaultValue="noreply@formationpro.com" className="mt-1.5" />
          </div>
          <div>
            <Label>SMTP Password</Label>
            <Input type="password" defaultValue="••••••••" className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>From Email</Label>
            <Input defaultValue="FormationPro <noreply@formationpro.com>" className="mt-1.5" />
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save Email Settings
        </Button>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">New Order Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
            </div>
            <Switch checked={orderNotifications} onCheckedChange={setOrderNotifications} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">Payment Confirmations</p>
              <p className="text-sm text-muted-foreground">Get notified about payment updates</p>
            </div>
            <Switch checked={paymentNotifications} onCheckedChange={setPaymentNotifications} />
          </div>
        </div>
      </div>

      {/* Payment Integration */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payment Integration</h2>
            <p className="text-sm text-muted-foreground">Configure WhatsApp payment settings</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-4">
          <div>
            <Label>WhatsApp Business Number</Label>
            <Input defaultValue="+1 (555) 987-6543" className="mt-1.5" />
          </div>
          <div>
            <Label>Payment Instructions</Label>
            <Textarea defaultValue="Send payment via WhatsApp and share transaction ID" className="mt-1.5" />
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save Payment Settings
        </Button>
      </div>

      {/* Admin Users */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Admin Users</h2>
            <p className="text-sm text-muted-foreground">Manage admin access and permissions</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-3">
          {[{ name: "Admin User", email: "admin@formationpro.com", role: "Super Admin" }].map((user, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.role}</span>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full bg-transparent">
          <Users className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {/* Security */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Manage security and authentication</p>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
