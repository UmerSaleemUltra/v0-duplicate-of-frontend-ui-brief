"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  LayoutDashboard,
  Mail,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ChevronDown,
  Plus,
  Check,
  Package,
  Settings,
  FileText,
  ShieldAlert,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { BusinessNameDisplay } from "@/components/ui/business-name-display"
import { useSelectedCompany } from "@/lib/company-context"
import { authService } from "@/lib/auth"
import { ApiClient } from "@/lib/api-client"

const NAV_ITEMS = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/company", label: "Company", icon: Building2 },
  { href: "/client/documents", label: "Documents", icon: FileText },
  { href: "/client/mailroom", label: "Mailroom", icon: Mail },
  { href: "/client/addons", label: "Addons", icon: Package },
  { href: "/client/settings", label: "Settings", icon: Settings },
]

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [userInitials, setUserInitials] = useState("U")
  const [userName, setUserName] = useState("")
  const [isAdminView, setIsAdminView] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { selectedCompanyId, setSelectedCompanyId } = useSelectedCompany()
  const selectedCompany = selectedCompanyId ? allCompanies.find((c) => c.id === selectedCompanyId) : null

  useEffect(() => {
    const loadUserData = async () => {
      const impersonatingUserId = sessionStorage.getItem("impersonating_user_id")
      const impersonatingUserName = sessionStorage.getItem("impersonating_user_name")
      const adminToken = sessionStorage.getItem("admin_impersonation_token")

      if (impersonatingUserId && impersonatingUserName && adminToken) {
        setIsAdminView(true)
        setUserName(impersonatingUserName)
        const initials =
          impersonatingUserName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U"
        setUserInitials(initials)
        console.log("[v0] Admin viewing as user:", impersonatingUserName)
      } else {
        const currentUser = authService.getCurrentUser()

        if (currentUser) {
          setUserName(currentUser.name || "User")
          const initials =
            currentUser.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U"
          setUserInitials(initials)
        }
      }
    }

    loadUserData()
  }, [])

  useEffect(() => {
    const loadCompanies = async () => {
      const token = authService.getToken()
      if (!token) {
        return
      }

      try {
        const response = await ApiClient.companies.getAll(token)
        const companies = response.data || response.companies || []
        console.log("[v0] Loaded companies:", companies.length)
        setAllCompanies(companies)

        if (!selectedCompanyId && companies.length > 0) {
          setSelectedCompanyId(companies[0].id)
        }
      } catch (error) {
        console.error("[v0] Error loading companies:", error)
      }
    }

    loadCompanies()
  }, [])

  const handleSelectCompany = (company: any) => {
    console.log("[v0] Switching to company:", company.id, company.name)
    setSelectedCompanyId(company.id)
    setCompanyModalOpen(false)

    // Force refresh the page to reload data for new company
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleAddNewCompany = () => {
    setCompanyModalOpen(false)
    router.push("/checkout")
  }

  const handleExitAdminMode = () => {
    if (typeof window === "undefined") return

    const adminToken = sessionStorage.getItem("admin_impersonation_token")
    const adminData = sessionStorage.getItem("admin_impersonation_data")

    if (adminToken && adminData) {
      try {
        // Clear impersonation data
        sessionStorage.removeItem("impersonating_user_id")
        sessionStorage.removeItem("impersonating_user_name")
        sessionStorage.removeItem("impersonating_user_email")
        sessionStorage.removeItem("admin_impersonation_token")
        sessionStorage.removeItem("admin_impersonation_data")

        // Restore admin session
        const admin = JSON.parse(adminData)

        authService.setAuth(adminToken, admin)

        console.log("[v0] Exited admin impersonation mode, returning to admin dashboard")

        // Redirect to admin dashboard
        window.location.href = "/admin/users"
      } catch (error) {
        console.error("[v0] Error exiting admin mode:", error)
        // Fall back to regular logout if restoration fails
        authService.logout()
        router.push("/login")
      }
    }
  }

  const handleLogout = () => {
    if (isAdminView) {
      handleExitAdminMode()
    } else {
      authService.logout()
      router.push("/")
    }
  }

  const handleRefreshPage = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={`
          w-64 sm:w-72 lg:w-64 fixed lg:sticky left-0 top-0 h-screen z-40
          bg-gradient-to-r from-[#880000] to-[#ff0d13]
          text-white 
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col overflow-y-auto scrollbar-hide
        `}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/client/dashboard" className="flex items-center flex-1 min-w-0">
            <Image
              src="/images/buzz-filing-logo-white.png"
              alt="BuzzFiling"
              width={360}
              height={146}
              className="sm:shrink-0 sm:max-w-full w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] mr-5"
              priority
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex-shrink-0 ml-2"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {isAdminView && (
          <div className="px-4 py-3 bg-yellow-500/20 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-white">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-medium">Admin View Mode</span>
            </div>
            <p className="text-[10px] text-white/80 mt-1">Viewing as: {userName}</p>
          </div>
        )}

        <div className="px-4 py-3 border-b border-white/10">
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group backdrop-blur-sm min-h-[44px]"
            aria-label="Select company"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-0.5">Current Company</p>
                <BusinessNameDisplay
                  name={selectedCompany?.name || "No company"}
                  maxLength={18}
                  className="text-xs sm:text-sm font-semibold text-white"
                  truncateMode="smart"
                />
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium min-h-[44px]
                  ${
                    isActive
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white h-11 transition-all duration-200 text-sm"
          >
            <LogOut className="w-5 h-5 mr-2.5 flex-shrink-0" />
            {isAdminView ? "Exit Admin Mode" : "Sign Out"}
          </Button>
        </div>
      </aside>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 sm:p-3 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 rounded-lg transition-all duration-200 shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[450px] mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Select Company</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-700">
              {allCompanies.length > 0
                ? `Choose from ${allCompanies.length} company${allCompanies.length !== 1 ? "ies" : ""} or register a new one`
                : "No companies yet. Start by registering a new one"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-3 sm:mt-4">
            {allCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left hover:border-[#ff0d13]/50 hover:bg-slate-50 min-h-[60px] sm:min-h-[68px] ${
                  selectedCompany?.id === company.id ? "border-[#ff0d13] bg-red-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <BusinessNameDisplay
                        name={company.name}
                        maxLength={25}
                        className="font-semibold text-xs sm:text-sm text-slate-900 mb-1"
                        truncateMode="smart"
                      />
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-600">
                        <span className="truncate max-w-[80px] sm:max-w-none">{company.entityType}</span>
                        <span className="hidden xs:inline">•</span>
                        <span className="truncate max-w-[80px] sm:max-w-none">{company.state}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                            company.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedCompany?.id === company.id && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff0d13] flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={handleAddNewCompany}
              className="w-full p-3 sm:p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#ff0d13] hover:bg-red-50/50 transition-all duration-200 group min-h-[60px] sm:min-h-[68px]"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center transition-all duration-200 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-colors duration-200" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-[#ff0d13] transition-colors duration-200 mb-0.5">
                    Register New Company
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-600 truncate">Start a new business formation</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center text-white font-bold">
              {userInitials}
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">{userName}</span>
              {isAdminView && (
                <Badge variant="outline" className="ml-2 text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">
                  Admin View
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshPage}
              disabled={isRefreshing}
              className="relative h-10 w-10"
              title="Refresh page"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <NotificationDropdown />
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full bg-white">{children}</main>
      </div>
    </div>
  )
}
