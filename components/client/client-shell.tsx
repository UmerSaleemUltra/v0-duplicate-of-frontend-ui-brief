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
  const [showHamburger, setShowHamburger] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isPageReady, setIsPageReady] = useState(false)

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
        console.log("[v0] Sidebar: No token found")
        return
      }

      try {
        const currentUser = authService.getCurrentUser()
        let userId = currentUser?.id

        if (!userId && typeof window !== "undefined") {
          const storedUserId = localStorage.getItem("user_id")
          const storedUserData = localStorage.getItem("user_data")

          if (storedUserId) {
            userId = storedUserId
            console.log("[v0] Sidebar: Retrieved userId from localStorage:", userId)
          } else if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData)
              userId = userData.id
              console.log("[v0] Sidebar: Retrieved userId from stored user data:", userId)
            } catch (e) {
              console.error("[v0] Sidebar: Error parsing stored user data:", e)
            }
          }

          // Try to decode token as last resort
          if (!userId && token) {
            try {
              const tokenParts = token.split(".")
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]))
                userId = payload.userId || payload.id
                console.log("[v0] Sidebar: Retrieved userId from token:", userId)
              }
            } catch (e) {
              console.error("[v0] Sidebar: Error decoding token:", e)
            }
          }
        }

        if (!userId) {
          console.error("[v0] Sidebar: CRITICAL - No userId found!")
          console.log("[v0] Sidebar: currentUser:", currentUser)
          console.log("[v0] Sidebar: localStorage user_id:", localStorage.getItem("user_id"))
          return
        }

        console.log("[v0] Sidebar: Loading companies for userId:", userId)

        const cacheBuster = `?t=${Date.now()}`
        const response = await fetch(`/api/companies${cacheBuster}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }).then((res) => res.json())

        const allCompaniesData = response.data || response.companies || []

        console.log("[v0] Sidebar: Total companies fetched:", allCompaniesData.length)
        console.log(
          "[v0] Sidebar: All companies details:",
          allCompaniesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            userId: c.userId,
            userIdType: typeof c.userId,
            createdAt: c.createdAt,
          })),
        )

        console.log("[v0] Sidebar: Current userId for filtering:", userId, "Type:", typeof userId)

        const userCompanies = allCompaniesData.filter((c: any) => {
          const companyUserId = String(c.userId).trim()
          const currentUserId = String(userId).trim()
          const match = companyUserId === currentUserId

          console.log("[v0] Sidebar: Comparing company:", {
            companyName: c.name,
            companyUserId,
            currentUserId,
            match,
          })

          return match
        })

        console.log("[v0] Sidebar: User's companies after filtering:", userCompanies.length)
        console.log(
          "[v0] Sidebar: Filtered company names:",
          userCompanies.map((c: any) => c.name),
        )

        setAllCompanies(userCompanies)

        if (!selectedCompanyId && userCompanies.length > 0) {
          console.log("[v0] Sidebar: Auto-selecting first company:", userCompanies[0].id)
          setSelectedCompanyId(userCompanies[0].id)
        } else if (userCompanies.length === 0) {
          console.log("[v0] Sidebar: User has no companies")
          setSelectedCompanyId(null)
        }
      } catch (error) {
        console.error("[v0] Sidebar: Error loading companies:", error)
      }
    }

    loadCompanies()

    const handleRefresh = () => {
      console.log("[v0] Sidebar: Refresh event triggered, reloading companies")
      loadCompanies()
    }

    window.addEventListener("client-dashboard-refresh", handleRefresh)

    return () => {
      window.removeEventListener("client-dashboard-refresh", handleRefresh)
    }
  }, [selectedCompanyId, setSelectedCompanyId])

  useEffect(() => {
    const handleFocus = () => {
      // Auto-refresh when user returns to the tab
      if (document.visibilityState === "visible") {
        console.log("[v0] Tab focused, auto-refreshing data")
        // Trigger a custom event that child components can listen to
        window.dispatchEvent(new Event("client-dashboard-refresh"))
      }
    }

    document.addEventListener("visibilitychange", handleFocus)
    return () => document.removeEventListener("visibilitychange", handleFocus)
  }, [])

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          if (currentScrollY < 50) {
            setShowHamburger(true)
          } else {
            // Hide hamburger when scrolled down past 50px
            setShowHamburger(false)
          }

          setLastScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true)
    }, 500)

    return () => clearTimeout(timer)
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

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={`
          w-64 sm:w-72 lg:w-64 fixed lg:sticky left-0 top-0 h-screen z-40
          bg-gradient-to-r from-[#880000] to-[#ff0d13]
          text-white 
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
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
          <div className="px-4 py-3 bg-yellow-500/20 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-white">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-medium">Admin View Mode</span>
            </div>
            <p className="text-[10px] text-white/80 mt-1">Viewing as: {userName}</p>
          </div>
        )}

        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group backdrop-blur-sm min-h-[44px]"
            aria-label="Select company"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-r from-[#880000] to-[#ff0d13] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left overflow-hidden">
                <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-0.5 truncate">Current Company</p>
                <BusinessNameDisplay
                  name={selectedCompany?.name || "No company"}
                  maxLength={18}
                  className="text-xs sm:text-sm font-semibold text-white truncate"
                  truncateMode="smart"
                />
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
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

            <button
              onClick={handleLogout}
              className="lg:hidden w-full mt-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium min-h-[44px] bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 shadow-lg backdrop-blur-sm flex items-center justify-center gap-2.5"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{isAdminView ? "Exit Admin Mode" : "Sign Out"}</span>
            </button>
          </nav>

          <div className="hidden lg:block p-3 border-t border-white/10 flex-shrink-0 bg-gradient-to-b from-transparent to-black/5">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white h-11 transition-all duration-200 text-sm font-normal"
            >
              <LogOut className="w-5 h-5 mr-2.5 flex-shrink-0" />
              {isAdminView ? "Exit Admin Mode" : "Sign Out"}
            </Button>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2.5 sm:p-3 bg-gradient-to-r from-[#880000] to-[#ff0d13] text-white hover:opacity-90 rounded-lg shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-300 ${
          showHamburger && isPageReady && !sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
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
        <div className="z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                setIsRefreshing(true)
                console.log("[v0] Manual refresh triggered")
                window.dispatchEvent(new Event("client-dashboard-refresh"))
                setTimeout(() => {
                  setIsRefreshing(false)
                }, 1500)
              }}
              disabled={isRefreshing}
              className="h-10 w-10"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {pathname.includes("/client/dashboard") && <NotificationDropdown />}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
              aria-label={isAdminView ? "Exit admin mode" : "Logout"}
              title={isAdminView ? "Exit Admin Mode" : "Logout"}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full bg-white">{children}</main>
      </div>
    </div>
  )
}
