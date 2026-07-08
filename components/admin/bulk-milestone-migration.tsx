"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"

interface BulkMigrationProps {
  milestoneName: string
  milestoneTitle: string
  description?: string
}

export function BulkMilestoneMigration({
  milestoneName,
  milestoneTitle,
  description,
}: BulkMigrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleMigrate = async () => {
    if (
      !window.confirm(
        `Are you sure you want to bulk complete the "${milestoneTitle}" milestone for all existing companies?\n\nThis action cannot be undone and will not send notifications.`
      )
    ) {
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/bulk-milestone-migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestoneName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to bulk migrate milestone")
      }

      const data = await response.json()
      setResult(data)
      toast({
        title: "Success",
        description: `Updated ${data.modifiedCount} companies with "${milestoneTitle}" milestone`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Milestone Migration</CardTitle>
        <CardDescription>
          One-time migration: Complete "{milestoneTitle}" for all existing companies without
          notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✓ Successfully updated {result.modifiedCount} companies on{" "}
              {new Date(result.timestamp).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleMigrate}
            disabled={isLoading || !!result}
            variant={result ? "secondary" : "default"}
          >
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {result ? "Migration Complete" : "Run Migration"}
          </Button>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>• This will update all existing companies</p>
          <p>• No notifications will be sent</p>
          <p>• This action is a one-time operation</p>
          <p>• Migration timestamp will be logged</p>
        </div>
      </CardContent>
    </Card>
  )
}
