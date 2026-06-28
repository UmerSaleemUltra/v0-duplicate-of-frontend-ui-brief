"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bell, Package, UserCheck, Home, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function AdminUserDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      // Load user data
      const userResponse = await fetch(`/api/users/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userResponse.ok) {
        throw new Error("Failed to load user")
      }

      const userData = await userResponse.json()
      const normalizedUser = userData.data || userData
      setUser(normalizedUser)

      // Load user's companies and notifications
      const [compResponse, notifResponse] = await Promise.all([
        fetch(`/api/companies?userId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        fetch(`/api/notifications?userId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json())
      ])

      // Set first company
      const companies = compResponse.data || compResponse.companies || []
      if (companies.length > 0) {
        setCompany(companies[0])
      }

      // Set notifications
      const notifs = notifResponse.data || notifResponse.notifications || []
      setNotifications(notifs)
    } catch (error) {
      console.error("Error loading dashboard:", error)
      toast({
        title: "Error",
        description: "Failed to load user dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>
    )
  }

  const milestones = company?.milestones || {
    orderSuccessfullyProcessed: false,
    registeredAgentAssigned: false,
    businessMailingAddressIssued: false,
    companyFormationCompleted: false,
    einApplicationSubmitted: false,
    einObtained: false,
  }

  const formationMilestones = [
    { title: "Order Successfully Processed", completed: milestones.orderSuccessfullyProcessed, icon: Package },
    { title: "Registered Agent Assigned", completed: milestones.registeredAgentAssigned, icon: UserCheck },
    { title: "Business Mailing Address Issued", completed: milestones.businessMailingAddressIssued, icon: Home },
    { title: "Company Formation Completed", completed: milestones.companyFormationCompleted, icon: FileCheck },
    { title: "EIN Application Submitted", completed: milestones.einApplicationSubmitted, icon: AlertTriangle },
    { title: "EIN Obtained Successfully", completed: milestones.einObtained, icon: CheckCircle2 },
  ]

  const completedCount = formationMilestones.filter(m => m.completed).length
  const progressPercentage = (completedCount / formationMilestones.length) * 100

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.name}&apos;s Dashboard</h1>
          <p className="text-sm text-muted-foreground">Viewing user dashboard as admin</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {company && (
        <>
          {/* Company Status */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="text-lg font-semibold">{company.state}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EIN</p>
                  <p className="text-lg font-semibold">{company.ein || "Pending"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business ID</p>
                  <p className="text-lg font-semibold">{company.businessId || "Pending"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formation Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Formation Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#ff0d13] h-2 rounded-full transition-all" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{completedCount} of {formationMilestones.length} steps completed</p>

              <div className="space-y-2">
                {formationMilestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {milestone.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={milestone.completed ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                    {notif.read && <Badge variant="secondary">Read</Badge>}
                    {!notif.read && <Badge>Unread</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
