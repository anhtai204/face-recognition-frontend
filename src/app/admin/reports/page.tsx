"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { exportReportToCSV } from "@/lib/export-utils"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, TrendingUp, Calendar, CheckCircle, Download } from "lucide-react"
import { mockAttendanceRecords, mockEmployees, mockEvents } from "@/utils/mock-data"

export default function AdminReportsPage() {
  const totalRecords = mockAttendanceRecords.length
  const presentCount = mockAttendanceRecords.filter((r) => r.status === "present").length
  const lateCount = mockAttendanceRecords.filter((r) => r.status === "late").length
  const absentCount = mockAttendanceRecords.filter((r) => r.status === "absent").length
  const avgAccuracy = (mockAttendanceRecords.reduce((sum, r) => sum + r.accuracy, 0) / totalRecords).toFixed(1)

  const employeeStats = mockEmployees.map((emp) => {
    const empRecords = mockAttendanceRecords.filter((r) => r.id === emp.id)
    const empPresent = empRecords.filter((r) => r.status === "present").length
    const empLate = empRecords.filter((r) => r.status === "late").length
    const empAbsent = empRecords.filter((r) => r.status === "absent").length
    const empAvgAccuracy =
      empRecords.length > 0 ? (empRecords.reduce((sum, r) => sum + r.accuracy, 0) / empRecords.length).toFixed(1) : 0

    return {
      name: emp.name,
      present: empPresent,
      late: empLate,
      absent: empAbsent,
      avgAccuracy: Number(empAvgAccuracy),
      total: empRecords.length,
    }
  })

  const eventStats = mockEvents.map((event) => {
    const eventRecords = mockAttendanceRecords.filter((r) => r.eventId === event.id)
    const eventPresent = eventRecords.filter((r) => r.status === "present").length
    const eventLate = eventRecords.filter((r) => r.status === "late").length
    const eventAbsent = eventRecords.filter((r) => r.status === "absent").length

    return {
      name: event.name,
      present: eventPresent,
      late: eventLate,
      absent: eventAbsent,
      total: eventRecords.length,
    }
  })

  const departmentStats = Array.from(
    mockEmployees.reduce((acc, emp) => {
      const dept = emp.department
      const empRecords = mockAttendanceRecords.filter((r) => r.id === emp.id)
      const deptData = acc.get(dept) || { present: 0, late: 0, absent: 0, total: 0 }
      deptData.present += empRecords.filter((r) => r.status === "present").length
      deptData.late += empRecords.filter((r) => r.status === "late").length
      deptData.absent += empRecords.filter((r) => r.status === "absent").length
      deptData.total += empRecords.length
      acc.set(dept, deptData)
      return acc
    }, new Map<string, { present: number; late: number; absent: number; total: number }>()),
  ).map(([name, data]) => ({
    name,
    ...data,
  }))

  const attendanceRateData = [
    { name: "Present", value: presentCount, fill: "var(--color-chart-1)" },
    { name: "Late", value: lateCount, fill: "var(--color-chart-2)" },
    { name: "Absent", value: absentCount, fill: "var(--color-chart-3)" },
  ]

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <ThemeToggle />
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Records"
            value={totalRecords}
            icon={<Calendar className="h-4 w-4" />}
            description="All attendance entries"
          />
          <StatsCard
            title="Present"
            value={presentCount}
            icon={<CheckCircle className="h-4 w-4" />}
            description={`${((presentCount / totalRecords) * 100).toFixed(1)}% of total`}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Late Arrivals"
            value={lateCount}
            icon={<TrendingUp className="h-4 w-4" />}
            description={`${((lateCount / totalRecords) * 100).toFixed(1)}% of total`}
          />
          <StatsCard
            title="Avg Accuracy"
            value={`${avgAccuracy}%`}
            icon={<Users className="h-4 w-4" />}
            description="Face recognition"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="employees">By Employee</TabsTrigger>
              <TabsTrigger value="events">By Event</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => exportReportToCSV(employeeStats, "employee-report")}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attendanceRateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {attendanceRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="font-medium">Present</span>
                    <Badge variant="outline">{presentCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <span className="font-medium">Late</span>
                    <Badge variant="outline">{lateCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                    <span className="font-medium">Absent</span>
                    <Badge variant="outline">{absentCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <span className="font-medium">Avg Accuracy</span>
                    <Badge variant="outline">{avgAccuracy}%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Attendance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={employeeStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="var(--color-chart-1)" />
                    <Bar dataKey="late" fill="var(--color-chart-2)" />
                    <Bar dataKey="absent" fill="var(--color-chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Employee Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeStats.map((emp) => (
                    <div
                      key={emp.name}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">Avg Accuracy: {emp.avgAccuracy}%</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-green-600 dark:text-green-400 font-semibold">{emp.present}</p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center">
                          <p className="text-yellow-600 dark:text-yellow-400 font-semibold">{emp.late}</p>
                          <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                        <div className="text-center">
                          <p className="text-red-600 dark:text-red-400 font-semibold">{emp.absent}</p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Attendance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={eventStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="var(--color-chart-1)" />
                    <Bar dataKey="late" fill="var(--color-chart-2)" />
                    <Bar dataKey="absent" fill="var(--color-chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Department Attendance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="var(--color-chart-1)" />
                    <Bar dataKey="late" fill="var(--color-chart-2)" />
                    <Bar dataKey="absent" fill="var(--color-chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
