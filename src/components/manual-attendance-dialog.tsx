"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockEmployees, mockEvents } from "@/utils/mock-data"

interface ManualAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    eventId: string
    status: "present" | "absent" | "late"
    accuracy: number
    userId: string
  }) => void
}

export function ManualAttendanceDialog({ open, onOpenChange, onSubmit }: ManualAttendanceDialogProps) {
  const [userId, setUserId] = useState("")
  const [eventId, setEventId] = useState("")
  const [status, setStatus] = useState<"present" | "absent" | "late">("present")
  const [accuracy, setAccuracy] = useState("95")

  const handleSubmit = () => {
    if (!eventId) {
      alert("Please fill in all fields")
      return
    }

    onSubmit({
      userId,
      eventId,
      status,
      accuracy: Number.parseFloat(accuracy),
    })

    // Reset form
    setEventId("")
    setStatus("present")
    setAccuracy("95")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Attendance Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {mockEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event">Event/Class/Shift</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {mockEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "present" | "absent" | "late")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accuracy">Recognition Accuracy (%)</Label>
            <Input
              id="accuracy"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
              placeholder="95.0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Attendance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
