"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Camera, Square, CheckCircle } from "lucide-react"
import { mockEmployees, mockEvents } from "@/utils/mock-data"
import { currentUser as mockCurrentUser } from "@/utils/mock-data";


interface DetectionResult {
  employeeName: string
  accuracy: number
  timestamp: Date
  eventId: string
  eventName: string
}

export default function CameraPage() {
  const user  = mockCurrentUser;
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Check if user has permission to use camera
  const canUseCamera = user?.role === "admin" || user?.role === "supervisor"

  useEffect(() => {
    if (!canUseCamera) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsStreaming(true)
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        console.error("Camera error:", err)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [canUseCamera])

  const simulateDetection = () => {
    if (!selectedEvent) {
      setError("Please select an event first")
      return
    }

    // Simulate facial recognition detection
    const randomEmployee = mockEmployees[Math.floor(Math.random() * mockEmployees.length)]
    const event = mockEvents.find((e) => e.id === selectedEvent)
    const accuracy = 85 + Math.random() * 15 // 85-100% accuracy

    if (event) {
      const detection: DetectionResult = {
        employeeName: randomEmployee.full_name,
        accuracy: Math.round(accuracy * 10) / 10,
        timestamp: new Date(),
        eventId: event.id,
        eventName: event.name,
      }

      setDetections((prev) => [detection, ...prev])

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setDetections((prev) => prev.slice(1))
      }, 3000)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setIsStreaming(false)
    }
  }

  if (!canUseCamera) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-foreground/60">Only admins and supervisors can access the camera attendance feature.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Camera Attendance</h1>
          <p className="text-foreground/60">Real-time facial recognition attendance tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-black relative aspect-video">
                {isStreaming ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
                      <p className="text-foreground/60">Camera feed will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden canvas for processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Controls */}
              <div className="p-4 border-t border-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Select Event</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                  >
                    <option value="">Choose an event...</option>
                    {mockEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} ({event.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  {!isStreaming ? (
                    <Button onClick={() => setIsStreaming(true)} className="flex-1 gap-2">
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="flex-1 gap-2">
                      <Square className="h-4 w-4" />
                      Stop Camera
                    </Button>
                  )}
                  <Button
                    onClick={simulateDetection}
                    disabled={!isStreaming || !selectedEvent}
                    className="flex-1 gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Detect Face
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Detection Results */}
          <div>
            <Card className="p-4">
              <h2 className="font-bold text-foreground mb-4">Recent Detections</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detections.length === 0 ? (
                  <p className="text-foreground/60 text-sm text-center py-8">No detections yet</p>
                ) : (
                  detections.map((detection, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in slide-in-from-top"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{detection.employeeName}</p>
                          <p className="text-xs text-foreground/60">{detection.eventName}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-foreground/60">
                              {detection.timestamp.toLocaleTimeString()}
                            </span>
                            <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded">
                              {detection.accuracy}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
