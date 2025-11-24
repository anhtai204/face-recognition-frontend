"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface AttendanceRecord {
  id: string
  userId: string
  employeeName: string
  timestamp: Date
  accuracy: number
  faceImage: string
  eventId: string
  eventName: string
  status: "present" | "absent" | "late"
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-700 dark:text-green-400"
      case "late":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      case "absent":
        return "bg-red-500/20 text-red-700 dark:text-red-400"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return "text-green-600 dark:text-green-400"
    if (accuracy >= 85) return "text-blue-600 dark:text-blue-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={record.faceImage || "/placeholder.svg"} />
                    <AvatarFallback>{record.employeeName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{record.employeeName}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{record.eventName}</TableCell>
              <TableCell className="text-sm">
                {record.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                <span className={`font-semibold text-sm ${getAccuracyColor(record.accuracy)}`}>
                  {record.accuracy.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(record.status)}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
