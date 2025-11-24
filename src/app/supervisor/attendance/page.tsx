"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { AttendanceTable } from "@/components/attendance-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToCSV } from "@/lib/export-utils"
import { useState } from "react"
import { Search, Download } from "lucide-react"
import { mockAttendanceRecords, mockEvents } from "@/utils/mock-data"

export default function SupervisorAttendancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")

  let filteredRecords = mockAttendanceRecords

  if (searchTerm) {
    filteredRecords = filteredRecords.filter(
      (record) =>
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  if (selectedEvent !== "all") {
    filteredRecords = filteredRecords.filter((record) => record.eventId === selectedEvent)
  }

  filteredRecords = filteredRecords.filter((record) => record.accuracy > 80)

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0]
    exportToCSV(filteredRecords, `attendance-${timestamp}.csv`)
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance History</h1>
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

              <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
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
    </main>
  )
}
