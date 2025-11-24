// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
  
//   // Allow public access for these routes
//   if (
//     pathname === "/" ||
//     pathname.startsWith("/auth")
//   ) {
//     return NextResponse.next();
//   }
  
//   // For now, allow all other routes (you can add auth logic here later)
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!api|_next/static|_next/image|favicon.ico).*)",
//   ],
// };


export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // '/((?!auth).*)(.+)|/verify',
    // "/((?!api|_next/static|_next/image|favicon.ico|/|/auth).*)",
    // "/((?!api|_next/static|_next/image|favicon.ico|auth|verify|$).*)",
    "/((?!api|_next/static|_next/image|favicon.ico|auth|verify|/|/course|/blog|/news).*)",
  ],
};
