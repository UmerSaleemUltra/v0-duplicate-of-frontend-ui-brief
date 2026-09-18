"use client"

import { useState, useEffect } from "react"
import { User, Lock, Info, Calendar, Hash, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ClientShell } from "@/components/client/client-shell"
import { currentUserStorage, userStorage } from "@/lib/local-storage"
import { useAuthGuard } from "@/lib/use-auth-guard"
import { Spinner } from "@/components/ui/spinner"

export default function ClientSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const user = currentUserStorage.get()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const user = currentUserStorage.get()
      if (!user) {
        toast({
          title: "Error",
          description: "User not found. Please log in again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!user.password) {
        toast({
          title: "Error",
          description: "No password set for this account. Please contact support.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (user.password !== passwordData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const updatedUser = await userStorage.update(user.id, { password: passwordData.newPassword })

      if (updatedUser) {
        currentUserStorage.set(updatedUser)
        setCurrentUser(updatedUser)

        toast({
          title: "Success",
          description: "Your password has been changed successfully",
        })

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        throw new Error("Failed to update password")
      }
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <ClientShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
              <p className="text-sm text-slate-600">Your personal details</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </Label>
              <Input
                id="name"
                value={currentUser?.name || ""}
                readOnly
                className="h-10 bg-slate-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={currentUser?.email || ""}
                readOnly
                className="h-10 bg-slate-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={currentUser?.phone || ""}
                readOnly
                className="h-10 bg-slate-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="h-10"
              />
            </div>

            <Button onClick={handleChangePassword} disabled={isLoading} className="h-10">
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Account Information</h2>
              <p className="text-sm text-slate-600">View your account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Account Status</span>
              </div>
              <span className="text-sm font-semibold text-green-600">Active</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Member Since</span>
              </div>
              <span className="text-sm text-slate-600">
                {currentUser?.createdAt ? formatMemberSince(currentUser.createdAt) : "January 15, 2024"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Account ID</span>
              </div>
              <span className="text-sm text-slate-600 font-mono">{currentUser?.id || "USR-2024-001234"}</span>
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
