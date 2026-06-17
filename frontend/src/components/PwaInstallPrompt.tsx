"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, Sparkles } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if PWA is already installed or running in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isAlreadyInstalled = localStorage.getItem("pwa_installed") === "true";

    if (isStandalone || isAlreadyInstalled) {
      localStorage.setItem("pwa_installed", "true");
      return;
    }

    // 2. Check iOS since iOS doesn't support 'beforeinstallprompt'
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|opera|opios/.test(userAgent);
    
    if (isIphoneOrIpad) {
      setIsIOS(true);
      
      // If iOS, check if we should show instructions (dismissed time check)
      const dismissedAt = localStorage.getItem("pwa_dismissed_at");
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours
        if (timeDiff < twoHours) {
          return;
        }
      }
      
      // Show iOS PWA prompt after 3 seconds delay for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 3. Handle beforeinstallprompt for Android, Chrome, and desktop browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check dismissed time threshold (2 hours)
      const dismissedAt = localStorage.getItem("pwa_dismissed_at");
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours
        if (timeDiff < twoHours) {
          return;
        }
      }

      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Handle successful installation
    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show native browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user's choice
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      localStorage.setItem("pwa_installed", "true");
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Store current timestamp of dismissal in localStorage
    localStorage.setItem("pwa_dismissed_at", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-in fade-in slide-in-from-bottom-10 duration-300">
      <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

        <button 
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-[var(--muted)] transition-colors"
          title="Tutup"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="relative w-12 h-12 rounded-xl border border-[var(--border)] overflow-hidden flex-shrink-0 bg-[var(--muted)] flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="KursAI Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
              Instal KursAI <Sparkles size={13} className="text-yellow-500 fill-yellow-500/20" />
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal font-medium">
              Akses KursAI langsung dari layar utama untuk pencatatan transaksi lebih cepat, lancar, dan mendukung akses luring (offline).
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          {isIOS ? (
            /* Custom Instruction for iOS */
            <div className="w-full bg-[var(--muted)] rounded-xl p-3 border border-[var(--border)] text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
              <p className="font-bold text-[var(--foreground)]">Untuk pengguna iPhone / iPad:</p>
              <ol className="list-decimal pl-4 space-y-1 leading-normal font-medium">
                <li>Klik tombol <span className="font-extrabold inline-flex items-center gap-0.5 text-primary"><Share size={12} /> Share</span> di Safari.</li>
                <li>Pilih opsi <span className="font-extrabold text-primary">"Tambahkan ke Layar Utama"</span> atau <span className="font-extrabold text-primary">"Add to Home Screen"</span>.</li>
              </ol>
            </div>
          ) : (
            /* Install trigger button for Android & Desktop */
            <>
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-[var(--primary-foreground)] hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
              >
                <Download size={13} />
                Instal Aplikasi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
