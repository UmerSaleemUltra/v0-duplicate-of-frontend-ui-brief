"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export function MigrationMilestoneCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigration = async () => {
    if (!confirm("This will update 150+ existing companies with the companyApplicationApplied milestone. Continue?")) {
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/migration/company-application-milestone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Migrate Company Application Milestone
        </CardTitle>
        <CardDescription>
          Backfill the new companyApplicationApplied milestone for 150+ existing companies without sending notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          This one-time migration will mark the <strong>Company Application Applied</strong> milestone as complete for all existing companies without triggering customer notifications.
        </p>

        {result && (
          <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">{result.message}</span>
            </div>
            {result.stats && (
              <div className="ml-7 space-y-1 text-sm text-green-600">
                <p>✓ Updated: {result.stats.modifiedCount} companies</p>
                <p>✓ Matched: {result.stats.matchedCount} total</p>
                <p>✓ Completed: {new Date(result.stats.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">Error: {error}</p>
          </div>
        )}

        <Button
          onClick={handleMigration}
          disabled={isLoading || !!result}
          variant={result ? "outline" : "default"}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : result ? (
            "Migration Completed"
          ) : (
            "Run Migration Now"
          )}
        </Button>

        <p className="text-xs text-gray-500">
          This action only needs to be run once. It will not send notifications or affect existing milestone history.
        </p>
      </CardContent>
    </Card>
  )
}
