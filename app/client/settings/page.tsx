"use client"

import { useState, useEffect } from "react"
import { User, Lock, Info, Calendar, Hash, CheckCircle2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ClientShell } from "@/components/client/client-shell"
import { authService } from "@/lib/auth"
import { useAuthGuard } from "@/hooks/use-auth-guard" // Import useAuthGuard hook
import { Skeleton } from "@/components/ui/skeleton"

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
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          setIsLoadingUser(false)
          return
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.data || data)
        } else {
          toast({
            title: "Error",
            description: "Failed to load your profile. Please try refreshing the page.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Unable to load your profile. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUser(false)
      }
    }

    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated, toast])

  if (authLoading || isLoadingUser) {
    return (
      <ClientShell>
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </ClientShell>
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
      const token = authService.getToken()
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to change your password.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const responseData = result.data || result

        if (responseData.token && responseData.user) {
          authService.setAuth(responseData.token, {
            id: responseData.user.id,
            email: responseData.user.email,
            name: responseData.user.name,
            role: responseData.user.role,
          })
        }

        toast({
          title: "Success",
          description: "Your password has been changed successfully. Your session has been updated.",
        })

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to change password. Please try again.",
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Hash className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Account ID</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span
                  className="text-sm text-slate-600 font-mono break-all sm:truncate sm:max-w-[200px] md:max-w-[280px] lg:max-w-full"
                  title={currentUser?.id || "USR-2024-001234"}
                >
                  {currentUser?.id || "USR-2024-001234"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser?.id || "USR-2024-001234")
                    toast({
                      title: "Copied!",
                      description: "Account ID copied to clipboard",
                    })
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
