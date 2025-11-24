import { AIModel, AttendanceRecord, Employee, Event, FaceEmbedding, ModelConfiguration, User } from "@/types/next-auth"

// Mock current user
export const currentUser: User = {
  id: "1",
  name: "Admin User",
  email: "admin@company.com",
//   role: "supervisor",
  role: "admin",
  department: "Management",
}

// Mock employees
export const mockEmployees: Employee[] = [
  {
    id: "1",
    full_name: "John Doe",
    email: "john@company.com",
    department: "Engineering",
    role: "admin",
  },
  {
    id: "2",
    full_name: "Jane Smith",
    email: "jane@company.com",
    department: "Engineering",
    role: "supervisor",
  },
  {
    id: "3",
    full_name: "Mike Johnson",
    email: "mike@company.com",
    department: "Sales",
    role: "employee",
  },
  {
    id: "4",
    full_name: "Sarah Williams",
    email: "sarah@company.com",
    department: "HR",
    role: "employee",

  },
  {
    id: "5",
    full_name: "Tom Brown",
    email: "tom@company.com",
    department: "Engineering",
    role: "employee",
  },
]

// Mock events
export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Morning Standup",
    type: "event",
    startTime: new Date(2025, 9, 26, 9, 0),
    endTime: new Date(2025, 9, 26, 9, 30),
    department: "Engineering",
    description: "Daily team standup",
  },
  {
    id: "2",
    name: "React Training",
    type: "class",
    startTime: new Date(2025, 9, 26, 10, 0),
    endTime: new Date(2025, 9, 26, 12, 0),
    department: "Engineering",
    description: "Advanced React patterns",
  },
  {
    id: "3",
    name: "Shift A",
    type: "shift",
    startTime: new Date(2025, 9, 26, 8, 0),
    endTime: new Date(2025, 9, 26, 16, 0),
    department: "Sales",
  },
  {
    id: "4",
    name: "Team Meeting",
    type: "event",
    startTime: new Date(2025, 9, 26, 14, 0),
    endTime: new Date(2025, 9, 26, 15, 0),
    department: "Engineering",
  },
]

// Mock attendance records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    employeeName: "John Doe",
    userId: "1",
    timestamp: new Date(2025, 9, 26, 9, 2),
    accuracy: 98.5,
    faceImage: "/face-recognition.jpg",
    eventId: "1",
    eventName: "Morning Standup",
    status: "present",
  },
  {
    id: "2",
    employeeName: "Jane Smith",
    userId: "1",
    timestamp: new Date(2025, 9, 26, 9, 5),
    accuracy: 96.2,
    faceImage: "/face-recognition.jpg",
    eventId: "1",
    eventName: "Morning Standup",
    status: "present",
  },
  {
    id: "3",
    employeeName: "John Doe",
    userId: "1",
    timestamp: new Date(2025, 9, 26, 10, 1),
    accuracy: 97.8,
    faceImage: "/face-recognition.jpg",
    eventId: "2",
    eventName: "React Training",
    status: "present",
  },
  {
    id: "4",
    employeeName: "Tom Brown",
    userId: "1",
    timestamp: new Date(2025, 9, 26, 10, 15),
    accuracy: 85.3,
    faceImage: "/face-recognition.jpg",
    eventId: "2",
    eventName: "React Training",
    status: "late",
  },
  {
    id: "5",
    userId: "1",
    employeeName: "Mike Johnson",
    timestamp: new Date(2025, 9, 26, 8, 5),
    accuracy: 99.1,
    faceImage: "/face-recognition.jpg",
    eventId: "3",
    eventName: "Shift A",
    status: "present",
  },
  {
    id: "6",
    userId: "1",
    employeeName: "Sarah Williams",
    timestamp: new Date(2025, 9, 25, 9, 0),
    accuracy: 78.5,
    faceImage: "/face-recognition.jpg",
    eventId: "1",
    eventName: "Morning Standup",
    status: "present",
  },
]



export const availableModels: Record<string, AIModel[]> = {
  detection: [
    {
      id: "yolov8",
      name: "YOLOv8",
      description: "Fast and accurate face detection",
      category: "detection",
      version: "8.0",
    },
    {
      id: "retinaface",
      name: "RetinaFace",
      description: "Robust face detection with high accuracy",
      category: "detection",
      version: "1.0",
    },
    {
      id: "mtcnn",
      name: "MTCNN",
      description: "Multi-task cascaded convolutional networks",
      category: "detection",
      version: "1.0",
    },
  ],
  extraction: [
    {
      id: "arcface",
      name: "ArcFace",
      description: "State-of-the-art face embedding extraction",
      category: "extraction",
      version: "2.0",
    },
    {
      id: "facenet",
      name: "FaceNet",
      description: "Deep learning face recognition",
      category: "extraction",
      version: "1.0",
    },
    {
      id: "vggface2",
      name: "VGGFace2",
      description: "Large-scale face recognition model",
      category: "extraction",
      version: "1.0",
    },
  ],
  recognition: [
    {
      id: "cosface",
      name: "CosFace",
      description: "Large margin cosine loss for face recognition",
      category: "recognition",
      version: "1.0",
    },
    {
      id: "sphereface",
      name: "SphereFace",
      description: "Angular softmax for face recognition",
      category: "recognition",
      version: "1.0",
    },
    {
      id: "insightface",
      name: "InsightFace",
      description: "Comprehensive face recognition framework",
      category: "recognition",
      version: "0.7",
    },
  ],
  liveness: [
    {
      id: "silentliveness",
      name: "Silent Liveness",
      description: "Passive liveness detection without user interaction",
      category: "liveness",
      version: "1.0",
    },
    {
      id: "activeliveness",
      name: "Active Liveness",
      description: "Interactive liveness detection with challenges",
      category: "liveness",
      version: "1.0",
    },
  ],
}

export const defaultModelConfiguration: ModelConfiguration = {
  faceDetectionModel: "yolov8",
  faceExtractionModel: "arcface",
  faceRecognitionModel: "insightface",
  livenessDetectionModel: "silentliveness",
}

export const mockFaceEmbeddings: FaceEmbedding[] = [
  {
    id: "emb1",
    embedding: Array(512)
      .fill(0)
      .map(() => Math.random()),
    imageUrl: "/employee-face-1.jpg",
    createdAt: new Date(2025, 9, 20),
  },
  {
    id: "emb2",
    embedding: Array(512)
      .fill(0)
      .map(() => Math.random()),
    imageUrl: "/employee-face-2.jpg",
    createdAt: new Date(2025, 9, 20),
  },
]