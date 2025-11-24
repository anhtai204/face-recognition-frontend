// "use client";

// import { useState } from "react";
// import { UserIcon, CheckCircle2Icon, MailIcon } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// // import { ProgressSteps } from "../ui/progress-steps";
// import { toast } from "sonner";
// import { sendRequest } from "@/utils/api";

// interface ForgotPasswordModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const STEPS = [
//   {
//     icon: <MailIcon className="w-5 h-5" />,
//     label: "Email",
//   },
//   {
//     icon: <UserIcon className="w-5 h-5" />,
//     label: "Verification",
//   },
//   {
//     icon: <CheckCircle2Icon className="w-5 h-5" />,
//     label: "Done",
//   },
// ];

// const ModalChangePassword = (props: any) => {
//   const { isModalOpen, setIsModalOpen } = props;
//   const [currentStep, setCurrentStep] = useState(0);
//   const [userEmail, setUserEmail] = useState("");
//   const [code, setCode] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const handleSubmitEmail = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const res = await sendRequest<IBackendRes<any>>({
//       url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/password-recovery`,
//       method: "POST",
//       body: { email: userEmail },
//     });

//     console.log(">>>userEmail: ", userEmail);
//     console.log(">>> check res: ", res?.data);

//     if (res?.data) {
//       setUserEmail(res?.data?.email);
//       setCurrentStep(1);
//     } else {
//       toast(`${res?.message}`);
//     }
//   };

//   const handleSubmitVerification = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!code || !newPassword || !confirmPassword) {
//       toast("Vui lòng điền đầy đủ thông tin");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       toast("Mật khẩu xác nhận không khớp");
//       return;
//     }

//     const res = await sendRequest<IBackendRes<any>>({
//       url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/change-password`,
//       method: "POST",
//       body: {
//         code: code,
//         password: newPassword,
//         confirmPassword: confirmPassword,
//         email: userEmail,
//       },
//     });

//     console.log(">>> check code: ", code);
//     console.log(">>> check res: ", res?.data);

//     if (res?.data) {
//       setCurrentStep(2);
//     } else {
//       toast(res?.message);
//     }
//   };

//   const handleClose = () => {
//     setIsModalOpen(false);
//     // Reset form after animation completes
//     setTimeout(() => {
//       setCurrentStep(0);
//       setUserEmail("");
//       setCode("");
//       setNewPassword("");
//       setConfirmPassword("");
//     }, 300);
//   };

//   return (
//     <Dialog open={isModalOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-xl">Quên mật khẩu</DialogTitle>
//           </div>
//         </DialogHeader>

//         {/* <ProgressSteps currentStep={currentStep} steps={STEPS} /> */}

//         <div className="mt-6">
//           {currentStep === 0 && (
//             <form onSubmit={handleSubmitEmail} className="space-y-4">
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 Để thực hiện thay đổi mật khẩu, vui lòng nhập email tài khoản
//                 của bạn.
//               </p>
//               <div className="space-y-2">
//                 <Input
//                   type="email"
//                   placeholder="Nhập email của bạn"
//                   value={userEmail}
//                   onChange={(e) => setUserEmail(e.target.value)}
//                   className="w-full"
//                 />
//               </div>
//               <div className="flex justify-end">
//                 <Button type="submit">Submit</Button>
//               </div>
//             </form>
//           )}

//           {currentStep === 1 && (
//             <form onSubmit={handleSubmitVerification} className="space-y-4">
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 Vui lòng thực hiện đổi mật khẩu
//               </p>
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Code <span className="text-red-500">*</span>
//                   </label>
//                   <Input
//                     placeholder="Nhập mã xác thực"
//                     value={code}
//                     onChange={(e) => setCode(e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Mật khẩu mới <span className="text-red-500">*</span>
//                   </label>
//                   <Input
//                     type="password"
//                     placeholder="Nhập mật khẩu mới"
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Xác nhận mật khẩu <span className="text-red-500">*</span>
//                   </label>
//                   <Input
//                     type="password"
//                     placeholder="Xác nhận mật khẩu mới"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end">
//                 <Button type="submit">Confirm</Button>
//               </div>
//             </form>
//           )}

//           {currentStep === 2 && (
//             <div className="text-center space-y-4">
//               <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
//                 <CheckCircle2Icon className="w-6 h-6 text-green-600 dark:text-green-300" />
//               </div>
//               <div className="space-y-2">
//                 <h3 className="text-lg font-medium">Thành công!</h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">
//                   Mật khẩu của bạn đã được thay đổi thành công.
//                 </p>
//               </div>
//               <Button onClick={handleClose}>Đóng</Button>
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default ModalChangePassword;

"use client";

import { useState } from "react";
import { MailIcon, CheckCircle2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { sendRequest } from "@/utils/api";

const ModalChangePassword = (props: any) => {
  const { isModalOpen, setIsModalOpen } = props;
  const [userEmail, setUserEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast("Vui lòng nhập email");
      return;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/password-recovery/${userEmail}`,
      method: "POST",
    });

    console.log(">>> userEmail:", userEmail);
    console.log(">>> response:", res);

    if (res?.statusCode === 200 || res?.message) {
      setEmailSent(true);
      toast("Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.");
    } else {
      toast(res?.message || "Gửi email thất bại. Vui lòng thử lại.");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setUserEmail("");
      setEmailSent(false);
    }, 300);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Quên mật khẩu
          </DialogTitle>
        </DialogHeader>

        {!emailSent ? (
          <form onSubmit={handleSubmitEmail} className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vui lòng nhập email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
            <Input
              type="email"
              placeholder="Nhập email của bạn"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end">
              <Button type="submit">Gửi yêu cầu</Button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4 py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2Icon className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Đã gửi email!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email khôi phục mật khẩu đã được gửi đến địa chỉ{" "}
                <strong>{userEmail}</strong>. Vui lòng kiểm tra hộp thư để đặt
                lại mật khẩu.
              </p>
            </div>
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalChangePassword;
