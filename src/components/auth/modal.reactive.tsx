"use client";

import { useEffect, useState } from "react";
import { UserIcon, CheckCircle2Icon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendRequest } from "@/utils/api";
import { useHasMounted } from "@/utils/customHook";
import { toast } from "sonner";
// import { ProgressSteps } from "../ui/progress-steps";

interface ModalReactiveProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  userEmail?: string;
}

interface IBackendRes<T> {
  data?: T;
  error?: string;
  message?: string;
}

const STEPS = [
  {
    icon: <MailIcon className="h-5 w-5" />,
    label: "Email",
  },
  {
    icon: <UserIcon className="h-5 w-5" />,
    label: "Verification",
  },
  {
    icon: <CheckCircle2Icon className="h-5 w-5" />,
    label: "Done",
  },
];

const ModalReactive = ({
  isModalOpen,
  setIsModalOpen,
  userEmail = "",
}: ModalReactiveProps) => {
  const [current, setCurrent] = useState(0);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [code, setCode] = useState("");

  const hasMounted = useHasMounted();

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  if (!hasMounted) return null;

  const onFinishStep0 = async () => {
    if (!email) {
      toast("Vui lòng nhập email của bạn");
      return;
    }

    console.log('>>>check email: ', email);

    const res = await sendRequest<IBackendRes<any>>({
      method: "POST",
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/retry-active`,
      body: {
        email,
      },
    });

    if (res?.data) {
      setUserId(res?.data?.id);
      setCurrent(1);
    } else {
      toast(res?.error || "Đã xảy ra lỗi");
    }
  };

  const onFinishStep1 = async () => {
    if (!code) {
      toast("Vui lòng nhập mã xác thực");
      return;
    }

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/check-code`,
        method: "POST",
        body: {
          id: userId,
          code,
        },
      });

      if (res?.data) {
        setCurrent(2);
      } else {
        toast(res?.error || "Mã xác thực không hợp lệ");
      }
    } catch (error) {
      toast("Đã xảy ra lỗi khi gửi yêu cầu");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // Reset form after animation completes
    setTimeout(() => {
      setCurrent(0);
      setCode("");
      // Don't reset email if it was provided as a prop
      if (!userEmail) {
        setEmail("");
      }
    }, 300);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Kích hoạt tài khoản
          </DialogTitle>
          {/* <ProgressSteps currentStep={current} steps={STEPS} /> */}
        </DialogHeader>

        <div className="mt-6">
          {current === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tài khoản của bạn chưa được kích hoạt. Vui lòng nhập email để
                nhận mã kích hoạt.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!userEmail}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={onFinishStep0}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600"
                >
                  Gửi lại
                </Button>
              </div>
            </div>
          )}

          {current === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vui lòng nhập mã xác nhận đã được gửi đến email của bạn.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code">Mã xác thực</Label>
                <Input
                  id="code"
                  placeholder="Nhập mã xác thực"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={onFinishStep1}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600"
                >
                  Kích hoạt
                </Button>
              </div>
            </div>
          )}

          {current === 2 && (
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle2Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <p className="text-center text-gray-600 dark:text-gray-300">
                Tài khoản của bạn đã được kích hoạt thành công. Vui lòng đăng
                nhập lại!
              </p>

              <div className="flex justify-center">
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalReactive;
