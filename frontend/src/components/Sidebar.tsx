"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import {
  LayoutDashboard,
  Bot,
  ArrowLeftRight,
  HandCoins,
  Package,
  FileText,
  FolderOpen,
  Users,
  Settings,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Percent,
  Landmark,
  Sun,
  Moon,
  ClipboardCheck,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Bot, label: "Chat AI", href: "/ai" },
  { icon: ArrowLeftRight, label: "Transaksi", href: "/transactions" },
  { icon: HandCoins, label: "Kasbon", href: "/kasbon" },
  { icon: Package, label: "Stok & Produk", href: "/products" },
  { icon: FileText, label: "Faktur & Kwitansi", href: "/invoices" },
  { icon: Percent, label: "Pajak", href: "/pajak" },
  { icon: Landmark, label: "Akses Modal", href: "/modal" },
  { icon: FolderOpen, label: "Dokumen", href: "/documents" },
  { icon: Users, label: "Tim", href: "/team" },
  { icon: Settings, label: "Pengaturan", href: "/settings" },
  { icon: ClipboardCheck, label: "Kuesioner", href: "/kuesioner" },
  { icon: Crown, label: "Langganan", href: "/subscription" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { logout } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "light";

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-50 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col transition-all duration-300 pb-20 md:pb-0",
          isOpen ? "w-64" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--sidebar-border)]">
          {isOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <Bot size={18} className="text-[var(--primary-foreground)]" />
              </div>
              <span className="font-bold text-lg text-[var(--foreground)]">KursAI</span>
            </Link>
          )}
          {!isOpen && (
            <Link href="/dashboard" className="mx-auto">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <Bot size={18} className="text-[var(--primary-foreground)]" />
              </div>
            </Link>
          )}
          <button
            onClick={() => { toggle(); setMobileOpen(false); }}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded md:block hidden"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <item.icon size={20} className={cn(isActive ? "text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]")} />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--sidebar-border)] space-y-1">
          <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] w-full transition-all duration-200"
            title={isOpen ? undefined : "Toggle Theme"}
          >
            {currentTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            {isOpen && <span className="text-sm font-medium">
              {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>}
          </button>
          <button
            onClick={async () => { await logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
