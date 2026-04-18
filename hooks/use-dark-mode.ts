"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "admin-dark-mode"

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "true") setIsDark(true)
    setMounted(true)
  }, [])

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const set = (value: boolean) => {
    setIsDark(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return { isDark, toggle, set, mounted }
}
