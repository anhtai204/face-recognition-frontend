"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { AttendanceTable } from "@/components/attendance-table"
import { ManualAttendanceDialog } from "@/components/manual-attendance-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToCSV } from "@/lib/export-utils"
import { useState } from "react"
import { Search, Download } from "lucide-react"
import { mockAttendanceRecords, mockEmployees, mockEvents } from "@/utils/mock-data"
import { AttendanceRecord } from "@/types/next-auth"

export default function AdminAttendancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords)

  let filteredRecords = attendanceRecords

  if (searchTerm) {
    filteredRecords = filteredRecords.filter(
      (record) =>
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (selectedEvent !== "all") {
    filteredRecords = filteredRecords.filter((record) => record.eventId === selectedEvent)
  }

  filteredRecords = filteredRecords.filter((record) => record.accuracy > 80)

  const handleManualAttendance = (data: {
    eventId: string
    status: "present" | "absent" | "late"
    accuracy: number
    userId: string
  }) => {
    const employee = mockEmployees.find((e) => e.id === data. userId)
    const event = mockEvents.find((e) => e.id === data.eventId)

    if (!employee || !event) return

    const newRecord: AttendanceRecord = {
      id: `manual-${Date.now()}`,
      userId: employee.id,
      employeeName: employee.name,
      timestamp: new Date(),
      accuracy: data.accuracy,
      faceImage: "/face-recognition.jpg",
      eventId: data.eventId,
      eventName: event.name,
      status: data.status,
    }

    setAttendanceRecords([newRecord, ...attendanceRecords])
  }

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0]
    exportToCSV(filteredRecords, `attendance-${timestamp}.csv`)
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <ThemeToggle />
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {mockEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button className="gap-2 flex-1" onClick={() => setManualDialogOpen(true)}>
                  + Manual Entry
                </Button>
                <Button variant="outline" className="gap-2 flex-1 bg-transparent" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceTable records={filteredRecords} />
          </CardContent>
        </Card>
      </div>

      <ManualAttendanceDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        onSubmit={handleManualAttendance}
      />
    </main>
  )
}