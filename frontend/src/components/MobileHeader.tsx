"use client";

import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Bell, Globe, Sun, Moon, RotateCw, PanelLeft } from "lucide-react";

export default function MobileHeader() {
  const { setMobileOpen } = useSidebarStore();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const currentTheme = mounted ? theme : "light";
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] h-14 select-none">
      {/* Left side: Sidebar Toggle */}
      <button 
        onClick={() => setMobileOpen(true)} 
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg transition-colors"
      >
        <PanelLeft size={20} />
      </button>

      {/* Middle: Brand Name */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-base text-[var(--foreground)] flex items-center gap-0.5">
          Kurs<span className="text-[var(--primary)] font-extrabold">AI</span>
        </span>
      </div>

      {/* Right side: Action Icons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={handleRefresh}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
          title="Segarkan data"
        >
          <RotateCw size={18} />
        </button>
        <button 
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors relative"
          title="Notifikasi"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>
        <button 
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
          title="Bahasa"
        >
          <Globe size={18} />
        </button>
        <button 
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 transition-colors"
          title="Ganti Tema"
        >
          {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {/* User avatar circle */}
        <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shadow-sm ml-1">
          {initial}
        </div>
      </div>
    </header>
  );
}
