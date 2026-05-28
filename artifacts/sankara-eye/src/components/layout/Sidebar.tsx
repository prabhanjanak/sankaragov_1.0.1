import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  PhoneCall,
  Building2,
  Users,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Mail,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BASE_PATH } from "@/lib/constants";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
    { href: "/eye-calls", label: "Eye Calls", icon: PhoneCall, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
    { href: "/units", label: "Units", icon: Building2, roles: ["super_admin", "eye_bank_head"] },
    { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
    { href: "/notifications", label: "Notifications", icon: Bell, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
    { href: "/settings/whatsapp", label: "WhatsApp API", icon: MessageCircle, roles: ["super_admin"] },
    { href: "/settings/email", label: "Email SMTP", icon: Mail, roles: ["super_admin"] },
    { href: "/profile", label: "Profile", icon: UserCircle, roles: ["super_admin", "eye_bank_head", "unit_coordinator"] },
  ];

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div
      className={cn(
        "bg-white/70 backdrop-blur-xl border-r border-gray-200/60 flex flex-col h-[100dvh] transition-all duration-300 relative select-none shadow-[4px_0_24px_rgba(0,0,0,0.01)]",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200/60 px-4 overflow-hidden bg-white/30">
        {collapsed ? (
          <img src={`${BASE_PATH}/logo.png`} alt="SEFI" className="h-9 w-9 object-cover object-top rounded-full border-2 border-orange-100/80 shadow-md hover:scale-105 transition-transform" />
        ) : (
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-12 w-full object-contain hover:scale-[1.01] transition-transform duration-500" />
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white border border-gray-200/70 rounded-full p-1.5 text-gray-400 hover:text-[#ff7a18] hover:scale-110 hover:shadow-md transition-all duration-300 shadow-sm z-10 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group font-semibold text-sm select-none border",
                isActive
                  ? "bg-[#ff7a18]/8 text-[#ff7a18] shadow-sm shadow-[#ff7a18]/5 border-[#ff7a18]/15"
                  : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 border-transparent"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Sliding Neon Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-[#ff7a18] to-orange-400 rounded-r-full shadow-[0_0_8px_#ff7a18]" />
              )}
              <item.icon
                size={18}
                className={cn(
                  "shrink-0 transition-transform duration-300 group-hover:scale-110", 
                  isActive ? "text-[#ff7a18]" : "text-gray-400 group-hover:text-gray-700"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200/60 bg-white/20">
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-gray-500 hover:bg-red-50 hover:text-red-600 w-full group font-semibold text-sm select-none border border-transparent hover:border-red-100/60 shadow-sm hover:shadow-md cursor-pointer",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="shrink-0 group-hover:text-red-600 text-gray-400 transition-transform group-hover:rotate-12" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
