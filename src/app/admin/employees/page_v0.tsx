"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { EmployeeFormDialog } from "@/components/employee-form-dialog-v0";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Mail, Database } from "lucide-react";
import {
  Employee,
  EmployeePublic,
  FaceEmbedding,
  FaceEmbeddingCreate,
  FaceEmbeddingsPublic,
  IUser,
} from "@/types/next-auth";
import { mockEmployees, mockFaceEmbeddings } from "@/utils/mock-data";
import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { toast } from "sonner";

export default function AdminEmployeesPage() {
  const { data: session } = useSession();

  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   if (!session?.user?.access_token) return;

  //   const fetchUsers = async () => {
  //     try {
  //       const res = await sendRequest<IBackendRes<IUser[]>>({
  //         url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/`,
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${session?.user?.access_token}`,
  //         },
  //       });
  //       if (res.data) {
  //         // ánh xạ từ IUser -> Employee
  //         const mappedEmployees: Employee[] = res.data.map((user) => ({
  //           id: user.id,
  //           name: user.full_name, // đổi tên field
  //           email: user.email,
  //           department: user.department,
  //           role: user.role as Employee["role"], // ép kiểu an toàn
  //           avatar: user.avatar, // có thể cập nhật sau nếu backend có trường này
  //         }));

  //         setEmployees(mappedEmployees);
  //       }

  //       console.log(">>> fetched users:", res.data);
  //       console.log(">>> mapped employees:", employees);

  //       mockEmployees.map((emp) => ({
  //         ...emp,
  //         faceEmbeddings: mockFaceEmbeddings.filter((emb) => emb.id === emp.id),
  //       }));
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUsers();
  // }, [session]);

  // const [employees, setEmployees] = useState<Employee[]>(
  //   mockEmployees.map((emp) => ({
  //     ...emp,
  //     faceEmbeddings: mockFaceEmbeddings.filter((emb) => emb.id === emp.id),
  //   }))
  // );

  useEffect(() => {
    if (!session?.user?.access_token) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Lấy danh sách users
        const usersRes = await sendRequest<IBackendRes<IUser[]>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/`,
          method: "GET",
          headers: { Authorization: `Bearer ${session.user.access_token}` },
        });

        if (!usersRes.data) throw new Error("No users");

        const users = usersRes.data;

        // 2. Song song lấy face embeddings cho TẤT CẢ user
        const facePromises = users.map((user) =>
          sendRequest<IBackendRes<FaceEmbeddingsPublic>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/face-recognition/embeddings/${user.id}`,
            method: "GET",
            headers: { Authorization: `Bearer ${session.user.access_token}` },
          }).then((res) => {
            // LOG ĐỂ XEM CẤU TRÚC THỰC TẾ
            // console.log("Full res:", res);
            // console.log("res.data:", res?.data);
            // console.log("Array.isArray(res.data):", Array.isArray(res?.data));

            // TỰ ĐỘNG XỬ LÝ CẢ 2 TRƯỜNG HỢP
            const rawFaces = Array.isArray(res?.data)
              ? res.data
              : res?.data?.data || [];

            // console.log(`User ${user.full_name} has ${rawFaces.length} faces`);

            return {
              userId: user.id,
              faces: rawFaces.map((f: any) => ({
                id: f.id,
                imageUrl: (f.image_url || "")
                  .replace(/\\\\/g, "/")
                  .replace("http://localhost:8000", ""),
                createdAt: new Date(f.created_at),
              })),
            };
          })
        );

        const faceResults = await Promise.all(facePromises);

        // console.log(">>> Face results:", faceResults);

        // 3. Gộp dữ liệu
        // const employees: Employee[] = users.map((user) => {
        //   const faces =
        //     faceResults.find((r) => r.userId === user.id)?.faces || [];

        //   return {
        //     id: user.id,
        //     full_name: user.full_name,
        //     email: user.email,
        //     department: user.department || "Chưa xác định",
        //     role: (user.role.toLowerCase() as Employee["role"]) || "employee",
        //     avatar: user.avatar || undefined,
        //     faceEmbeddings: faces, // chỉ ảnh + ngày
        //   };
        // });

        const employees: EmployeePublic[] = users.map((user) => {
          const faces =
            faceResults.find((r) => r.userId === user.id)?.faces || [];

          return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            department: user.department || "Chưa xác định",
            role: (user.role.toLowerCase() as Employee["role"]) || "employee",
            avatar: user.avatar || undefined,
            faceEmbeddings: faces, // chỉ ảnh + ngày
          };
        });

        setEmployees(employees);
        // console.log("Employees loaded:", employees.length, "người");
      } catch (err) {
        console.error("Lỗi load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pass);
    return pass;
  };

  // const handleSaveEmployee = async (
  //   data: Omit<Employee, "id">,
  //   embeddings?: FaceEmbedding[]
  // ) => {
  //   if (selectedEmployee) {
  //     setEmployees(
  //       employees.map((emp) =>
  //         emp.id === selectedEmployee.id
  //           ? {
  //               ...emp,
  //               ...data,
  //               faceEmbeddings: embeddings || emp.faceEmbeddings,
  //             }
  //           : emp
  //       )
  //     );
  //   } else {
  //     const newEmployee: Employee = {
  //       id: uuidv4(),
  //       full_name: data.full_name,
  //       email: data.email,
  //       department: data.department,
  //       role: data.role,
  //       avatar: data.avatar,
  //       faceEmbeddings: embeddings,
  //     };

  //     const password = generatedPassword || generatePassword();

  //     const payload = {
  //       email: data.email,
  //       full_name: data.full_name,
  //       department: data.department,
  //       role: data.role,
  //       password: password,
  //     };

  //     console.log("New employee added:", newEmployee);
  //     const resCreateUser = await sendRequest<IBackendRes<any>>({
  //       url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
  //       method: "POST",
  //       body: payload,
  //       headers: { Authorization: `Bearer ${session?.user.access_token}` },
  //     });

  //     console.log('>>> Create user response:', resCreateUser);

  //     if (resCreateUser) {
  //       toast.success("Tạo user thành công!");
  //     } else {
  //       toast.error("Tạo user thất bại!");
  //       return;
  //     }

  //     setEmployees([...employees, newEmployee]);
  //   }
  //   setSelectedEmployee(null);
  // };

  const handleSaveEmployee = async (
    data: Omit<Employee, "id">,
    embeddings?: FaceEmbeddingCreate[] // Nhận về FaceEmbeddingCreate
  ) => {
    if (selectedEmployee) {
      // --- LOGIC CẬP NHẬT (EDIT) ---
      // (Bạn cần một endpoint API `PUT/PATCH` cho phần này)
      toast.info("Chức năng cập nhật (Edit) chưa được kết nối API.");

      // Tạm thời chỉ cập nhật state
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id
            ? {
                ...emp,
                ...data,
                // Giữ embedding cũ nếu không upload mới
                faceEmbeddings: embeddings || emp.faceEmbeddings,
              }
            : emp
        )
      );
    } else {
      // --- LOGIC TÊM MỚI (ADD) ---
      const password = generatedPassword || generatePassword();

      // 1. Tách riêng embeddings (vector) và image_urls
      const embeddingsList = embeddings
        ? embeddings.map((emb) => emb.embedding)
        : [];
      const imageUrlsList = embeddings
        ? embeddings.map((emb) => emb.image_url || null)
        : [];

      // 2. Tạo payload GỘP cho backend
      const payload = {
        // Dữ liệu User
        email: data.email,
        full_name: data.full_name,
        department: data.department,
        role: data.role,
        password: password,
        // Dữ liệu Embeddings
        embeddings: embeddingsList,
        image_urls: imageUrlsList,
      };

      console.log(">>> Gửi payload tạo user:", payload);

      try {
        // 3. Gửi 1 request duy nhất đến endpoint MỚI
        const resCreateUser = await sendRequest<IBackendRes<IUser>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/create-user-with-embeddings`, // <-- Sửa URL
          method: "POST",
          body: payload, // <-- Gửi payload đã gộp
          headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        });

        console.log(">>> Create user response:", resCreateUser);

        if (resCreateUser && resCreateUser.data) {
          toast.success("Tạo user và embeddings thành công!");

          // 4. Tạo đối tượng Employee MỚI từ data server trả về
          const newUserFromDB = resCreateUser.data;
          const newEmployee: Employee = {
            id: newUserFromDB.id, // <-- Dùng ID thật từ CSDL
            full_name: newUserFromDB.full_name,
            email: newUserFromDB.email,
            department: newUserFromDB.department || "Chưa xác định",
            role: newUserFromDB.role.toLowerCase() as Employee["role"],
            avatar: data.avatar, // Dùng avatar preview từ form
            faceEmbeddings: embeddings || [], // Dùng embeddings từ form
          };

          // 5. Cập nhật state React
          setEmployees([...employees, newEmployee]);
        } else {
          toast.error(resCreateUser?.message || "Tạo user thất bại!");
          return;
        }
      } catch (error: any) {
        console.error("Lỗi khi tạo user:", error);
        toast.error(`Tạo user thất bại: ${error.message}`);
        return;
      }
    }
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${employeeToDelete}`,
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user.access_token}` },
      });

      // console.log("Delete response:", res);

      // // KIỂM TRA ĐÚNG
      if (res?.message != "User deleted successfully") {
        toast.error("Xóa thất bại!");
        return;
      }

      // CẬP NHẬT STATE ĐÚNG CÁCH
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete));
      toast.success("Xóa thành công!");
    } catch (err) {
      toast.error("Lỗi server");
    } finally {
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleOpenForm = (employee?: Employee) => {
    setSelectedEmployee(employee || null);
    setFormDialogOpen(true);
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button className="gap-2" onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 shrink-0 overflow-hidden border-2 border-white shadow-md">
                      <AvatarImage
                        src={employee.avatar || "/placeholder.svg"}
                        alt={employee.full_name}
                        className="h-full w-full object-cover object-center"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold">
                        {employee.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {employee.full_name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {employee.id}
                        {/* {employee.id.length > 12
                          ? `${employee.id.slice(0, 8)}…${employee.id.slice(-4)}`
                          : employee.id} */}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenForm(employee)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmployee(employee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-primary hover:underline"
                    >
                      {employee.email}
                    </a>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      Face Embeddings:
                    </span>
                    {employee.faceEmbeddings &&
                    employee.faceEmbeddings.length > 0 ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {employee.faceEmbeddings.length} stored
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not set</Badge>
                    )}
                  </div>
                  {employee.faceEmbeddings &&
                    employee.faceEmbeddings.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last updated:{" "}
                        {
                          new Date(employee.faceEmbeddings[0].created_at)
                            .toISOString()
                            .split("T")[0]
                        }
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <EmployeeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        employee={selectedEmployee}
        onSubmit={handleSaveEmployee}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Employee"
        description="Are you sure you want to delete this employee? This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
