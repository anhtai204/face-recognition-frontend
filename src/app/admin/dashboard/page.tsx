"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { StatsCard } from "@/components/stats-card"
import { AttendanceTable } from "@/components/attendance-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, CheckCircle, TrendingUp, Plus } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import Link from "next/link"
import { mockAttendanceRecords, mockEmployees } from "@/utils/mock-data"


const attendanceData = [
  { day: "Mon", present: 45, absent: 5, late: 3 },
  { day: "Tue", present: 48, absent: 2, late: 2 },
  { day: "Wed", present: 46, absent: 3, late: 4 },
  { day: "Thu", present: 50, absent: 1, late: 1 },
  { day: "Fri", present: 44, absent: 4, late: 3 },
]

const accuracyData = [
  { time: "08:00", accuracy: 94.2 },
  { time: "10:00", accuracy: 96.5 },
  { time: "12:00", accuracy: 95.8 },
  { time: "14:00", accuracy: 97.1 },
  { time: "16:00", accuracy: 95.3 },
]

export default function AdminDashboardPage() {
  const filteredRecords = mockAttendanceRecords

  const presentCount = filteredRecords.filter((r) => r.status === "present").length
  const lateCount = filteredRecords.filter((r) => r.status === "late").length
  const avgAccuracy = filteredRecords.reduce((sum, r) => sum + r.accuracy, 0) / filteredRecords.length || 0

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={mockEmployees.length}
            icon={<Users className="h-4 w-4" />}
            description="Active employees"
          />
          <StatsCard
            title="Present Today"
            value={presentCount}
            icon={<CheckCircle className="h-4 w-4" />}
            description={`${((presentCount / filteredRecords.length) * 100).toFixed(1)}% attendance`}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Late Arrivals"
            value={lateCount}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Today"
          />
          <StatsCard
            title="Avg Accuracy"
            value={`${avgAccuracy.toFixed(1)}%`}
            icon={<Calendar className="h-4 w-4" />}
            description="Face recognition"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Bar dataKey="present" fill="var(--color-chart-1)" />
                  <Bar dataKey="late" fill="var(--color-chart-2)" />
                  <Bar dataKey="absent" fill="var(--color-chart-3)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recognition Accuracy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" domain={[90, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-chart-1)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Attendance</CardTitle>
            <div className="flex gap-2">
              <Link href="/admin/attendance">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceTable records={filteredRecords.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
