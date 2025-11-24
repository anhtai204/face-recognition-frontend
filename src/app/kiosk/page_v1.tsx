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
  Loader2,
  XCircle, // Thêm icon cho 'Unknown'
} from "lucide-react";
import { sendRequest } from "@/utils/api"; // Giả sử bạn có hàm này
import { IUser } from "@/types/next-auth"; // Giả sử bạn có type này
import { v4 as uuidv4 } from "uuid";

// --- 1. CẬP NHẬT CÁC TYPE ---

// Giả định API /recognize sẽ trả về thêm 'bbox'
interface FaceRecognitionResponse {
  user_id: string | null;
  confidence: number | null;
  accuracy: number | null;
  is_recognized: boolean;
  message: string;
  bbox: [number, number, number, number] | null; // [x1, y1, x2, y2]
}

// Cập nhật DetectionResult, xóa event
interface DetectionResult {
  id: string; // Thêm ID để xóa đúng
  employeeName: string; // Sẽ là "Unknown"
  accuracy: number;
  timestamp: Date;
  isRecognized: boolean; // Dùng để tạo style
}

// Giả định IBackendRes (từ các file trước)
interface IBackendRes<T> {
  data: T;
  message: string;
}

// Tần suất gọi API (milliseconds). 1000ms = 1 FPS
const RECOGNITION_INTERVAL = 1000;

export default function CameraPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas để VẼ
  const captureCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas ẨN để CHỤP
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false); // Chống gọi API chồng chéo
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<string>("");

  const [employees, setEmployees] = useState<IUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Lưu trữ tọa độ box và tên để vẽ
  const [currentDetectionBox, setCurrentDetectionBox] = useState<{
    box: [number, number, number, number];
    name: string;
    isRecognized: boolean;
  } | null>(null);

  const canUseCamera = user?.role === "admin" || user?.role === "supervisor";

  // --- 2. FETCH DANH SÁCH USER (ĐỂ MAP ID SANG TÊN) ---
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

  // --- 3. LOGIC CAMERA VÀ VÒNG LẶP NHẬN DIỆN ---

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

  // HÀM CHÍNH: Chụp ảnh và gọi API
  const handleRecognizeFace = async () => {
    if (isRecognizing || !videoRef.current || !captureCanvasRef.current) {
      return;
    }

    setIsRecognizing(true);
    setError(""); // Xóa lỗi cũ

    try {
      // 1. Chụp ảnh từ video (dùng canvas ẩn)
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Failed to get canvas context");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Failed to capture image");

      // 2. Tạo FormData
      const formData = new FormData();
      formData.append("image_file", blob, "capture.jpg");

      // 3. Gọi API /recognize
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/recognize?threshold=0.6`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );

      const data: FaceRecognitionResponse = await res.json();

      console.log('>>> Recognition API response:', data);

      // 4. Xử lý response
      if (!res.ok) {
        throw new Error((data as any).detail || data.message);
      }

      const newId = uuidv4();
      let detectionResult: DetectionResult;
      let boxToDraw: typeof currentDetectionBox = null;

      if (data.is_recognized && data.user_id && data.bbox) {
        // TÌM THẤY
        const employee = employees.find((e) => e.id === data.user_id);
        const name = employee ? employee.full_name : "Registered User";
        const accuracy = Math.round((data.accuracy || 0) * 1000) / 10;

        detectionResult = {
          id: newId,
          employeeName: name,
          accuracy: accuracy,
          timestamp: new Date(),
          isRecognized: true,
        };
        boxToDraw = { box: data.bbox, name, isRecognized: true };
      } else {
        // KHÔNG TÌM THẤY (hoặc không có bbox)
        detectionResult = {
          id: newId,
          employeeName: "Unknown",
          accuracy: 0,
          timestamp: new Date(),
          isRecognized: false,
        };
        // Vẫn vẽ box nếu API trả về box
        if (data.bbox) {
          boxToDraw = { box: data.bbox, name: "Unknown", isRecognized: false };
        }
      }

      setDetections((prev) => [detectionResult, ...prev.slice(0, 4)]); // Giữ 5 log
      setCurrentDetectionBox(boxToDraw); // Lưu box để vẽ

      // Tự động xóa log sau 5 giây
      setTimeout(() => {
        setDetections((prev) => prev.filter((d) => d.id !== newId));
      }, 5000);
    } catch (err: any) {
      showError(err.message || "An error occurred.");
      setCurrentDetectionBox(null); // Xóa box nếu lỗi
    } finally {
      setIsRecognizing(false);
    }
  };

  // Vòng lặp gọi API (thay thế nút "Detect Face")
  useEffect(() => {
    if (!isStreaming) return;

    const intervalId = setInterval(() => {
      handleRecognizeFace();
    }, RECOGNITION_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
    // Phụ thuộc vào `isRecognizing` để đảm bảo loop chạy lại sau khi `finally`
  }, [isStreaming, isRecognizing, employees]);

  // --- 4. LOGIC VẼ BOUNDING BOX ---
  useEffect(() => {
    if (
      !overlayCanvasRef.current ||
      !videoRef.current ||
      !isStreaming
    ) {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Đồng bộ kích thước canvas overlay với kích thước video hiển thị
    const updateCanvasSize = () => {
      if (!videoRef.current || !overlayCanvasRef.current) return;
      overlayCanvasRef.current.width = videoRef.current.clientWidth;
      overlayCanvasRef.current.height = videoRef.current.clientHeight;
    };
    
    updateCanvasSize(); // Cập nhật ngay

    // Xóa toàn bộ canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentDetectionBox) {
      const { box, name, isRecognized } = currentDetectionBox;

      // Tính toán tỉ lệ scale
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;

      // Áp dụng scale vào tọa độ
      const [x1, y1, x2, y2] = [
        box[0] * scaleX,
        box[1] * scaleY,
        box[2] * scaleX,
        box[3] * scaleY,
      ];
      const w = x2 - x1;
      const h = y2 - y1;

      // Vẽ box
      ctx.strokeStyle = isRecognized ? "#00FF00" : "#FF0000"; // Xanh hoặc Đỏ
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, w, h);

      // Vẽ tên
      ctx.fillStyle = isRecognized ? "#00FF00" : "#FF0000";
      ctx.font = "18px Arial";
      const text = `${name} (${
        detections[0]?.accuracy || 0
      }%)`;
      const textY = y1 > 20 ? y1 - 10 : y2 + 20; // Hiển thị trên hoặc dưới box
      ctx.fillText(text, x1, textY);
    }

    // Lắng nghe thay đổi kích thước cửa sổ để vẽ lại
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);

  }, [currentDetectionBox, isStreaming, detections]); // Vẽ lại khi có box mới


  // --- 5. JSX (ĐÃ SỬA) ---
  if (!canUseCamera) {
    // ... (Giữ nguyên JSX báo lỗi quyền)
    return <div>...</div>
  }

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* (Tiêu đề giữ nguyên) */}
        <div className="mb-6">...</div>

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

                {/* Loading/Error (Lớp trên cùng) */}
                {!isStreaming && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-white/30 mx-auto mb-2" />
                      <p className="text-white/60">
                        Camera feed will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas Ẩn (để chụp ảnh) */}
              <canvas ref={captureCanvasRef} className="hidden" />

              {/* Controls (Xóa bỏ Event, Xóa nút Detect) */}
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

                {/* Hiển thị lỗi API */}
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
                      className={`p-3 border rounded-lg animate-in fade-in ${
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