import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt"

interface IUser {
    id: string;
    full_name: string;
    email: string;
    access_token: string;
    role: string;
    department: string;
    avatar: string;
}
declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        access_token: string;
        refresh_token: string;
        user: IUser;
        access_expire: number;
        error: string;
    }
}

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: IUser,
        access_token: string;
        refresh_token: string;
        access_expire: number;
        error: string;
    }

}

// Interface
export type UserRole = "admin" | "supervisor" | "employee";

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  avatar?: string
}

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

export interface Event {
  id: string
  title: string
  event_type: "class" | "event" | "shift"
  start_time: Date
  end_time: Date
  department: string
  description?: string
  created_at?: Date
  created_by?: uuid.UUID
}

export interface Employee {
  id: string
  full_name: string
  email: string
  department: string
  avatar?: string
  role: "employee" | "supervisor" | "admin"
  // faceEmbeddings?: FaceEmbedding[]
  faceEmbeddings: FaceEmbeddingCreate[]
}

export interface EmployeePublic {
  id: string
  full_name: string
  email: string
  department: string
  avatar?: string
  role: "employee" | "supervisor" | "admin"
  faceEmbeddings?: FaceEmbedding[]
}

export interface FaceEmbedding {
  id: string
  // embedding: number[] // 512-dimensional vector
  image_url: string
  created_at: Date
}


export interface FaceEmbeddingCreate {
  id: string
  user_id: string
  embedding: number[]
  image_url: string | null
  created_at: Date
}

export interface FaceEmbeddingPublic {
  id: string
  user_id: string
  image_url: string | null
  created_at: Date
}

export interface FaceEmbeddingsPublic {
  data: FaceEmbeddingPublic[]
  count: number
}

export interface AIModel {
  id: string
  name: string
  description: string
  category: "detection" | "extraction" | "recognition" | "liveness"
  version: string
}

export interface ModelConfiguration {
  faceDetectionModel: string
  faceExtractionModel: string
  faceRecognitionModel: string
  livenessDetectionModel: string
}
