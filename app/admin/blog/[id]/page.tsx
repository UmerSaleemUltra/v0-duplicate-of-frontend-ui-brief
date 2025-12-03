"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Upload, X, Bold, Italic, Heading1, Heading2, List, ListOrdered } from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"

export default function EditBlogPost() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetchingPost, setFetchingPost] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    category: "Business Formation",
    tags: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
  })

  useEffect(() => {
    loadPost()
  }, [params.id])

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const post = data.data
        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          content: post.content || "",
          excerpt: post.excerpt || "",
          featuredImage: post.featuredImage || "",
          category: post.category || "Business Formation",
          tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
          metaTitle: post.metaTitle || "",
          metaDescription: post.metaDescription || "",
          status: post.status || "draft",
        })
        setImagePreview(post.featuredImage || null)
      } else {
        toast.error(data.error || "Failed to load blog post")
        router.push("/admin/blog")
      }
    } catch (error) {
      console.error("Error loading post:", error)
      toast.error("Error loading blog post")
      router.push("/admin/blog")
    } finally {
      setFetchingPost(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        setFormData({ ...formData, featuredImage: data.data.url })
        setImagePreview(data.data.url)
        toast.success("Image uploaded successfully")
      } else {
        toast.error(data.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, featuredImage: "" })
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      const response = await fetch(`/api/blog/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Blog post updated successfully")
        router.push("/admin/blog")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update blog post")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast.error("Error updating blog post")
    } finally {
      setLoading(false)
    }
  }

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.content.substring(start, end)
    let newText = ""

    switch (format) {
      case "bold":
        newText = `**${selectedText || "bold text"}**`
        break
      case "italic":
        newText = `*${selectedText || "italic text"}*`
        break
      case "h1":
        newText = `\n# ${selectedText || "Heading 1"}\n`
        break
      case "h2":
        newText = `\n## ${selectedText || "Heading 2"}\n`
        break
      case "ul":
        newText = `\n- ${selectedText || "List item"}\n`
        break
      case "ol":
        newText = `\n1. ${selectedText || "List item"}\n`
        break
    }

    const newContent = formData.content.substring(0, start) + newText + formData.content.substring(end)
    setFormData({ ...formData, content: newContent })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  if (fetchingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#880000] to-[#ff0d13] animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading blog post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Edit Blog Post</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Update blog post details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="post-url-slug"
                required
              />
              <p className="text-xs text-slate-500">URL-friendly version of the title</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <div className="flex items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-md">
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("bold")}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("italic")}>
                  <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("h1")}>
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("h2")}>
                  <Heading2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("ul")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("ol")}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your blog post content here... (Supports Markdown)"
                rows={15}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#ff0d13] focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-slate-500">Use ** for bold, * for italic, # for headings, - for lists</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary of the post"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff0d13] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business Formation">Business Formation</SelectItem>
                    <SelectItem value="LLC Guide">LLC Guide</SelectItem>
                    <SelectItem value="Tax & Compliance">Tax & Compliance</SelectItem>
                    <SelectItem value="State Guides">State Guides</SelectItem>
                    <SelectItem value="News">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="llc, business, startup (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Featured preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 mb-2">Upload a featured image</p>
                    <p className="text-xs text-slate-500 mb-4">PNG, JPG, WebP or GIF (max 5MB)</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Or enter URL manually:</span>
                </div>
                <Input
                  value={formData.featuredImage}
                  onChange={(e) => {
                    setFormData({ ...formData, featuredImage: e.target.value })
                    setImagePreview(e.target.value || null)
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Leave empty to use post title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
              <textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Leave empty to use excerpt"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff0d13] focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#ff0d13] hover:bg-[#d81c20]">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
