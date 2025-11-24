"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

interface MultiImageUploadProps {
  onImagesSelect: (images: UploadedImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiImageUpload({
  onImagesSelect,
  disabled = false,
  maxImages = 5,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Gọi callback khi danh sách ảnh thay đổi, an toàn hơn
  useEffect(() => {
    onImagesSelect(uploadedImages);
  }, [uploadedImages]);

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    const filesToAdd = newFiles.slice(0, maxImages - uploadedImages.length);

    filesToAdd.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const newImage: UploadedImage = {
            id: `img-${Date.now()}-${Math.random()}`,
            file,
            preview,
            status: "pending",
          };
          // ✅ chỉ set state, không gọi callback trong đây nữa
          setUploadedImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const canAddMore = uploadedImages.length < maxImages;

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-600"
        } ${
          disabled || !canAddMore
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
          disabled={disabled || !canAddMore}
          className="hidden"
        />

        <div
          onClick={() =>
            canAddMore && !disabled ? fileInputRef.current?.click() : null
          }
          className="space-y-2"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {uploadedImages.length}/{maxImages} images uploaded
            </p>
          </div>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {uploadedImages.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.preview || "/placeholder.svg"}
                alt="Uploaded"
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeImage(image.id)}
                disabled={disabled}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
