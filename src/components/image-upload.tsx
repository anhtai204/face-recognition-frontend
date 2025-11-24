"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void
  onRemove?: () => void
  preview?: string
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, onRemove, preview, disabled = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageSelect(file, result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0])
            }
          }}
          disabled={disabled}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-3">
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg mx-auto"
            />
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm">Image selected</span>
            </div>
          </div>
        ) : (
          <div onClick={() => !disabled && fileInputRef.current?.click()} className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {preview && onRemove && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="w-full bg-transparent"
        >
          <X className="w-4 h-4 mr-2" />
          Remove Image
        </Button>
      )}
    </div>
  )
}
