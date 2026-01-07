"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Mail,
  Menu,
  Bell,
  Search,
  Package,
  LogOut,
  Shield,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [userName, setUserName] = useState("Admin User")
  const [userEmail, setUserEmail] = useState("admin@buzzfiling.com")
  const [userInitials, setUserInitials] = useState("AU")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const query = searchQuery.toLowerCase().trim()

    if (/^[0-9a-f-]+$/i.test(query)) {
      router.push(`/admin/orders?search=${encodeURIComponent(query)}`)
    } else if (query.includes("@")) {
      router.push(`/admin/customers?search=${encodeURIComponent(query)}`)
    } else {
      router.push(`/admin/customers?search=${encodeURIComponent(query)}`)
    }

    setShowMobileSearch(false)
    setSearchQuery("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Image
              src="/images/buzz-filing-logo.png"
              alt="BuzzFiling Admin"
              width={240}
              height={150}
              className="w-[200px] lg:w-[240px] h-auto"
              priority
            />
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
                            isActive ? "bg-[#ff3b30] text-white" : "text-gray-700 hover:text-[#ff3b30] hover:bg-gray-50"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${
                              isActive ? "text-white" : "text-gray-400 group-hover:text-[#ff3b30]"
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

      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200 bg-white px-2 sm:px-4 shadow-sm lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-m-2.5">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-white">
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
              <Image
                src="/images/buzz-filing-logo.png"
                alt="BuzzFiling Admin"
                width={220}
                height={138}
                className="w-[200px] sm:w-[220px] h-auto"
              />
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
                          isActive ? "bg-[#ff3b30] text-white" : "text-gray-700 hover:text-[#ff3b30] hover:bg-gray-50"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-[#ff3b30]"
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

        {showMobileSearch ? (
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-x-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-gray-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 h-9 text-sm bg-white border-gray-200"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setShowMobileSearch(false)
                setSearchQuery("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <div className="flex-1 text-xs sm:text-sm font-semibold leading-6 text-gray-900 truncate">
              BuzzFiling Admin
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowMobileSearch(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-x-2">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback className="bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 hidden lg:flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-8 shadow-sm">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form onSubmit={handleSearch} className="relative flex flex-1 max-w-md">
              <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-5 text-gray-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, customers..."
                className="pl-10 bg-white border-gray-200"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
