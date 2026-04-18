"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, ShoppingCart, Users, FileText, Mail, Menu, Package, LogOut, Shield, Sun, Moon } from "lucide-react"
import { authService } from "@/lib/auth"
import { AdminNotificationDropdown } from "@/components/admin/admin-notification-dropdown"
import { useDarkMode } from "@/hooks/use-dark-mode"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Documents", href: "/admin/documents", icon: FileText },
  { name: "Mailroom", href: "/admin/mailroom", icon: Mail },
  { name: "Addons", href: "/admin/addons", icon: Package },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Security", href: "/admin/security", icon: Shield },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState("Admin User")
  const [userEmail, setUserEmail] = useState("admin@buzzfiling.com")
  const [userInitials, setUserInitials] = useState("AU")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isDark, toggle: toggleDark } = useDarkMode()

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = authService.getCurrentUser()

      if (!currentUser || currentUser.role !== "admin") {
        router.push("/auth")
        return
      }

      setIsAuthenticated(true)
      if (currentUser) {
        setUserName(currentUser.name || "Admin User")
        setUserEmail(currentUser.email || "admin@buzzfiling.com")

        const initials =
          currentUser.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "AU"
        setUserInitials(initials)
      }
      setIsLoading(false)
    }

    loadUserData()
  }, [router])

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      authService.logout()
      router.push("/login")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className={`min-h-screen bg-background${isDark ? " dark" : ""}`}>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-base font-bold tracking-tight text-foreground">
              Buzz<span className="text-[#ff3b30]">Filing</span>
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all ${
                            isActive
                              ? "bg-[#ff3b30] text-white"
                              : "text-foreground/70 hover:text-[#ff3b30] hover:bg-accent"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${
                              isActive ? "text-white" : "text-foreground/40 group-hover:text-[#ff3b30]"
                            }`}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-m-2.5">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-background">
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
              <span className="text-base font-bold tracking-tight text-foreground">
                Buzz<span className="text-[#ff3b30]">Filing</span>
              </span>
            </div>
            <nav className="flex flex-1 flex-col px-6 py-4">
              <ul role="list" className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all ${
                          isActive
                            ? "bg-[#ff3b30] text-white"
                            : "text-foreground/70 hover:text-[#ff3b30] hover:bg-accent"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            isActive ? "text-white" : "text-foreground/40 group-hover:text-[#ff3b30]"
                          }`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex-1 text-sm font-semibold leading-6 text-foreground">BuzzFiling Admin</div>

        <div className="flex items-center gap-x-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDark} title="Toggle dark mode">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <AdminNotificationDropdown />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 hidden lg:flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-8 shadow-sm">
          <div className="flex flex-1 items-center justify-end gap-x-6">
            <div className="flex items-center gap-x-4">
              <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle dark mode">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <AdminNotificationDropdown />
              <div className="h-6 w-px bg-border" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <main className="py-6 px-4 sm:px-6 lg:px-8 bg-background">{children}</main>
      </div>
    </div>
  )
}
