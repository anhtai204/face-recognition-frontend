"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  Square,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import * as faceapi from "face-api.js";
import { useSession } from "next-auth/react";

interface AppEvent {
  id: string;
  title: string; // Đổi name -> title cho khớp với DB
  event_type: string;
  department: string | null;
}

interface DetectionResult {
  id: string;
  employeeName: string;
  accuracy: number;
  croppedFaceImage: string;
  timestamp: Date;
  eventName: string;
  isRecognized: boolean;
  message?: string;
}

export default function AdminCameraPage() {
  const { data: session } = useSession(); // Lấy token để gọi API
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const croppedCanvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAiReady, setIsAiReady] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Data State
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Detection State
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<string>("");
  const [currentDetection, setCurrentDetection] =
    useState<faceapi.WithFaceLandmarks<{
      detection: faceapi.FaceDetection;
    }> | null>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);

  const RECOGNITION_INTERVAL = 2000; // 2 seconds

  // Lưu trạng thái đang bận tính toán
  const isDetectingRef = useRef(false);
  // Lưu kết quả detection cuối cùng để vẽ liên tục (tránh nhấp nháy)
  const lastDetectionRef = useRef<any>(null);

  // 1. Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
        ]);
        setIsAiReady(true);
        console.log("AI models loaded successfully");
      } catch (err) {
        console.error("Failed to load AI models:", err);
        setError("Failed to load AI models. Check /public/models folder.");
      }
    };
    loadModels();
  }, []);

  // 2. Fetch Events từ API (Thay thế Mock Data)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Thay URL này bằng endpoint thực tế của bạn
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/events/`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.access_token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setEvents(data.data || []); // Giả sử API trả về { data: [...] }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    if (session?.user?.access_token) {
      fetchEvents();
    }
  }, [session]);

  // 3. Start Camera (Sửa lỗi không chạy)
  const startCamera = async () => {
    console.log("--------------------------------------------------");
    console.log("[Camera Debug] 1. Bắt đầu hàm startCamera");
    setError("");

    // Kiểm tra xem trình duyệt có hỗ trợ mediaDevices không
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error(
        "[Camera Debug] Lỗi: Trình duyệt không hỗ trợ getUserMedia"
      );
      setError("Trình duyệt của bạn không hỗ trợ truy cập Camera.");
      return;
    }

    try {
      console.log("[Camera Debug] 2. Đang yêu cầu quyền truy cập Camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Tắt tiếng để tránh hú
      });

      console.log("[Camera Debug] 3. Đã nhận được Stream:", stream.id);
      console.log("[Camera Debug]    - Active:", stream.active);
      console.log(
        "[Camera Debug]    - Tracks:",
        stream.getVideoTracks().length
      );

      if (videoRef.current) {
        console.log(
          "[Camera Debug] 4. Tìm thấy thẻ <video>, đang gán stream..."
        );

        videoRef.current.srcObject = stream;

        console.log("[Camera Debug] 5. Đang gọi lệnh .play()...");

        await videoRef.current.play();

        console.log("[Camera Debug] 6. Video đang chạy (Playing)!");
        setIsStreaming(true);
      } else {
        console.error(
          "[Camera Debug] Lỗi: videoRef.current là null (Không tìm thấy thẻ video trong DOM)"
        );
        setError("Lỗi giao diện: Không tìm thấy khung hình video.");
      }
    } catch (err: any) {
      console.error("[Camera Debug] --- XẢY RA LỖI ---");
      console.error("Tên lỗi:", err.name);
      console.error("Chi tiết:", err.message);
      console.error("Toàn bộ lỗi:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setError(
          "Bạn đã CHẶN quyền camera. Vui lòng bấm vào biểu tượng ổ khóa trên thanh địa chỉ để mở lại."
        );
      } else if (err.name === "NotFoundError") {
        setError("Không tìm thấy thiết bị Camera nào được kết nối.");
      } else if (err.name === "NotReadableError") {
        setError(
          "Camera đang bị ứng dụng khác (Zoom/Meet/Teams) chiếm dụng. Hãy tắt chúng đi."
        );
      } else {
        setError(`Lỗi không xác định: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsStreaming(false);
      setRecognizedName(null);
    }
  };

  // Helper: Crop ảnh trả về Blob để gửi API
  const getCroppedImageBlob = async (
    detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>
  ): Promise<Blob | null> => {
    if (!videoRef.current || !croppedCanvasRef.current) return null;

    const video = videoRef.current;
    const canvas = croppedCanvasRef.current;
    const { box } = detection.detection;

    canvas.width = box.width;
    canvas.height = box.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      video,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  // Helper: Crop ảnh trả về Base64 để hiển thị UI
  const getCroppedImageBase64 = () => {
    return croppedCanvasRef.current?.toDataURL("image/jpeg") || "";
  };

  // 4. Vòng lặp Vẽ (60fps)
  const drawDetectionBox = async () => {
    // 1. Kiểm tra điều kiện dừng (Tắt stream thì dừng hẳn)
    if (!isStreaming || !videoRef.current) return;

    // 2. Log Debug (Chỉ hiện 1 lần để check, tránh spam console)
    // console.log("Loop is running...");

    // 3. Kiểm tra trạng thái video
    if (
      !isAiReady ||
      videoRef.current.paused ||
      videoRef.current.ended ||
      videoRef.current.videoWidth === 0
    ) {
      // QUAN TRỌNG: Vẫn gọi lại frame tiếp theo để chờ video sẵn sàng
      requestAnimationFrame(drawDetectionBox);
      return;
    }

    try {
      // --- A. PHÁT HIỆN ---
      // Dùng TinyFaceDetectorOptions để nhanh hơn
      const options = new faceapi.TinyFaceDetectorOptions({
        scoreThreshold: 0.5,
        inputSize: 224
      });

      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks(true);

      setCurrentDetection(detection || null);

      // --- B. VẼ ---
      const canvas = overlayCanvasRef.current;
      if (canvas) {
        // Khớp kích thước canvas với video
        const dims = faceapi.matchDimensions(canvas, videoRef.current, true);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Xóa khung cũ
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            // console.log("🔥 ĐÃ TÌM THẤY MẶT!"); // Log này sẽ hiện khi thấy mặt

            const resizedDetection = faceapi.resizeResults(detection, dims);
            const { box } = resizedDetection.detection;

            // Vẽ khung
            const label = recognizedName || "Scanning...";
            const boxColor = recognizedName ? "#00FF00" : "#00BFFF"; // Xanh lá hoặc Xanh dương

            const drawBox = new faceapi.draw.DrawBox(box, {
              label: label,
              boxColor: boxColor,
              lineWidth: 2,
            });
            drawBox.draw(canvas);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi trong vòng lặp AI:", err);
    }

    requestRef.current = requestAnimationFrame(drawDetectionBox);
    // 4. QUAN TRỌNG: Gọi lại chính nó để tạo vòng lặp vô tận
    requestAnimationFrame(drawDetectionBox);
  };

  // 5. Logic Nhận diện (Gọi API thực tế)
  const performRecognition = async () => {
    if (!currentDetection || !selectedEventId || !session?.user?.access_token)
      return;

    setIsRecognizing(true);

    try {
      // A. Lấy ảnh crop dạng Blob
      const imageBlob = await getCroppedImageBlob(currentDetection);
      if (!imageBlob) throw new Error("Failed to capture face image");

      // B. Gửi lên Backend
      const formData = new FormData();
      formData.append("image_file", imageBlob, "capture.jpg");
      // Nếu API nhận diện cần event_id để điểm danh luôn, gửi thêm:
      // formData.append("event_id", selectedEventId)

      // Gọi endpoint nhận diện (Sử dụng endpoint nhận diện qua ảnh crop)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/recognize-crop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      // C. Xử lý kết quả
      const selectedEventObj = events.find((e) => e.id === selectedEventId);
      const eventName = selectedEventObj?.title || "Unknown Event";

      if (res.ok && data.is_recognized) {
        // --- THÀNH CÔNG: Đã nhận diện ---
        const newDetection: DetectionResult = {
          id: crypto.randomUUID(),
          employeeName:
            data.message.replace("Khuôn mặt trùng khớp với user ", "") ||
            "Unknown", // Lấy tên từ message hoặc response
          accuracy: Math.round((data.confidence || 0) * 100),
          croppedFaceImage: getCroppedImageBase64(), // Hiển thị ảnh vừa chụp
          timestamp: new Date(),
          eventName: eventName,
          isRecognized: true,
        };

        setRecognizedName(newDetection.employeeName); // Cập nhật tên lên khung hình
        setDetections((prev) => [newDetection, ...prev].slice(0, 10)); // Lưu log

        // Reset tên sau 3 giây để quét tiếp
        setTimeout(() => setRecognizedName(null), 3000);
      } else {
        // --- THẤT BẠI: Không nhận ra ---
        setRecognizedName("Unknown");
        // Tùy chọn: Có lưu log người lạ không? Nếu có:
        /*
            setDetections(prev => [{
                id: crypto.randomUUID(),
                employeeName: "Unknown",
                accuracy: 0,
                croppedFaceImage: getCroppedImageBase64(),
                timestamp: new Date(),
                eventName: eventName,
                isRecognized: false
            }, ...prev].slice(0, 10))
            */
        setTimeout(() => setRecognizedName(null), 1000);
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setRecognizedName("Error");
    } finally {
      setIsRecognizing(false);
    }
  };

  // Kích hoạt vòng lặp vẽ khi play video
  // useEffect(() => {
  //   if (isStreaming && isAiReady && videoRef.current) {
  //     // Gỡ bỏ listener cũ để tránh memory leak
  //     videoRef.current.removeEventListener("play", drawDetectionBox);
  //     videoRef.current.addEventListener("play", drawDetectionBox);
  //   }
  // }, [isStreaming, isAiReady]);

  const requestRef = useRef<number>(0);
  // --- SỬA LẠI USEEFFECT KÍCH HOẠT ---
  // Kích hoạt vòng lặp vẽ
  useEffect(() => {
    const startLoop = () => {
      if (
        isStreaming &&
        isAiReady &&
        videoRef.current &&
        !videoRef.current.paused
      ) {
        drawDetectionBox();
      }
    };

    // Kích hoạt ngay
    startLoop();

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("play", startLoop);
    }

    return () => {
      if (videoEl) {
        videoEl.removeEventListener("play", startLoop);
      }
      // SỬA LỖI Ở ĐÂY: Hủy frame từ ref
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isStreaming, isAiReady]);

  // Vòng lặp gọi API nhận diện (Mỗi 2 giây)
  useEffect(() => {
    if (!isStreaming || !isAiReady || !selectedEventId) return;

    const interval = setInterval(() => {
      // Chỉ gọi API nếu đang không bận và có phát hiện khuôn mặt
      if (!isRecognizing && currentDetection) {
        performRecognition();
      }
    }, RECOGNITION_INTERVAL);

    return () => clearInterval(interval);
  }, [
    isStreaming,
    isAiReady,
    selectedEventId,
    currentDetection,
    isRecognizing,
  ]);

  return (
    <main className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Camera Attendance
          </h1>
          <p className="text-foreground/60">
            Real-time facial recognition system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI: CAMERA */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-black relative aspect-video">
                {/* 1. LUÔN RENDER VIDEO (Sửa class để ẩn/hiện) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  // Nếu đang stream thì hiện, không thì ẩn (hidden)
                  className={`w-full h-full object-cover ${
                    isStreaming ? "block" : "hidden"
                  }`}
                />

                {/* 2. HIỂN THỊ PLACEHOLDER KHI KHÔNG STREAM */}
                {!isStreaming && (
                  <div className="w-full h-full flex items-center justify-center absolute top-0 left-0">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
                      <p className="text-foreground/60">
                        Camera feed will appear here
                      </p>
                    </div>
                  </div>
                )}

                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                <canvas ref={croppedCanvasRef} className="hidden" />

                {/* Canvas ẩn để crop ảnh */}
                <canvas ref={croppedCanvasRef} className="hidden" />

                {!isAiReady && isStreaming && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <p className="text-white ml-2">Loading AI models...</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-4">
                {/* Dropdown chọn sự kiện */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Event for Attendance
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                    disabled={events.length === 0}
                  >
                    <option value="">-- Choose an event --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.event_type}){" "}
                        {event.department
                          ? `- ${event.department}`
                          : "- All Company"}
                      </option>
                    ))}
                  </select>
                  {events.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No events found. Please create an event first.
                    </p>
                  )}
                </div>

                {/* Nút điều khiển */}
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

                {/* Cảnh báo */}
                {!selectedEventId && isStreaming && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-600 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Please select an event to start processing attendance.
                    </span>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ NHẬN DIỆN */}
          <div>
            <Card className="p-4 h-full flex flex-col">
              <h2 className="font-bold text-foreground mb-4">
                Recent Detections
              </h2>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {detections.length === 0 ? (
                  <p className="text-foreground/60 text-sm text-center py-8">
                    {isStreaming && selectedEventId
                      ? "Scanning for registered faces..."
                      : "Waiting to start..."}
                  </p>
                ) : (
                  detections.map((detection) => (
                    <div
                      key={detection.id}
                      className={`p-3 border rounded-lg overflow-hidden ${
                        detection.isRecognized
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      {detection.croppedFaceImage && (
                        <img
                          src={detection.croppedFaceImage}
                          alt="Face"
                          className="w-full h-24 object-contain bg-black/20 rounded mb-2"
                        />
                      )}

                      <div className="flex items-start gap-2">
                        {detection.isRecognized ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <User className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">
                            {detection.employeeName}
                          </p>
                          <p className="text-xs text-foreground/60 mt-1">
                            Event: {detection.eventName}
                          </p>
                          <div className="flex justify-between items-center mt-2">
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
    </main>
  );
}
