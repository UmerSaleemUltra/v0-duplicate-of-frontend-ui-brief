"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash, Search, ShoppingCart, Tag, Users, Building2, Loader2 } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { authService } from "@/lib/auth"

type SearchResult = { type: string; id: string; title: string; subtitle: string; href: string }
const icons = { Customer: Users, Company: Building2, Document: FileText, Order: ShoppingCart, "Promo code": Tag }

export function AdminGlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const token = authService.getToken()
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const payload = await response.json()
        setResults(response.ok ? payload.results ?? [] : [])
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([])
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query])

  const selectResult = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hidden md:flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent" aria-label="Search admin data">
        <Search className="size-4" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search admin data" description="Search customers, companies, orders, documents, and promo codes">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search customers, orders, documents..." />
        <CommandList className="max-h-[min(60vh,28rem)]">
          {!query.trim() && <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>}
          {query.trim().length >= 2 && !loading && results.length === 0 && <CommandEmpty>No matching records found.</CommandEmpty>}
          {loading && <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Searching...</div>}
          {results.length > 0 && <CommandGroup heading="Search results">{results.map((item) => { const Icon = icons[item.type as keyof typeof icons] ?? Hash; return <CommandItem key={`${item.type}-${item.id}`} value={`${item.title} ${item.subtitle}`} onSelect={() => selectResult(item.href)}><Icon className="text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.type} · {item.subtitle}</span></span></CommandItem> })}</CommandGroup>}
        </CommandList>
      </CommandDialog>
    </>
  )
}
