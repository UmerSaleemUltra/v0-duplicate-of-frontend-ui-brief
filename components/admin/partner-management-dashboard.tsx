// Admin Partner Management Dashboard

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react"

interface Partner {
  id: string
  name: string
  domain: string
  status: "active" | "suspended"
  apiKeys: Array<{
    id: string
    name: string
    key: string
    createdAt: string
    lastUsedAt?: string
  }>
  webhookUrl?: string
  createdAt: string
}

export function PartnerManagementDashboard() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<any>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState("")
  const [newPartnerDomain, setNewPartnerDomain] = useState("")

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await fetch("/api/admin/partners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPartners(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPartner = async () => {
    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          name: newPartnerName,
          domain: newPartnerDomain,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPartners([...partners, data.data])
        setShowCreateDialog(false)
        setNewPartnerName("")
        setNewPartnerDomain("")
      }
    } catch (error) {
      console.error("Failed to create partner:", error)
    }
  }

  const generateApiKey = async () => {
    if (!selectedPartner || !newKeyName) return

    try {
      const response = await fetch("/api/partners/keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          partnerId: selectedPartner.id,
          keyName: newKeyName,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedKey(data.data)
        // Refresh partners to update key list
        fetchPartners()
      }
    } catch (error) {
      console.error("Failed to generate API key:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const revokeApiKey = async (partnerId: string, keyId: string) => {
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/keys/${keyId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (response.ok) {
        fetchPartners()
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12">Loading partners...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">White-Label Partners</h2>
          <p className="text-sm text-slate-600 mt-1">Manage partner integrations and API keys</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {partners.map((partner) => (
          <Card key={partner.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <CardDescription className="mt-1">{partner.domain}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    partner.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {partner.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* API Keys Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">API Keys</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPartner(partner)
                      setShowKeyDialog(true)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Key
                  </Button>
                </div>

                <div className="space-y-2">
                  {partner.apiKeys && partner.apiKeys.length > 0 ? (
                    partner.apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{key.name}</p>
                          <p className="text-slate-500 font-mono">
                            {key.key.substring(0, 10)}...{key.key.substring(key.key.length - 4)}
                          </p>
                        </div>
                        <button
                          onClick={() => revokeApiKey(partner.id, key.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No API keys yet</p>
                  )}
                </div>
              </div>

              {/* Webhook URL */}
              {partner.webhookUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Webhook URL</p>
                  <p className="text-xs text-slate-600 font-mono break-all">{partner.webhookUrl}</p>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Created {new Date(partner.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Partner Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Partner</DialogTitle>
            <DialogDescription>Create a new white-label partner account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Partner Name</label>
              <Input
                placeholder="e.g., Acme Corp"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Domain</label>
              <Input
                placeholder="e.g., partner.acmecorp.com"
                value={newPartnerDomain}
                onChange={(e) => setNewPartnerDomain(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button onClick={createPartner} className="w-full">
              Create Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate API Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>

          {!generatedKey ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Key Name</label>
                <Input
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={generateApiKey} className="w-full">
                Generate Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Save these credentials securely. You won&apos;t be able to view the secret again.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">API Key</label>
                <div className="flex items-center gap-2 mt-1 p-2 bg-white rounded border">
                  <code className="text-xs font-mono flex-1 truncate">{generatedKey.key}</code>
                  <button
                    onClick={() => copyToClipboard(generatedKey.key)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Secret</label>
                <div className="flex items-center gap-2 mt-1 p-2 bg-white rounded border">
                  <code className="text-xs font-mono flex-1 truncate">
                    {showSecret ? generatedKey.secret : "•".repeat(32)}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedKey.secret)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                onClick={() => {
                  setGeneratedKey(null)
                  setNewKeyName("")
                  setShowKeyDialog(false)
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
