import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sendRequest } from "./utils/api";
import {
  ForbiddenError,
  InactiveAccountError,
  InvalidEmailPasswordError,
  NotFoundError,
  RequestTimeOutError,
} from "./utils/errors";
import { IUser } from "./types/next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          let user = null;
          const res = await sendRequest<IBackendRes<ILogin>>({
            method: "POST",
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
            body: {
              username: credentials.username,
              password: credentials.password,
            },
          });

          console.log(">>>res login: ", res);
          console.log(">>>res status code: ", res.statusCode);

          if (res.statusCode === 201) {
            return {
              id: res.data?.user?.id,
              username: res.data?.user?.name,
              email: res.data?.user?.email,
              access_token: res.data?.access_token,
              role: res.data?.user?.role,
            };
          }
          return null;
        } catch (error) {
          console.log(">>> auth error: ", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    // signIn: "/auth/login",
    signIn: "/", // trả về trang chủ để xử lý login
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.user = user as IUser;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as IUser) = token.user;
      return session;
    },
    // authorized: async ({ auth }) => {
    //   return !!auth;
    // },
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      // Cho phép truy cập public cho các route và sub-route
      if (pathname === "/") {
        return true;
      }
      // Yêu cầu session cho các route khác
      return !!auth;
    },
  },
});
