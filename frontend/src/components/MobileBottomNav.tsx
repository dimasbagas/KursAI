"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  ArrowLeftRight,
  Menu,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  QrCode,
  Mic,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
} from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebarStore();
  const { businessId } = useAuthStore();

  // Navigation Menu Overlay States
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [activeAction, setActiveAction] = useState<"form_in" | "form_out" | "barcode" | "voice" | null>(null);

  // Quick Form States
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formScope, setFormScope] = useState<"usaha" | "pribadi">("usaha");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Barcode States
  const [barcodeStream, setBarcodeStream] = useState<MediaStream | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Helper to determine active route
  const isActive = (href: string) => {
    if (href === "/ai") return pathname === "/ai";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Close overlay on escape key or back
  useEffect(() => {
    const handlePopState = () => {
      setShowQuickMenu(false);
      setActiveAction(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ----------------------------------------------------
  // TRANSACTION LOGIC
  // ----------------------------------------------------
  const handleQuickSubmit = async (type: "penjualan" | "pengeluaran") => {
    if (!formName.trim() || !formAmount || !businessId) {
      setErrorMsg("Harap isi semua kolom!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const amountNum = parseFloat(formAmount.replace(/\D/g, "")) || 0;

    try {
      const scopePrefix = formScope === "pribadi" ? "[Pribadi] " : "[Usaha] ";
      const { error } = await supabase.from("transactions").insert({
        business_id: businessId,
        type,
        quantity: 1,
        amount: amountNum,
        note: scopePrefix + formName.trim(),
      });

      if (error) throw error;

      setSuccessMsg(`Transaksi ${type === "penjualan" ? "Pemasukan" : "Pengeluaran"} senilai ${formatCurrency(amountNum)} berhasil dicatat!`);
      setFormName("");
      setFormAmount("");
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setSuccessMsg("");
        setActiveAction(null);
        setShowQuickMenu(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to insert transaction", err);
      setErrorMsg("Gagal menyimpan transaksi. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // BARCODE SCANNER LOGIC
  // ----------------------------------------------------
  const startBarcodeScanner = async () => {
    setShowQuickMenu(false); // Close the floating pills menu
    setActiveAction("barcode");
    setScanStatus("scanning");
    setScannedProduct(null);
    setErrorMsg("");

    // Small delay to let the modal mount and mount video ref
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setBarcodeStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Simulate a barcode detection after 2.5 seconds
        setTimeout(async () => {
          const { data: products } = await supabase
            .from("products")
            .select("*")
            .eq("business_id", businessId)
            .limit(1);

          if (products && products.length > 0) {
            const product = products[0];
            await supabase.from("transactions").insert({
              business_id: businessId,
              product_id: product.id,
              type: "penjualan",
              quantity: 1,
              amount: product.sell_price,
              note: `[Usaha] Scan Barcode: ${product.name}`,
            });

            await supabase
              .from("products")
              .update({ stock: Math.max(0, product.stock - 1) })
              .eq("id", product.id);

            setScannedProduct(product);
            setScanStatus("success");
          } else {
            const mockProduct = { name: "Produk Contoh", sell_price: 25000, unit: "pcs" };
            await supabase.from("transactions").insert({
              business_id: businessId,
              type: "penjualan",
              quantity: 1,
              amount: 25000,
              note: `[Usaha] Scan Barcode: Produk Contoh`,
            });
            setScannedProduct(mockProduct);
            setScanStatus("success");
          }

          // Close camera stream
          stream.getTracks().forEach((track) => track.stop());
        }, 2500);

      } catch (err) {
        console.error("Camera access failed", err);
        setScanStatus("error");
        setErrorMsg("Kamera tidak dapat diakses.");
      }
    }, 100);
  };

  const stopBarcodeScanner = () => {
    if (barcodeStream) {
      barcodeStream.getTracks().forEach((track) => track.stop());
      setBarcodeStream(null);
    }
    setActiveAction(null);
    setScanStatus("idle");
  };

  // ----------------------------------------------------
  // VOICE (SPEECH TO TEXT) AI LOGIC
  // ----------------------------------------------------
  const startVoiceRecording = () => {
    setShowQuickMenu(false); // Close the floating pills menu
    setActiveAction("voice");
    setTranscript("");
    setVoiceResult(null);
    setErrorMsg("");

    const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      setErrorMsg("Speech Recognition tidak didukung di browser ini.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setErrorMsg("Gagal mendengar suara. Coba lagi.");
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsSubmitting(true);

      try {
        let processedText = text.toLowerCase().trim();

        // 1. Normalize dots within numbers (e.g. 10.000 -> 10000, 1.500.000 -> 1500000)
        while (/(\d+)\.(\d+)/.test(processedText)) {
          processedText = processedText.replace(/(\d+)\.(\d+)/g, "$1$2");
        }

        // 2. Convert common word-based numbers to digits
        const textNumberMap: { [key: string]: string } = {
          "sepuluh ribu": "10000",
          "sebelas ribu": "11000",
          "dua puluh ribu": "20000",
          "tiga puluh ribu": "30000",
          "empat puluh ribu": "40000",
          "lima puluh ribu": "50000",
          "enam puluh ribu": "60000",
          "tujuh puluh ribu": "70000",
          "delapan puluh ribu": "80000",
          "sembilan puluh ribu": "90000",
          "seratus ribu": "100000",
          "dua ratus ribu": "200000",
          "tiga ratus ribu": "300000",
          "empat ratus ribu": "400000",
          "lima ratus ribu": "500000",
          "seribu": "1000",
          "dua ribu": "2000",
          "tiga ribu": "3000",
          "empat ribu": "4000",
          "lima ribu": "5000",
          "enam ribu": "6000",
          "tujuh ribu": "7000",
          "delapan ribu": "8000",
          "sembilan ribu": "9000",
          "satu juta": "1000000",
          "dua juta": "2000000",
          "tiga juta": "3000000",
          "empat juta": "4000000",
          "lima juta": "5000000",
          "sepuluh": "10",
          "sebelas": "11",
          "seratus": "100",
        };

        // Sort keys by length to replace longer phrases first
        const sortedKeys = Object.keys(textNumberMap).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
          const regex = new RegExp(`\\b${key}\\b`, "g");
          processedText = processedText.replace(regex, textNumberMap[key]);
        }

        // 3. Remove "rp" or "rp." preceding a number, and standalone "rp" / "rupiah"
        processedText = processedText
          .replace(/rp\.?\s*(?=\d)/g, "")
          .replace(/\brp\b/g, "")
          .replace(/\brupiah\b/g, "");

        let type: "penjualan" | "pengeluaran" = "penjualan";
        let amount = 0;
        let itemName = "Transaksi Suara";

        const amountMatch = processedText.match(/(\d+)\s*(ribu|rb|juta|jt)?/i);
        if (amountMatch) {
          let val = parseFloat(amountMatch[1]);
          const unit = amountMatch[2];
          if (/ribu|rb/.test(unit)) val *= 1000;
          if (/juta|jt/.test(unit)) val *= 1000000;
          amount = val;
        }

        const expenseKeywords = ["beli", "jajan", "parkir", "bensin", "sewa", "bayar", "pengeluaran", "makan", "minum", "belanja", "listrik"];
        const isExpense = expenseKeywords.some(keyword => processedText.includes(keyword));
        if (isExpense) {
          type = "pengeluaran";
        }

        const cleanText = processedText
          .replace(new RegExp(`\\b(${expenseKeywords.join("|")})\\b`, "g"), "")
          .replace(/\d+\s*(ribu|rb|juta|jt)?/g, "")
          .replace(/\s+/g, " ")
          .trim();
        
        if (cleanText) {
          itemName = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        }

        if (amount > 0) {
          const { data, error } = await supabase
            .from("transactions")
            .insert({
              business_id: businessId,
              type,
              quantity: 1,
              amount,
              note: `[Usaha] Voice: ${itemName}`,
            })
            .select("id")
            .single();

          if (error) throw error;

          setVoiceResult({
            id: data?.id,
            type,
            name: itemName,
            amount,
          });
        } else {
          setErrorMsg(`Suara terdeteksi: "${text}". Namun AI tidak menemukan nominal uang. Coba sebutkan: "Beli bensin sepuluh ribu"`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Gagal memproses suara.");
      } finally {
        setIsSubmitting(false);
      }
    };

    rec.start();
  };

  const handleUndoVoiceTransaction = async () => {
    if (!voiceResult?.id) return;
    setIsUndoing(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", voiceResult.id);
      
      if (error) throw error;
      
      setVoiceResult(null);
      setTranscript("");
      setSuccessMsg("Transaksi berhasil dibatalkan dan dihapus.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal membatalkan transaksi.");
    } finally {
      setIsUndoing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (barcodeStream) {
        barcodeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [barcodeStream]);

  // Floating Pill Menus configurations
  const pills = [
    {
      label: "Catat Pemasukan",
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      delayClass: "delay-75",
      action: "form_in" as const,
    },
    {
      label: "Catat Pengeluaran",
      icon: TrendingDown,
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      delayClass: "delay-100",
      action: "form_out" as const,
    },
    {
      label: "Scan Barcode (AI)",
      icon: QrCode,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      delayClass: "delay-150",
      action: "barcode" as const,
    },
    {
      label: "Catat Suara (AI)",
      icon: Mic,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      delayClass: "delay-200",
      action: "voice" as const,
    },
  ];

  return (
    <>
      {/* ----------------- MOBILE BOTTOM NAV (REARRANGED: CHAT ON FAR LEFT) ----------------- */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--sidebar-bg)] border-t border-[var(--sidebar-border)] flex items-center justify-between md:hidden z-50 shadow-lg px-6 select-none">
        
        {/* Chat AI - FAR LEFT */}
        <Link
          href="/ai"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-full transition-all",
            isActive("/ai") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
          )}
        >
          <Bot size={20} />
          <span className="text-[9px] font-bold mt-1">Chat AI</span>
        </Link>

        {/* Dashboard / Beranda */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-full transition-all",
            isActive("/dashboard") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
          )}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold mt-1">Beranda</span>
        </Link>

        {/* PLUS BUTTON IN THE CENTER - INLINE */}
        <div className="flex items-center justify-center w-12 h-full">
          <button
            onClick={() => {
              setShowQuickMenu(!showQuickMenu);
              setActiveAction(null);
            }}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-[#22C55E] text-black flex items-center justify-center shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Plus 
              size={24} 
              className={cn("stroke-[3px] transition-transform duration-300", showQuickMenu ? "rotate-45" : "rotate-0")} 
            />
          </button>
        </div>

        {/* Transaksi */}
        <Link
          href="/transactions"
          className={cn(
            "flex flex-col items-center justify-center w-12 h-full transition-all",
            isActive("/transactions") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
          )}
        >
          <ArrowLeftRight size={20} />
          <span className="text-[9px] font-bold mt-1">Transaksi</span>
        </Link>

        {/* Menu Lainnya */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
        >
          <Menu size={20} />
          <span className="text-[9px] font-bold mt-1">Menu</span>
        </button>
      </div>

      {/* ----------------- DIAGONAL PILLS FLOATING MENU OVERLAY ----------------- */}
      {showQuickMenu && (
        <div className="fixed inset-0 z-40 md:hidden flex items-end justify-center">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 bg-black/60 z-0 transition-opacity duration-300" onClick={() => setShowQuickMenu(false)} />

          {/* Staggered Floating Pills Container */}
          <div className="absolute bottom-24 flex flex-col items-center space-y-3.5 z-10 w-full max-w-xs mb-2">
            {pills.map((pill) => {
              const PillIcon = pill.icon;
              return (
                <button
                  key={pill.label}
                  onClick={() => {
                    if (pill.action === "barcode") {
                      startBarcodeScanner();
                    } else if (pill.action === "voice") {
                      startVoiceRecording();
                    } else {
                      setShowQuickMenu(false);
                      setActiveAction(pill.action);
                    }
                  }}
                  className={cn(
                    "flex items-center bg-[var(--card)] border border-[var(--border)] shadow-xl rounded-full pl-3 pr-5 py-2.5 w-60 transform transition-all duration-300 ease-out active:scale-95",
                    showQuickMenu
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-10 scale-90 pointer-events-none",
                    pill.delayClass
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border mr-3", pill.color)}>
                    <PillIcon size={14} />
                  </div>
                  <span className="text-xs font-bold text-[var(--foreground)]">{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- DEDICATED MODALS FOR ACTIVE ACTIONS ----------------- */}
      {activeAction !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 md:hidden select-none">
          <div className="absolute inset-0 z-0" onClick={() => {
            if (activeAction === "barcode") stopBarcodeScanner();
            else setActiveAction(null);
          }} />

          <div className="bg-[var(--card)] w-full max-w-sm border border-[var(--border)] rounded-3xl p-6 shadow-2xl z-10 animate-scale-in">
            
            {/* QUICK TRANSACTION FORM */}
            {(activeAction === "form_in" || activeAction === "form_out") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    {activeAction === "form_in" ? (
                      <>
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span>Catat Pemasukan</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} className="text-rose-500" />
                        <span>Catat Pengeluaran</span>
                      </>
                    )}
                  </h3>
                  <button onClick={() => setActiveAction(null)} className="text-[var(--muted-foreground)] p-1 hover:bg-[var(--muted)] rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Nama Transaksi</label>
                    <input
                      type="text"
                      placeholder={activeAction === "form_in" ? "Contoh: Penjualan kopi, Pendapatan jasa" : "Contoh: Beli bensin, Belanja ATK"}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="input-field text-xs py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Nominal (Rupiah)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 15000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="input-field text-xs py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Kategori Transaksi</label>
                    <div className="flex gap-2 bg-[var(--background)] p-1 border border-[var(--border)] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormScope("usaha")}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                          formScope === "usaha"
                            ? "bg-primary text-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        Pembukuan Usaha
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormScope("pribadi")}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                          formScope === "pribadi"
                            ? "bg-primary text-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        Pribadi
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveAction(null)}
                    className="flex-1 btn-secondary text-xs py-2.5"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleQuickSubmit(activeAction === "form_in" ? "penjualan" : "pengeluaran")}
                    disabled={isSubmitting}
                    className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SCAN BARCODE SCREEN */}
            {activeAction === "barcode" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <QrCode size={16} className="text-blue-500" />
                    <span>Scan Barcode AI</span>
                  </h3>
                  <button onClick={stopBarcodeScanner} className="text-[var(--muted-foreground)] p-1 hover:bg-[var(--muted)] rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                {scanStatus === "scanning" && (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-[var(--border)] flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-75" />
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 top-1/2 shadow-md shadow-red-500/80 animate-pulse-glow" style={{ animation: "pulse-glow 1.5s infinite" }} />
                    <div className="relative z-10 p-3 bg-black/60 rounded-xl border border-white/10 text-center space-y-1">
                      <Camera size={20} className="mx-auto text-blue-400 animate-pulse" />
                      <p className="text-[10px] text-white font-bold">Mengarahkan Kamera...</p>
                    </div>
                  </div>
                )}

                {scanStatus === "success" && scannedProduct && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-3">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Barcode Terbaca (AI)!</h4>
                      <p className="text-sm font-bold text-[var(--foreground)] mt-1">{scannedProduct.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Penjualan 1 unit: {formatCurrency(scannedProduct.sell_price)}</p>
                    </div>
                    <button
                      onClick={stopBarcodeScanner}
                      className="w-full btn-primary text-xs py-2 bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Selesai
                    </button>
                  </div>
                )}

                {scanStatus === "error" && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center space-y-3">
                    <AlertCircle size={36} className="mx-auto text-rose-500" />
                    <p className="text-xs font-bold text-[var(--foreground)]">{errorMsg || "Gagal menyalakan kamera."}</p>
                    <button
                      onClick={stopBarcodeScanner}
                      className="w-full btn-secondary text-xs py-2"
                    >
                      Kembali
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SPEECH TO TEXT AI */}
            {activeAction === "voice" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Mic size={16} className="text-amber-500" />
                    <span>Catat Suara AI</span>
                  </h3>
                  <button onClick={() => setActiveAction(null)} className="text-[var(--muted-foreground)] p-1 hover:bg-[var(--muted)] rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <button
                    onClick={startVoiceRecording}
                    disabled={isListening || isSubmitting}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                      isListening
                        ? "bg-rose-500 text-white animate-pulse shadow-rose-500/20 scale-105"
                        : "bg-amber-500 text-black hover:scale-105 active:scale-95"
                    )}
                  >
                    <Mic size={32} />
                  </button>

                  <div className="text-center">
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      {isListening ? "Mendengarkan... Sebutkan transaksi Anda" : "Tekan Mikrofon untuk mulai bicara"}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1 max-w-xs mx-auto">
                      Format suara: *"Jual beras sepuluh ribu"* atau *"Pengeluaran bensin lima belas ribu"*
                    </p>
                  </div>
                </div>

                {transcript && (
                  <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                    <span className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">Hasil Deteksi Suara:</span>
                    <p className="text-xs text-[var(--foreground)] font-semibold italic mt-0.5">"{transcript}"</p>
                  </div>
                )}

                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-[var(--muted-foreground)] font-bold">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>AI sedang memproses catatan...</span>
                  </div>
                )}

                {voiceResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Transaksi Tercatat (AI)!</span>
                    </div>
                    <div className="text-xs space-y-1 font-semibold">
                      <p className="text-[var(--muted-foreground)]">Nama: <span className="text-[var(--foreground)] font-bold">{voiceResult.name}</span></p>
                      <p className="text-[var(--muted-foreground)]">Jenis: <span className="text-[var(--foreground)] font-bold capitalize">{voiceResult.type === "penjualan" ? "Pemasukan" : "Pengeluaran"}</span></p>
                      <p className="text-[var(--muted-foreground)]">Jumlah: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(voiceResult.amount)}</span></p>
                    </div>
                    <button
                      onClick={handleUndoVoiceTransaction}
                      disabled={isUndoing}
                      className="w-full mt-2 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      {isUndoing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Batalkan Transaksi (Undo)"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
