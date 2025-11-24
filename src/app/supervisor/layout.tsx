"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SupervisorSidebar } from "@/components/supervisor-sidebar"
import { currentUser as mockCurrentUser } from "@/utils/mock-data";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user =  mockCurrentUser;
  const router = useRouter()

//   useEffect(() => {
//     if (user && user.role !== "supervisor") {
//       router.push("/admin/dashboard")
//     }
//   }, [user, router])

  if (!user || user.role !== "supervisor") {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <SupervisorSidebar />
      {children}
    </div>
  )
}
