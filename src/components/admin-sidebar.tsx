"use client";

// import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Calendar,
  LogOut,
  Settings,
  Home,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, UserRole } from "@/types/next-auth";
import { currentUser as mockCurrentUser } from "@/utils/mock-data";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export function AdminSidebar() {
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

  // const switchRole = (role: UserRole) => {
  //   if (user) {
  //     setUser({ ...user, role });
  //   }
  // };
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/attendance", label: "Attendance", icon: BarChart3 },
    { href: "/admin/reports", label: "Reports", icon: TrendingUp },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // const handleSwitchToSupervisor = () => {
  //   switchRole("supervisor");
  //   router.push("/supervisor/dashboard");
  // };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-primary">FaceCheck</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Admin Panel</p>
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
          onClick={handleSwitchToSupervisor}
        >
          <Shield className="h-4 w-4" />
          Switch to Supervisor
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
