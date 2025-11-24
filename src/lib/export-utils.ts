import { AttendanceRecord, Employee } from "@/types/next-auth"

export function exportToCSV(data: AttendanceRecord[], filename = "attendance.csv") {
  const headers = ["ID", "Employee Name", "Event", "Date", "Time", "Status", "Accuracy"]

  const rows = data.map((record) => [
    record.id,
    record.employeeName,
    record.eventName,
    record.timestamp.toLocaleDateString(),
    record.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    record.status,
    `${record.accuracy.toFixed(1)}%`,
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportEmployeesToCSV(employees: Employee[], filename = "employees.csv") {
  const headers = ["ID", "Name", "Employee ID", "Email", "Department", "Role"]

  const rows = employees.map((emp) => [emp.id, emp.name, emp.email, emp.department])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportReportToCSV(
  data: Array<{
    name: string
    present: number
    late: number
    absent: number
    total?: number
    avgAccuracy?: number
  }>,
  reportType = "report",
  filename?: string,
) {
  const headers = [
    "Name",
    "Present",
    "Late",
    "Absent",
    ...(data[0]?.total !== undefined ? ["Total"] : []),
    ...(data[0]?.avgAccuracy !== undefined ? ["Avg Accuracy"] : []),
  ]

  const rows = data.map((item) => {
    const row = [item.name, item.present, item.late, item.absent]
    if (item.total !== undefined) row.push(item.total)
    if (item.avgAccuracy !== undefined) row.push(`${item.avgAccuracy.toFixed(1)}%`)
    return row
  })

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename || `${reportType}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
