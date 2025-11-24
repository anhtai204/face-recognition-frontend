"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  Camera,
  Square,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { sendRequest } from "@/utils/api";
import { IUser } from "@/types/next-auth";
import { v4 as uuidv4 } from "uuid";
import * as faceapi from "face-api.js";

// --- CẬP NHẬT CÁC TYPE ---

// Giữ nguyên type của backend
interface FaceRecognitionResponse {
  user_id: string | null;
  confidence: number | null;
  accuracy: number | null;
  is_recognized: boolean;
  message: string;
  bbox: [number, number, number, number] | null;
}

interface DetectionResult {
  id: string;
  employeeName: string; // "Unknown"
  accuracy: number;
  timestamp: Date;
  isRecognized: boolean;
}

interface IBackendRes<T> {
  data: T;
  message: string;
}

// Tần suất gọi API (milliseconds)
const RECOGNITION_INTERVAL = 2000; // 2 giây

export default function CameraPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAiReady, setIsAiReady] = useState(false); // State cho model AI
  const [isRecognizing, setIsRecognizing] = useState(false); // Khóa API
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<string>("");

  // State lưu tên/box hiện tại để VẼ
  const [currentDetection, setCurrentDetection] =
    // SỬA: Kiểu dữ liệu phải là WithFaceLandmarks
    useState<faceapi.WithFaceLandmarks<{
      detection: faceapi.FaceDetection;
    }> | null>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);

  const [employees, setEmployees] = useState<IUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const canUseCamera = user?.role === "admin" || user?.role === "supervisor";

  // --- 2. LOAD MODEL VÀ DATA ---

  // Load model AI (chạy 1 lần)
  useEffect(() => {
    const loadModels = async () => {
      // Tải model từ thư mục /public/models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        // Cần 'Landmark' để 'extractFaces' hoạt động
        faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
      ]);
      setIsAiReady(true);
      console.log("AI Model (detector) ready.");
    };
    loadModels();
  }, []);

  // Fetch users (để map ID sang Tên)
  useEffect(() => {
    if (!session?.user?.access_token) return;

    const fetchUsers = async () => {
      try {
        setIsLoadingData(true);
        const usersRes = await sendRequest<IBackendRes<IUser[]>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/`,
          method: "GET",
          headers: { Authorization: `Bearer ${session.user.access_token}` },
        });
        if (usersRes.data) setEmployees(usersRes.data);
      } catch (err: any) {
        showError(err.message || "Failed to load users");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchUsers();
  }, [session]);

  // --- 3. LOGIC CAMERA VÀ VÒNG LẶP ---

  const showError = (message: string, duration: number = 3000) => {
    setError(message);
    setTimeout(() => setError(""), duration);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      showError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsStreaming(false);
    }
  };

  // Tự động start camera khi load
  useEffect(() => {
    if (canUseCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [canUseCamera]);

  // --- 4. VÒNG LẶP VẼ (60 FPS) BẰNG 'requestAnimationFrame' ---
  const runDrawLoop = async () => {
    // 1. KIỂM TRA ĐẦU VÀO (Giữ nguyên)
    if (
      !isAiReady ||
      !videoRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended
    ) {
      requestAnimationFrame(() => runDrawLoop()); // Chờ
      return;
    }

    // 2. PHÁT HIỆN (Giữ nguyên)
    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      )
      .withFaceLandmarks(true);

    setCurrentDetection(detection || null); // Lưu detection (có thể là 'null')

    // 3. CHUẨN BỊ VẼ (Giữ nguyên)
    const canvas = overlayCanvasRef.current;
    if (!canvas || !videoRef.current) {
      requestAnimationFrame(() => runDrawLoop());
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      requestAnimationFrame(() => runDrawLoop());
      return;
    }

    // 4. ĐỒNG BỘ KÍCH THƯỚC VÀ RESIZE (Giữ nguyên)
    const dims = faceapi.matchDimensions(canvas, videoRef.current, true);
    const resizedDetection = faceapi.resizeResults(detection, dims);

    // 5. XÓA KHUNG CŨ
    // (Luôn luôn xóa, dù có mặt hay không)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- ⬇️ SỬA LỖI NẰM Ở ĐÂY ⬇️ ---
    //
    // 6. KIỂM TRA AN TOÀN
    // Chỉ vẽ nếu 'resizedDetection' tồn tại (tức là 'detection' có)
    if (resizedDetection) {
      const { box } = resizedDetection.detection;
      const color = recognizedName ? "#00FF00" : "#FFFF00"; // Xanh/Vàng
      const name = recognizedName || "Scanning...";

      // Vẽ box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Vẽ tên
      ctx.fillStyle = color;
      ctx.font = "18px Arial";
      ctx.fillText(
        name,
        box.x,
        box.y > 20 ? box.y - 10 : box.y + box.height + 20
      );
    }
    // (Nếu 'resizedDetection' là 'undefined', khối 'if' này sẽ bị bỏ qua
    //  và không có gì được vẽ, nhưng code không bị crash)
    //
    // --- ⬆️ KẾT THÚC SỬA LỖI ⬆️ ---

    // 7. LẶP LẠI (Giữ nguyên)
    requestAnimationFrame(() => runDrawLoop());
  };

  // --- 5. VÒNG LẶP GỌI API (MỖI 2 GIÂY) ---
  const runApiLoop = async () => {
    if (isRecognizing || !currentDetection || !videoRef.current) {
      return; // Bỏ qua nếu đang xử lý, hoặc không có mặt
    }

    setIsRecognizing(true);

    try {
      // 1. CẮT (CROP) KHUÔN MẶT BẰNG face-api.js
      const faceCanvases = await faceapi.extractFaces(videoRef.current, [
        currentDetection.detection,
      ]);
      if (faceCanvases.length === 0) throw new Error("Failed to crop face");

      const blob = await new Promise<Blob | null>((resolve) =>
        faceCanvases[0].toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Failed to convert crop to blob");

      // 2. GỬI ẢNH CROP LÊN ENDPOINT MỚI
      const formData = new FormData();
      formData.append("image_file", blob, "crop.jpg");

      const res = await fetch(
        // SỬA: Dùng endpoint /recognize-crop MỚI
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/recognize-crop`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );

      const data: FaceRecognitionResponse = await res.json();
      if (!res.ok) throw new Error(data.message || (data as any).detail);

      // 3. XỬ LÝ KẾT QUẢ
      const newId = uuidv4();
      let detectionResult: DetectionResult;

      if (data.is_recognized && data.user_id) {
        // TÌM THẤY
        const employee = employees.find((e) => e.id === data.user_id);
        const name = employee ? employee.full_name : "Registered User";
        const accuracy = Math.round((data.accuracy || 0) * 1000) / 10;

        setRecognizedName(name); // <-- Cập nhật tên cho vòng lặp VẼ
        detectionResult = {
          id: newId,
          employeeName: name,
          accuracy: accuracy,
          timestamp: new Date(),
          isRecognized: true,
        };
      } else {
        // KHÔNG TÌM THẤY
        setRecognizedName("Unknown"); // <-- Cập nhật tên cho vòng lặp VẼ
        detectionResult = {
          id: newId,
          employeeName: "Unknown",
          accuracy: 0,
          timestamp: new Date(),
          isRecognized: false,
        };
      }

      setDetections((prev) => [detectionResult, ...prev.slice(0, 4)]);
      setTimeout(() => {
        setDetections((prev) => prev.filter((d) => d.id !== newId));
      }, 5000);
    } catch (err: any) {
      showError(err.message || "An error occurred.");
      setRecognizedName(null); // Reset tên nếu lỗi
    } finally {
      setIsRecognizing(false);
    }
  };

  // --- 6. KHỞI ĐỘNG CÁC VÒNG LẶP (ĐÃ SỬA) ---

  // useEffect 1: Khởi động VÒNG LẶP VẼ (60fps)
  // Chỉ chạy MỘT LẦN khi AI sẵn sàng (isAiReady)
  useEffect(() => {
    const videoElement = videoRef.current;

    // 'runDrawLoop' đã được định nghĩa ở trên (với 'async/await')

    // Chỉ thêm listener KHI AI sẵn sàng VÀ có video element
    if (isAiReady && videoElement) {
      videoElement.addEventListener("play", runDrawLoop);
      console.log("Draw loop listener added.");

      // Cleanup: gỡ listener khi component unmount
      return () => {
        videoElement.removeEventListener("play", runDrawLoop);
        console.log("Draw loop listener removed.");
      };
    }
    // Phụ thuộc vào 'isAiReady' để nó chạy khi model đã tải xong
  }, [isAiReady]);

  // useEffect 2: Khởi động VÒNG LẶP API (mỗi 2 giây)
  // Chỉ chạy KHI camera đang stream VÀ AI sẵn sàng
  useEffect(() => {
    // 'runApiLoop' đã được định nghĩa ở trên

    if (isStreaming && isAiReady) {
      // Chỉ khởi động VÒNG LẶP API KHI stream VÀ AI sẵn sàng
      console.log("Starting API loop interval.");
      const apiInterval = setInterval(runApiLoop, RECOGNITION_INTERVAL);

      // Cleanup: Xóa interval khi component unmount HOẶC khi stop stream
      return () => {
        clearInterval(apiInterval);
        console.log("Cleared API loop interval.");
      };
    }
    // Phụ thuộc vào 'isStreaming' và 'isAiReady'
  }, [isStreaming, isAiReady, employees]); // Thêm 'employees' vì runApiLoop cần nó
  // --- 7. JSX (Đã sửa) ---
  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Camera Attendance
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-black relative aspect-video">
                {/* Video (Lớp dưới cùng) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Canvas Overlay (Lớp trên cùng, trong suốt) */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />

                {/* Loading (khi AI chưa sẵn sàng) */}
                {!isAiReady && isStreaming && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-white ml-2">Loading AI models...</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-border space-y-4">
                <div className="flex gap-2">
                  {!isStreaming ? (
                    <Button onClick={startCamera} className="flex-1 gap-2">
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop Camera
                    </Button>
                  )}
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
              <h2 className="font-bold text-foreground mb-4">
                Recent Detections
              </h2>
              <div className="space-y-3 max-h-[calc(theme(aspectRatio.video)+120px)] overflow-y-auto">
                {detections.length === 0 ? (
                  <p className="text-foreground/60 text-sm text-center py-8">
                    {isStreaming
                      ? "Scanning for faces..."
                      : "Start camera to scan"}
                  </p>
                ) : (
                  detections.map((detection) => (
                    <div
                      key={detection.id}
                      className={`p-3 border rounded-lg ${
                        detection.isRecognized
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {detection.isRecognized ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {detection.employeeName}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-foreground/60">
                              {detection.timestamp.toLocaleTimeString()}
                            </span>
                            {detection.isRecognized && (
                              <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded">
                                {detection.accuracy}%
                              </span>
                            )}
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
  );
}
