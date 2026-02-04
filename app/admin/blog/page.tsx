"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function BlogManagement() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadPosts()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/blog/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/blog")
      const data = await response.json()

      if (data.success) {
        setPosts(data.data)
      } else {
        toast.error("Failed to load blog posts")
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Error loading blog posts")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Blog post deleted successfully")
        loadPosts()
      } else {
        toast.error(data.error || "Failed to delete blog post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Error deleting blog post")
    }
  }

  const isNewPost = (createdAt: string) => {
    const postDate = new Date(createdAt)
    const now = new Date()
    const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24)
    return daysDiff <= 7
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded w-40"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-24"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
          <div className="h-10 bg-slate-100 rounded w-32"></div>
        </div>

        {/* Blog Posts Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="h-48 bg-slate-200"></div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                  <div className="h-6 bg-slate-100 rounded-full w-24"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="h-4 bg-slate-100 rounded w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#880000] to-[#ff0d13] bg-clip-text text-transparent">
            Blog Management
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Create and manage blog posts</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 transition-opacity shadow-lg"
        >
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No blog posts found</p>
              <Button
                asChild
                className="mt-4 bg-gradient-to-r from-[#880000] to-[#ff0d13] hover:opacity-90 transition-opacity shadow-lg"
              >
                <Link href="/admin/blog/new">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post._id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  {/* Featured Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#880000] via-[#ff0d13] to-[#ff6b6f]">
                        <span className="text-white text-5xl font-bold opacity-30">BF</span>
                      </div>
                    )}

                    {/* Status & NEW badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                        className="text-xs font-semibold"
                      >
                        {post.status}
                      </Badge>
                      {isNewPost(post.createdAt) && (
                        <Badge className="text-xs bg-[#ff0d13] hover:bg-[#d81c20] font-semibold">NEW</Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    <Badge variant="outline" className="text-xs mb-3">
                      {post.category}
                    </Badge>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">{post.title}</h3>

                    {/* Meta info */}
                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(post.createdAt).toLocaleDateString()} • {post.views || 0} views
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/admin/blog/${post._id}`}>
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post._id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
