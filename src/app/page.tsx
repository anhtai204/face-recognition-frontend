// import Image from "next/image";

// export default function Home() {
//   return (
//     <>
//       <div>Home 123</div>
//     </>
//   );
// }

import LoginPage from "@/components/auth/login";
import CameraFeed from "@/components/test/page";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <LoginPage />
    </main>
  );
}
