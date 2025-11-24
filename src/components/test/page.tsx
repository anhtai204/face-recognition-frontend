"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<{ name: string; score: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  async function captureAndSend() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    if (!blob) return;

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const res = await fetch("http://localhost:8000/recognize/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult({ name: data.name, score: data.score });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(captureAndSend, 1500); // gửi mỗi 1.5s
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <Card className="w-[600px] mx-auto mt-8 p-4">
      <CardContent className="flex flex-col items-center space-y-4">
        <video ref={videoRef} autoPlay className="rounded-xl border w-[560px]" />
        <div className="flex space-x-2">
          <Button onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? "Dừng nhận diện" : "Bắt đầu nhận diện"}
          </Button>
        </div>
        {result && (
          <div className="text-center mt-4">
            <p className="text-lg font-semibold">
              {result.name === "Không xác định"
                ? "❌ Không xác định"
                : `✅ ${result.name}`}
            </p>
            <p className="text-sm text-gray-500">
              Độ tương đồng: {(result.score * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
