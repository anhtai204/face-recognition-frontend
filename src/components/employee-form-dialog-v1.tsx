"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiImageUpload } from "@/components/multi-image-upload";
import {
  generateFaceEmbedding,
  checkEmbeddingConsistency,
} from "@/lib/face-embedding-utils";
import type {
  Employee,
  EmployeePublic,
  FaceEmbedding,
  FaceEmbeddingCreate,
} from "@/types/next-auth";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeePublic | null;
  // onSubmit: (data: Omit<Employee, "id">, embeddings?: FaceEmbedding[]) => void;
  onSubmit: (
    data: Omit<Employee, "id" | "faceEmbeddings">,
    embeddings?: FaceEmbeddingCreate[]
  ) => void;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
}: EmployeeFormDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"employee" | "supervisor" | "admin">(
    "employee"
  );
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<
    "idle" | "processing" | "warning" | "success" | "error"
  >("idle");
  const [embeddingMessage, setEmbeddingMessage] = useState("");
  const [generatedEmbeddings, setGeneratedEmbeddings] = useState<
    FaceEmbeddingCreate[]
  >([]);
  const [consistencyCheck, setConsistencyCheck] = useState<{
    isConsistent: boolean;
    averageSimilarity: number;
    message: string;
  } | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.full_name);
      setRole(employee.role);
      setEmail(employee.email);
      setDepartment(employee.department);
      const existingEmbeddings: FaceEmbeddingCreate[] = employee.faceEmbeddings
        ? employee.faceEmbeddings.map((f) => ({
            id: f.id,
            user_id: employee.id, // Thêm user_id
            embedding: [], // Mock embedding rỗng
            image_url: f.image_url,
            created_at: f.created_at,
          }))
        : [];
      setGeneratedEmbeddings(existingEmbeddings);
    } else {
      setName("");
      setRole("employee");
      setEmail("");
      setDepartment("");
      setGeneratedEmbeddings([]);
    }
    setUploadedImages([]);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
    setAwaitingConfirmation(false);
  }, [employee, open]);

  const handleImagesSelect = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log(">>> Selected images: ", images);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
    setGeneratedEmbeddings([]);
  };

  const handleConfirmAndProcess = async () => {
    if (uploadedImages.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    setIsProcessing(true);
    setEmbeddingStatus("processing");
    setEmbeddingMessage(`Processing ${uploadedImages.length} image(s)...`);

    try {
      const formData = new FormData();
      uploadedImages.forEach((img) => formData.append("files", img.file));
      formData.append("username", name || "guest");

      console.log(">>> Kiểm tra nội dung FormData:");
      for (const [key, value] of formData.entries()) {
        console.log(key, ":", value);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/extract-embeddings`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      // if (!res.ok) {
      //   console.error("Lỗi từ server:", data);
      //   setEmbeddingStatus("error");
      //   setEmbeddingMessage(data.detail || "Failed to extract embeddings");
      //   return;
      // }

      console.log(">>> Kiểm tra response từ server:", res.ok);

      // if (!res.ok) {
      //   console.error("Lỗi từ server:", data);

      //   // Sửa: Ưu tiên 'reason' (lỗi nghiệp vụ), sau đó 'detail' (lỗi FastAPI)
      //   const errorMessage =
      //     data.reason || "Failed to extract embeddings";

      //   setEmbeddingStatus("error"); // Set là "error"
      //   setEmbeddingMessage(`⚠️ ${errorMessage}`); // Hiển thị lỗi nghiệp vụ

      //   // (Tùy chọn) Cập nhật state nếu có thông tin
      //   if (data.reason) {
      //     setConsistencyCheck({
      //       isConsistent: false,
      //       averageSimilarity: data.average_similarity || 0,
      //       message: data.reason,
      //     });
      //   }
      //   return; // Dừng lại
      // }

      if (data.status === "fail" || data.isConsistent === false) {
        console.warn("Lỗi Logic nghiệp vụ (ảnh không nhất quán):", data);

        // ⬇️ --- ĐÂY LÀ CÂU TRẢ LỜI CHO BẠN --- ⬇️
        // Hiển thị 'reason' từ response lỗi
        setEmbeddingStatus("warning");
        setEmbeddingMessage(`⚠️ ${data.reason || "Images are inconsistent"}`);
        // ⬆️ --- KẾT THÚC --- ⬆️

        setConsistencyCheck({
          isConsistent: false,
          averageSimilarity: data.average_similarity || 0,
          message: data.reason || "Inconsistent",
        });
        return; // Dừng lại (Rất quan trọng, để không chạy code 'success')
      }

      console.log(">>> Embedding extraction response data:", data);
      console.log(
        ">>> Embedding extraction response data status:",
        data.status
      );

      // === 1. SỬA LỖI LOGIC TẠI ĐÂY ===
      // 1. Tạo biến tạm để giữ dữ liệu mới
      const newEmbeddings = data.embeddings.map(
        (emb: number[], index: number) => ({
          id: uuidv4(),
          user_id: employee?.id || "", // ID user (nếu edit) hoặc rỗng
          embedding: emb,
          image_url: data?.image_urls[index] || null, // Dùng snake_case
          created_at: new Date(), // Dùng snake_case
        })
      );

      // 2. Log chính biến tạm đó
      console.log(">>> Dữ liệu sẽ được set: ", newEmbeddings);

      // 3. Set state
      setGeneratedEmbeddings(newEmbeddings);
      // ==================================

      setConsistencyCheck({
        isConsistent: data.isConsistent,
        averageSimilarity: data.averageSimilarity,
        message: data.isConsistent
          ? "All photos verified as same person"
          : "Uploaded images appear to be different people",
      });

      setEmbeddingStatus(data.isConsistent ? "success" : "warning");
      setEmbeddingMessage(
        data.isConsistent
          ? "✓ Face embeddings extracted successfully"
          : "⚠️ Uploaded images are inconsistent!"
      );
    } catch (err) {
      console.error(err);
      setEmbeddingStatus("error");
      setEmbeddingMessage("Failed to process images");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEmbeddings = () => {
    // setAwaitingConfirmation(false);
    setEmbeddingStatus("success"); // Coi như "success" để cho phép submit
    setEmbeddingMessage("Warning accepted. Ready to save.");
  };

  const handleRejectEmbeddings = () => {
    setGeneratedEmbeddings([]);
    setUploadedImages([]);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
    // setAwaitingConfirmation(false);
  };

  const handleSubmit = () => {
    if (!name || !email || !department || !role) {
      alert("Please fill in all fields");
      return;
    }

    const embeddings =
      generatedEmbeddings.length > 0 ? generatedEmbeddings : undefined;

    onSubmit(
      {
        full_name: name,
        role,
        email,
        department,
        avatar: uploadedImages[0]?.preview || employee?.avatar || "", // Giữ avatar cũ
      },
      embeddings
    );

    onOpenChange(false);
  };
  // console.log(">>> awaitingConfirmation: ", awaitingConfirmation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) =>
                setRole(value as "employee" | "supervisor" | "admin")
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Face Images for Embedding</Label>
            <p className="text-xs text-muted-foreground">
              Upload multiple clear face photos to create accurate face
              embeddings. Same person from different angles works best (max 5
              images).
            </p>
            <MultiImageUpload
              onImagesSelect={handleImagesSelect}
              disabled={isProcessing}
              maxImages={5}
            />

            {embeddingMessage && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm whitespace-pre-line ${
                  embeddingStatus === "success"
                    ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                    : embeddingStatus === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                    : embeddingStatus === "error"
                    ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                    : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mt-0.5 animate-spin flex-shrink-0" />
                ) : embeddingStatus === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : embeddingStatus === "warning" ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{embeddingMessage}</span>
              </div>
            )}

            {uploadedImages.length > 0 && embeddingStatus === "idle" && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRejectEmbeddings}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Change Images
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmAndProcess}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm & Process Images"
                  )}
                </Button>
              </div>
            )}

            {/* Trạng thái 2: Hiển thị KHI CÓ CẢNH BÁO (sau khi đã xử lý)
  (Phần này giữ nguyên logic cũ của bạn)
*/}
            {embeddingStatus === "warning" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRejectEmbeddings}
                  disabled={isProcessing}
                >
                  Discard & Re-upload
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmEmbeddings} // Nút này để "chấp nhận rủi ro"
                  disabled={isProcessing}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  Continue Anyway
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              (uploadedImages.length > 0 && !generatedEmbeddings.length)
            }
          >
            {employee ? "Update" : "Add"} Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
