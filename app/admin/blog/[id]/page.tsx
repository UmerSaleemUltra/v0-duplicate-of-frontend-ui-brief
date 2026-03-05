"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-44 rounded-xl" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  const inputCls = "h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] focus-visible:ring-[#0071e3] focus-visible:border-[#0071e3] placeholder:text-[#86868b] text-[#1d1d1f] text-[15px]"
  const textareaCls = "w-full px-3 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] text-[#1d1d1f] text-[15px] placeholder:text-[#86868b] resize-none"
  const labelCls = "text-[13px] font-medium text-[#1d1d1f]"
  const selectTriggerCls = "h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-[#1d1d1f] text-[15px] focus:ring-[#0071e3]"

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]"
        >
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Edit Post</h1>
          <p className="text-[14px] text-[#6e6e73] mt-0.5">Update your blog post details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white divide-y divide-[#f5f5f7] overflow-hidden">
          <div className="px-8 py-6 space-y-5">
            <p className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest">Content</p>

            <div className="space-y-1.5">
              <Label htmlFor="title" className={labelCls}>Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Post title" required className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug" className={labelCls}>Slug</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="post-url-slug" required className={inputCls} />
              <p className="text-[12px] text-[#86868b]">URL-friendly version of the title</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className={labelCls}>Content</Label>
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-t-xl border-b-0">
                {[
                  { icon: <Bold className="h-3.5 w-3.5" />, fmt: "bold" },
                  { icon: <Italic className="h-3.5 w-3.5" />, fmt: "italic" },
                  null,
                  { icon: <Heading1 className="h-3.5 w-3.5" />, fmt: "h1" },
                  { icon: <Heading2 className="h-3.5 w-3.5" />, fmt: "h2" },
                  null,
                  { icon: <List className="h-3.5 w-3.5" />, fmt: "ul" },
                  { icon: <ListOrdered className="h-3.5 w-3.5" />, fmt: "ol" },
                ].map((item, idx) =>
                  item === null ? (
                    <div key={idx} className="w-px h-4 bg-[#d2d2d7] mx-1" />
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertFormatting(item.fmt)}
                      className="p-1.5 rounded-lg text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                    >
                      {item.icon}
                    </button>
                  )
                )}
              </div>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your blog post content here... (Supports Markdown)"
                rows={14}
                required
                className="w-full px-3 py-2.5 rounded-b-xl border border-[#d2d2d7] bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] text-[#1d1d1f] text-[14px] placeholder:text-[#86868b] font-mono resize-none"
              />
              <p className="text-[12px] text-[#86868b]">Supports Markdown: **bold**, *italic*, # heading, - list</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excerpt" className={labelCls}>Excerpt</Label>
              <textarea id="excerpt" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Short summary of the post" rows={3} className={textareaCls} />
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            <p className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest">Settings</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-[#d2d2d7]">
                    <SelectItem value="Business Formation">Business Formation</SelectItem>
                    <SelectItem value="LLC Guide">LLC Guide</SelectItem>
                    <SelectItem value="Tax & Compliance">Tax &amp; Compliance</SelectItem>
                    <SelectItem value="State Guides">State Guides</SelectItem>
                    <SelectItem value="News">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-[#d2d2d7]">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags" className={labelCls}>Tags</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="llc, business, startup (comma-separated)" className={inputCls} />
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            <p className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest">Featured Image</p>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview || "/placeholder.svg"} alt="Featured preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-[#d2d2d7] bg-[#f5f5f7] p-8 text-center hover:border-[#0071e3] transition-colors">
                  <Upload className="h-7 w-7 mx-auto mb-2 text-[#86868b]" />
                  <p className="text-[14px] text-[#1d1d1f] font-medium mb-1">Upload a featured image</p>
                  <p className="text-[12px] text-[#86868b] mb-4">PNG, JPG, WebP or GIF — max 5 MB</p>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" id="image-upload" />
                  <button
                    type="button"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium transition-colors disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Choose File"}
                  </button>
                </div>
              )}
              <p className="text-[12px] text-[#86868b]">Or paste an image URL:</p>
              <Input
                value={formData.featuredImage}
                onChange={(e) => { setFormData({ ...formData, featuredImage: e.target.value }); setImagePreview(e.target.value || null) }}
                placeholder="https://example.com/image.jpg"
                className={inputCls}
              />
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            <p className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest">SEO</p>
            <div className="space-y-1.5">
              <Label htmlFor="metaTitle" className={labelCls}>Meta Title</Label>
              <Input id="metaTitle" value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Leave empty to use post title" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metaDescription" className={labelCls}>Meta Description</Label>
              <textarea id="metaDescription" value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Leave empty to use excerpt" rows={3} className={textareaCls} />
            </div>
          </div>

          <div className="px-8 py-5 flex justify-end gap-3 bg-[#fafafa]">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-[14px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
