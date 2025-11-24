"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  LogOut,
  Home,
  TrendingUp,
  Eye,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentUser as mockCurrentUser } from "@/utils/mock-data";
import { useState } from "react";
import { User, UserRole } from "@/types/next-auth";
import { signOut, useSession } from "next-auth/react";

export function SupervisorSidebar() {
  // const [user, setUser] = useState<User | null>(mockCurrentUser);

  const { data: session, status } = useSession();

  const user = session?.user;

  // const logout = () => {
  //   setUser(null);
  // };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/supervisor/dashboard", label: "Dashboard", icon: Home },
    { href: "/supervisor/attendance", label: "Attendance", icon: BarChart3 },
    { href: "/supervisor/employees", label: "Employees", icon: Users },
    { href: "/supervisor/reports", label: "Reports", icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };


  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-primary">FaceCheck</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">
          Supervisor Panel
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="px-3 py-2 bg-sidebar-accent/20 rounded-lg">
          <p className="text-xs font-semibold text-sidebar-foreground/60">
            CURRENT USER
          </p>
          <p className="text-sm font-medium text-sidebar-foreground mt-1">
            {user?.full_name}
          </p>
          <p className="text-xs text-sidebar-foreground/60 capitalize">
            {user?.role}
          </p>
        </div>
        {/* <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={handleSwitchToAdmin}
        >
          <Shield className="h-4 w-4" />
          Switch to Admin
        </Button> */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
