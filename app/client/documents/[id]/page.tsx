"use client"

import { useEffect } from "react"

import { useState } from "react"

import { use } from "react"
import { ClientShell } from "@/components/client/client-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Share2,
  Printer,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocument()
  }, [resolvedParams.id])

  const loadDocument = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        router.push("/login")
        return
      }

      console.log("[v0] Fetching document:", resolvedParams.id)

      const response = await fetch(`/api/documents/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch document")
      }

      const result = await response.json()
      console.log("[v0] Document loaded:", result)

      const doc = result.data || result
      setDocument(doc)

      // Fetch company details
      if (doc.companyId) {
        const compResponse = await fetch(`/api/companies/${doc.companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (compResponse.ok) {
          const compResult = await compResponse.json()
          setCompany(compResult.data || compResult)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading document:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "downloaded":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "downloaded":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#ff0d13] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading document...</p>
          </div>
        </div>
      </ClientShell>
    )
  }

  if (!document) {
    return (
      <ClientShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Document Not Found</h2>
            <p className="text-slate-600 mb-4">The document you're looking for doesn't exist.</p>
            <Button
              onClick={() => router.push("/client/documents")}
              className="bg-gradient-to-r from-[#880000] to-[#ff0d13]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
          </div>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/client/documents")}
              className="h-10 w-10 p-0 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Document Details</h1>
              <p className="text-slate-600 text-sm sm:text-base">{document.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" className="h-10 gap-2 bg-transparent">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button className="h-10 gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Preview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[8.5/11] bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 mb-2">PDF Document Preview</p>
                    <p className="text-xs text-slate-500">Click download to view the full document</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Document Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Document Type</p>
                      <p className="text-sm font-medium text-slate-900">{document.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Category</p>
                      <p className="text-sm font-medium text-slate-900 capitalize">{document.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Company</p>
                      <p className="text-sm font-medium text-slate-900">{company?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">State</p>
                      <p className="text-sm font-medium text-slate-900">{company?.state || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Upload Date</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">File Size</p>
                      <p className="text-sm font-medium text-slate-900">{document.size || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Document Status</p>
                  <Badge className={`${getStatusColor(document.status)} text-sm`}>
                    {getStatusIcon(document.status)}
                    <span className="ml-1 capitalize">{document.status}</span>
                  </Badge>
                </div>
                {document.status === "ready" && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-xs text-emerald-700">
                      This document is ready to download and use for your business needs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Details */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Format</span>
                  <span className="text-sm font-medium text-slate-900">PDF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Size</span>
                  <span className="text-sm font-medium text-slate-900">{document.size || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Uploaded By</span>
                  <span className="text-sm font-medium text-slate-900 capitalize">{document.uploadedBy}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full h-10 justify-start gap-2 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90">
                  <Download className="w-4 h-4" />
                  Download Document
                </Button>
                <Button variant="outline" className="w-full h-10 justify-start gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                  Share Document
                </Button>
                <Button variant="outline" className="w-full h-10 justify-start gap-2 bg-transparent">
                  <Printer className="w-4 h-4" />
                  Print Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
