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
import { SavedImagesGallery } from "./saved-images-gallery";
import { toast } from "sonner";
import { ConfirmDialog } from "./confirm-dialog";

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
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const [initialData, setInitialData] = useState({
    name: "",
    employeeId: "",
    email: "",
    department: "",
  });

  useEffect(() => {
    if (employee) {
      setName(employee.full_name);
      setRole(employee.role);
      setEmail(employee.email);
      setDepartment(employee.department);
      const existingEmbeddings: FaceEmbeddingCreate[] = employee.faceEmbeddings
        ? employee.faceEmbeddings.map((f) => ({
            id: f.id,
            user_id: employee.id,
            embedding: [],
            image_url: f.image_url,
            created_at: f.created_at,
          }))
        : [];
      setGeneratedEmbeddings(existingEmbeddings);
      setInitialData({
        name: employee.full_name,
        employeeId: employee.id,
        email: employee.email,
        department: employee.department,
      });
    } else {
      setName("");
      setRole("employee");
      setEmail("");
      setDepartment("");
      setGeneratedEmbeddings([]);
      setInitialData({
        name: "",
        employeeId: "",
        email: "",
        department: "",
      });
    }
    setUploadedImages([]);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
    setAwaitingConfirmation(false);
    setShowUploadSection(!employee);
  }, [employee, open]);

  const hasChanges = () => {
    return (
      name !== initialData.name ||
      email !== initialData.email ||
      department !== initialData.department ||
      uploadedImages.length > 0 ||
      embeddingStatus === "success"
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges()) {
      setShowConfirmClose(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onOpenChange(false);
  };

  const handleImagesSelect = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log(">>> Selected images: ", images);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
    if (!employee) {
      setGeneratedEmbeddings([]);
    }
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
      // 1. Chuẩn bị FormData (chung cho cả hai)
      const formData = new FormData();
      uploadedImages.forEach((img) => formData.append("files", img.file));
      formData.append("username", name || "guest"); // Dùng tên từ form

      let apiUrl = "";
      // Khởi tạo các tùy chọn cho 'fetch'
      const fetchOptions: RequestInit = {
        method: "POST",
        body: formData,
        headers: {}, // Sẽ thêm header nếu cần
      };

      // --- ⬇️ LOGIC MỚI: CHỌN API TÙY THEO CHẾ ĐỘ ⬇️ ---

      if (employee) {
        // 2a. CHẾ ĐỘ "EDIT" (Cập nhật user đã có)
        // API này YÊU CẦU 'user_id' và 'Authorization'

        apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/update-user-embeddings`;

        // Thêm user_id vào form
        formData.append("user_id", employee.id);

        // Thêm Authorization header (để sửa lỗi 401)
        if (session?.user?.access_token) {
          (fetchOptions.headers as Record<string, string>)[
            "Authorization"
          ] = `Bearer ${session.user.access_token}`;
        }
      } else {
        // 2b. CHẾ ĐỘ "ADD" (Tạo user mới)
        // API này (theo code gốc) KHÔNG cần 'user_id' hoặc 'Authorization'

        apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/extract-embeddings`;
      }

      // --- ⬆️ KẾT THÚC LOGIC MỚI ⬆️ ---

      console.log(">>> Calling API:", apiUrl);

      // 3. Gọi API (dùng apiUrl và fetchOptions đã định nghĩa)
      const res = await fetch(apiUrl, fetchOptions);

      const data = await res.json();
      console.log(">>> Kiểm tra response từ server:", res);

      // 4. Xử lý Response (Logic này dùng chung cho cả 2 API
      //    vì cả hai đều trả về { status: "fail", ... } khi lỗi)
      if (data.status === "fail" || data.isConsistent === false) {
        console.warn("Lỗi Logic nghiệp vụ (ảnh không nhất quán):", data);

        setEmbeddingStatus("warning");
        setEmbeddingMessage(`⚠️ ${data.reason || "Images are inconsistent"}`);

        setConsistencyCheck({
          isConsistent: false,
          averageSimilarity: data.average_similarity || 0,
          message: data.reason || "Inconsistent",
        });
        return;
      }

      // 5. Xử lý khi thành công (Dùng chung cho cả 2 API)
      console.log(">>> Embedding extraction response data:", data);

      const newEmbeddings = data.embeddings.map(
        (emb: number[], index: number) => ({
          id: uuidv4(),
          user_id: employee?.id || "", // Gán ID nếu là 'edit'
          embedding: emb,
          image_url: data?.image_urls[index] || null,
          created_at: new Date(),
        })
      );

      // console.log(">>> Dữ liệu sẽ được set: ", newEmbeddings);
      // setGeneratedEmbeddings(newEmbeddings);

      console.log(">>> Dữ liệu MỚI sẽ được THÊM: ", newEmbeddings);

      // SỬA LỖI: Không ghi đè, mà NỐI MẢNG
      // Lấy state cũ (prevEmbeddings, chứa ảnh cũ) và thêm ảnh mới vào
      setGeneratedEmbeddings((prevEmbeddings) => [
        ...prevEmbeddings,
        ...newEmbeddings,
      ]);

      setConsistencyCheck({
        isConsistent: data.isConsistent,
        averageSimilarity: data.averageSimilarity, // (API "Add" không có, sẽ là undefined)
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
    } catch (err: any) {
      console.error(err);
      setEmbeddingStatus("error");
      // Cố gắng đọc lỗi từ server (ví dụ: 401, 403)
      let detail = "Failed to process images";
      if (err.response) {
        try {
          const errorData = await err.response.json();
          detail = errorData.detail || detail;
        } catch (e) {
          // Bỏ qua nếu không parse được json
        }
      } else if (err.message) {
        detail = err.message;
      }
      setEmbeddingMessage(`Error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEmbeddings = () => {
    setEmbeddingStatus("success");
    setEmbeddingMessage("Warning accepted. Ready to save.");
  };

  const handleRejectEmbeddings = () => {
    setGeneratedEmbeddings([]);
    // setGeneratedEmbeddings(employee?.faceEmbeddings || []);
    setUploadedImages([]);
    setEmbeddingStatus("idle");
    setEmbeddingMessage("");
    setConsistencyCheck(null);
  };

  const handleRemoveImage = async (imageId: string) => {
    console.log(">>> Removing image with ID:", imageId);
    console.log(">>> Current user id is:", employee?.id);
    const updatedEmbeddings = generatedEmbeddings.filter(
      (emb) => emb.id !== imageId
    );

    const resDeleteEmbeddings = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/embeddings/${employee?.id}/${imageId}`,
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.user?.access_token}` },
    });

    if (resDeleteEmbeddings.message) {
      toast.success("Deleted embedding successfully");
    }

    setGeneratedEmbeddings(updatedEmbeddings);
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
        avatar: uploadedImages[0]?.preview || employee?.avatar || "",
      },
      embeddings
    );

    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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

            {employee && generatedEmbeddings.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <SavedImagesGallery
                  images={generatedEmbeddings}
                  onRemoveImage={handleRemoveImage}
                  onAddNewImages={() => setShowUploadSection(true)}
                />
              </div>
            )}

            {employee && (
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="w-full"
                >
                  {showUploadSection ? "Hide Upload" : "Update Face Images"}
                </Button>
              </div>
            )}

            {(showUploadSection || !employee) && (
              <div className="space-y-2 border-t pt-4">
                <Label>Face Images for Embedding</Label>
                <p className="text-xs text-muted-foreground">
                  Upload multiple clear face photos to create accurate face
                  embeddings. Same person from different angles works best (max
                  5 images).
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
                      onClick={handleConfirmEmbeddings}
                      disabled={isProcessing}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      Continue Anyway
                    </Button>
                  </div>
                )}
              </div>
            )}
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

      <ConfirmDialog
        open={showConfirmClose}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to close without saving?"
        onConfirm={handleConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </>
  );
}
