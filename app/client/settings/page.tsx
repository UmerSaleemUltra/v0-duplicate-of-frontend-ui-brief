"use client"

import { useState, useEffect } from "react"
import { User, Lock, Info, Calendar, Hash, CheckCircle2, Copy, Eye, EyeOff } from "lucide-react"
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
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    setPasswordChangeSuccess(false)
    setPasswordChangeError("")

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordChangeError("Please fill in all password fields")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordChangeError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordChangeError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const token = authService.getToken()
      if (!token) {
        setPasswordChangeError("You must be logged in to change your password.")
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

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })

        setPasswordChangeSuccess(true)
      } else {
        setPasswordChangeError(result.error || "Failed to change password. Please try again.")
      }
    } catch (error) {
      setPasswordChangeError("Unable to change password. Please try again.")
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
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center cursor-pointer">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Personal Information</h2>
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
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center cursor-pointer">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleChangePassword} disabled={isLoading} className="h-10 cursor-pointer">
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Updating..." : "Update Password"}
            </Button>

            {passwordChangeSuccess && (
              <div className="flex items-center gap-2 text-green-600 mt-3 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Password changed successfully! A confirmation email has been sent.
                </span>
              </div>
            )}

            {passwordChangeError && (
              <div className="flex items-center gap-2 text-red-600 mt-3 bg-red-50 p-3 rounded-lg">
                <span className="text-sm font-medium">{passwordChangeError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 transition-all duration-200 hover:shadow-lg hover:border-primary/50">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center cursor-pointer">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Account Information</h2>
              <p className="text-sm text-slate-600">View your account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 gap-1 sm:gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-slate-400 cursor-pointer" />
                <span className="text-sm font-medium text-slate-700">Account Status</span>
              </div>
              <span className="text-sm font-semibold text-green-600 ml-8 sm:ml-3">Active</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 gap-1 sm:gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400 cursor-pointer" />
                <span className="text-sm font-medium text-slate-700">Member Since</span>
              </div>
              <span className="text-sm text-slate-600 ml-8 sm:ml-3">
                {currentUser?.createdAt ? formatMemberSince(currentUser.createdAt) : "January 15, 2024"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center py-3 gap-1 sm:gap-3">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Hash className="w-5 h-5 text-slate-400 cursor-pointer" />
                <span className="text-sm font-medium text-slate-700">Account ID</span>
              </div>
              <div className="flex items-center gap-2 ml-8 sm:ml-3">
                <span
                  className="text-sm text-slate-600 font-mono break-all sm:break-normal"
                  title={currentUser?.id || "USR-2024-001234"}
                >
                  {currentUser?.id || "USR-2024-001234"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex-shrink-0 cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser?.id || "USR-2024-001234")
                    toast({
                      title: "Copied!",
                      description: "Account ID copied to clipboard",
                    })
                  }}
                >
                  <Copy className="w-3.5 h-3.5 cursor-pointer" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
