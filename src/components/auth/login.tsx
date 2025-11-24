"use client";

import { useRouter } from "next/navigation";
import { authenticate } from "@/utils/action";
import ModalReactive from "./modal.reactive";
import ModalChangePassword from "./modal.change.pasword";
import { auth } from "@/auth";
import { getSession } from "next-auth/react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// import ai6 from "../../assets/images/ai6.png";

const Login = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { email, password } = formValues;
    setUserEmail("");
    // trigger sign-in
    const res = await authenticate(email, password);

    console.log(">>>res: ", res);

    if (res?.error) {
      // Inactive Account
      if (res?.code === 2) {
        // router.push('/verify');
        setIsModalOpen(true);
        setUserEmail(email);
        return;
      }
      // error
      toast("Login Failed");
    } else {
      const session = await getSession();
      const role = session?.user?.role;
      // const role = session?.user?.role;
      // console.log('>>>role: ', role);

      console.log(">>>session: ", session);
      console.log(">>>role: ", role);

      if (role === "admin") {
        router.push(`/${role}/dashboard`);
      } else if (role === "supervisor") {
        router.push(`/${role}/dashboard`);
      } else {
        // router.push(`/kiosk`);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white dark:from-purple-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="p-8 flex flex-col">
            <div className="flex-1">
              <Link href="/" className="flex items-center mb-12">
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-400 bg-clip-text text-transparent">
                  ITRAN EDU
                </span>
              </Link>
              <div className="space-y-4 max-w-md">
                <h1 className="text-4xl font-bold text-indigo-900 dark:text-indigo-100">
                  Welcome Back
                </h1>
                {/* <p className="text-gray-600 dark:text-gray-300">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Sign Up
                  </Link>
                </p> */}
              </div>
              <div className="relative mt-12 lg:mt-16">
                {/* <Image
                  src={ai6}
                  alt="Login illustration"
                  width={500}
                  height={400}
                  className="w-full max-w-lg mx-auto rounded-xl"
                  priority
                /> */}
              </div>
            </div>
            <div className="mt-auto">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-400 w-8 h-8 text-white">
                  <span className="text-xs">?</span>
                </div>
                <p>Need help? Contact our support team</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
            <form className="max-w-md mx-auto space-y-6" onSubmit={onFinish}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <Input
                    required
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="h-12 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <Link
                      href="#"
                      onClick={() => setChangePassword(true)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      required
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      value={formValues.password}
                      onChange={handleChange}
                      className="h-12 rounded-xl pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    className="dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-purple-600 dark:checked:border-purple-600"
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-600 dark:text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600"
              >
                Sign In
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="dark:bg-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                    Or Continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="w-5 h-5"
                  >
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="w-5 h-5"
                  >
                    <path
                      fill="currentColor"
                      d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="w-5 h-5"
                  >
                    <path
                      fill="currentColor"
                      d="M16.36 14.44C15.61 13.7 14.63 13.28 13.54 13.28C12.46 13.28 11.46 13.7 10.7 14.44C9.94 15.18 9.5 16.16 9.5 17.23C9.5 18.3 9.92 19.28 10.7 20.02C11.46 20.76 12.46 21.18 13.54 21.18C14.63 21.18 15.61 20.76 16.36 20.02C17.12 19.28 17.54 18.3 17.54 17.23C17.54 16.16 17.12 15.18 16.36 14.44Z"
                    />
                    <path
                      fill="currentColor"
                      d="M16.36 14.44C15.61 13.7 14.63 13.28 13.54 13.28C12.46 13.28 11.46 13.7 10.7 14.44C9.94 15.18 9.5 16.16 9.5 17.23C9.5 18.3 9.92 19.28 10.7 20.02C11.46 20.76 12.46 21.18 13.54 21.18C14.63 21.18 15.61 20.76 16.36 20.02C17.12 19.28 17.54 18.3 17.54 17.23C17.54 16.16 17.12 15.18 16.36 14.44Z"
                    />
                    <path
                      fill="currentColor"
                      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM13.54 4.18C11.92 4.18 10.37 4.68 9.05 5.6C7.73 6.52 6.72 7.82 6.17 9.32C5.62 10.82 5.57 12.44 6.03 13.96C6.48 15.48 7.41 16.82 8.68 17.77C7.76 17.37 7.08 16.57 6.84 15.6C6.6 14.63 6.83 13.63 7.44 12.85C6.74 12.85 6.12 12.45 5.84 11.82C5.56 11.18 5.68 10.46 6.14 9.95C6.32 9.72 6.56 9.54 6.83 9.41C6.83 8.55 7.16 7.71 7.76 7.08C8.35 6.45 9.16 6.08 10.02 6.05C10.89 6.02 11.72 6.35 12.35 6.95C12.97 7.55 13.33 8.37 13.33 9.23C14.45 9.23 15.44 9.95 15.84 11.01C16.24 12.08 15.96 13.28 15.13 14.07C14.31 14.86 13.1 15.08 12.06 14.63C13.08 14.95 14.08 15.46 14.97 16.13C16.93 13.95 17.56 10.76 16.58 7.87C15.6 4.98 13.13 2.86 10.16 2.18C7.19 1.5 4.08 2.35 1.92 4.45C-0.24 6.55 -0.56 9.66 0.98 12.1C2.53 14.54 5.63 15.81 8.68 15.26C9.82 16.9 11.63 17.97 13.63 18.18C15.63 18.39 17.62 17.73 19.14 16.36C20.65 14.98 21.53 13.02 21.58 10.95C21.63 8.87 20.84 6.88 19.4 5.41C17.97 3.94 15.99 3.18 13.92 3.28C13.79 3.28 13.67 3.28 13.54 3.29V4.18Z"
                    />
                  </svg>
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                By signing in, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <ModalReactive
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        userEmail={userEmail}
      />
      <ModalChangePassword
        isModalOpen={changePassword}
        setIsModalOpen={setChangePassword}
      />
    </>
  );
};

export default Login;
