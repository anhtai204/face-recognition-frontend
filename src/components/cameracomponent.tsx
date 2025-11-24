"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CameraComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  // Hàm mở camera
  const startCamera = async () => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setError(err.message);
      }
    } else {
      setError("Trình duyệt không hỗ trợ camera API");
    }
  };

  // Hàm tắt camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Tự động mở camera khi component mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-80 h-60 object-cover rounded-md border"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Bật camera
        </button>
        <button
          onClick={stopCamera}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Tắt camera
        </button>
      </div>
    </div>
  );
}
