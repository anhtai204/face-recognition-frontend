"use server";

import { auth, signIn } from "@/auth";
import { revalidateTag } from "next/cache";
import { sendRequest } from "./api";
export const getSession = async () => {
  const session = await auth();
  return session;
};

export async function authenticate(username: string, password: string) {
  try {
    const r = await signIn("credentials", {
      username: username,
      password: password,
      // callbackUrl: "/",
      redirect: false,
    });
    console.log(">>> check r: ", r);
    return r;
  } catch (error) {
    if ((error as any).name === "InvalidEmailPasswordError") {
      return {
        error: (error as any).type,
        code: 1,
      };
    } else if ((error as any).name === "InactiveAccountError") {
      return {
        error: (error as any).type,
        code: 2,
      };
    } else {
      return {
        error: "Internal server error",
        code: 0,
      };
    }
  }
}

// Hàm lấy tất cả users từ API
export const getUsers = async () => {
  const session = await auth();
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });

  if (res.statusCode === 200 && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
};

export const handleCreateUserAction = async (data: any) => {
  const session = await auth();
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/postgres`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    body: { ...data },
  });
  revalidateTag("list-users");
  return res;
};

export const handleUpdateUserAction = async (data: any) => {
  const session = await auth();
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/postgres`,
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    body: { ...data },
  });
  revalidateTag("list-users");
  return res;
};

export const handleDeleteUserAction = async (id: any) => {
  const session = await auth();
  console.log(id);
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/postgres/${id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });

  revalidateTag("list-users");
  return res;
};

export const handleGetUserById = async () => {
  const session = await auth();
  const id = session?.user?.id;
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/postgres/${id}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });
  return res;
};

export const changePasswordWithoutCode = async (
  id: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const session = await auth();
  try {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/postgres/change-password/${id}`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
      body: {
        oldPassword,
        newPassword,
        confirmPassword,
      },
    });
    if (res.statusCode === 200) {
      return res;
    }
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

export const handleGetRoles = async () => {
  const session = await auth();
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });

  if (res.statusCode === 200 && Array.isArray(res.data)) {
    const items = res.data.map((role) => ({
      label: role.description, // Gán label từ description
      key: role.id, // Gán key từ name
    }));
    return items;
  }
  return [];
};
