"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { currentUser as mockCurrentUser } from "@/utils/mock-data";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user  = mockCurrentUser;
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/supervisor/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      {children}
    </div>
  )
}
