"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Mail, DollarSign, Edit, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  userStorage,
  companyStorage,
  orderStorage,
  invoiceStorage,
  documentStorage,
  type User,
  type Company,
} from "@/lib/local-storage"
import Link from "next/link"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [editingCompany, setEditingCompany] = useState<string | null>(null)
  const [companyEdits, setCompanyEdits] = useState<Partial<Company>>({})

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = () => {
    const userData = userStorage.getById(userId)
    if (!userData) {
      router.push("/admin/users")
      return
    }
    setUser(userData)
    setCompanies(companyStorage.getByUserId(userId))
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company.id)
    setCompanyEdits({
      ein: company.ein,
      itin: company.itin,
      businessId: company.businessId,
    })
  }

  const handleSaveCompany = (companyId: string) => {
    companyStorage.update(companyId, companyEdits)
    setEditingCompany(null)
    setCompanyEdits({})
    loadData()
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const userOrders = orderStorage.getByUserId(userId)
  const userInvoices = invoiceStorage.getByUserId(userId)
  const userDocuments = documentStorage.getByUserId(userId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge
                variant="outline"
                className={
                  user.status === "active" ? "bg-brand/10 text-brand border-brand/20" : "bg-muted text-muted-foreground"
                }
              >
                {user.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Companies ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {company.entityType} • {company.state}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {editingCompany === company.id ? (
                      <Button size="sm" onClick={() => handleSaveCompany(company.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEditCompany(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit IDs
                      </Button>
                    )}
                    <Link href={`/admin/customers/${company.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>

                {editingCompany === company.id ? (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>EIN</Label>
                      <Input
                        placeholder="XX-XXXXXXX"
                        value={companyEdits.ein || ""}
                        onChange={(e) => setCompanyEdits({ ...companyEdits, ein: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business ID</Label>
                      <Input
                        placeholder="BIZ-XXXXXXXX"
                        value={companyEdits.businessId || ""}
                        onChange={(e) => setCompanyEdits({ ...companyEdits, businessId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ITIN</Label>
                      <Input
                        placeholder="9XX-XX-XXXX"
                        value={companyEdits.itin || ""}
                        onChange={(e) => setCompanyEdits({ ...companyEdits, itin: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <Label className="text-muted-foreground text-xs">EIN</Label>
                      <p className="font-mono text-sm">{company.ein || "Not yet"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Business ID</Label>
                      <p className="font-mono text-sm">{company.businessId || "Not yet"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">ITIN</Label>
                      <p className="font-mono text-sm">{company.itin || "Not yet"}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userOrders.length}</div>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:underline">
              View all orders
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userInvoices.length}</div>
            <Link href="/admin/invoices" className="text-xs text-muted-foreground hover:underline">
              View all invoices
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDocuments.length}</div>
            <Link href="/admin/documents" className="text-xs text-muted-foreground hover:underline">
              View all documents
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
