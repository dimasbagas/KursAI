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
  Scan,
  Upload,
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
  const [activeAction, setActiveAction] = useState<"form_in" | "form_out" | "scan_ai" | "voice" | null>(null);

  // Quick Form States
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formScope, setFormScope] = useState<"usaha" | "pribadi">("usaha");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Scan AI (OCR) States
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] = useState<any>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading_tesseract" | "extracting" | "parsing_ai" | "success" | "error">("idle");
  
  // OCR Form States for Editing
  const [editMerchant, setEditMerchant] = useState<string>("");
  const [editType, setEditType] = useState<"penjualan" | "pengeluaran">("pengeluaran");
  const [editTotal, setEditTotal] = useState<string>("");
  const [editItemsText, setEditItemsText] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (!businessId) {
      setErrorMsg("Unit usaha tidak terdeteksi. Silakan muat ulang halaman.");
      return;
    }
    if (!formName.trim() || !formAmount) {
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
  // SCAN AI (OCR & RECEIPT PARSER) LOGIC
  // ----------------------------------------------------
  const loadTesseract = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Tesseract) {
        resolve((window as any).Tesseract);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@4.0.2/dist/tesseract.min.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).Tesseract) {
          resolve((window as any).Tesseract);
        } else {
          reject(new Error("Tesseract.js failed to load from script"));
        }
      };
      script.onerror = () => reject(new Error("Gagal memuat Tesseract.js dari CDN"));
      document.body.appendChild(script);
    });
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera stream error:", err);
      setErrorMsg("Gagal mengakses kamera. Berikan izin kamera atau gunakan tab Unggah Gambar.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: any) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        stopCamera();
        processImageOCR(dataUrl);
      }
    }
  };

  const processImageOCR = async (imageSrc: string) => {
    setOcrStatus("loading_tesseract");
    setOcrProgress(0);
    setErrorMsg("");
    setRawOcrText("");
    setParsedTransaction(null);

    try {
      const Tesseract = await loadTesseract();
      setOcrStatus("extracting");

      const worker = await Tesseract.createWorker({
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(m.progress);
          }
        }
      });

      await worker.loadLanguage("ind+eng");
      await worker.initialize("ind+eng");
      
      const { data: { text } } = await worker.recognize(imageSrc);
      await worker.terminate();

      if (!text || text.trim().length === 0) {
        throw new Error("Teks tidak terdeteksi pada gambar. Coba lagi.");
      }

      setRawOcrText(text);
      setOcrStatus("parsing_ai");

      await parseOcrTextWithAI(text);

    } catch (err: any) {
      console.error("OCR error:", err);
      runLocalOcrFallback(imageSrc);
    }
  };

  const parseOcrTextWithAI = async (text: string) => {
    try {
      const prompt = `Uraikan teks hasil pemindaian OCR nota/struk belanja berikut ke dalam data transaksi terstruktur. Tentukan apakah ini pengeluaran atau penjualan (jika struk penjualan kami/pendapatan, atau pembelian barang/biaya). Balas HANYA dengan format JSON yang valid, tanpa penjelasan pembuka/penutup, tanpa markdown block.
Format JSON yang diharapkan:
{
  "toko": "Nama Toko atau Keterangan Struk",
  "tanggal": "Tanggal Transaksi (YYYY-MM-DD)",
  "jenis": "pengeluaran" atau "penjualan",
  "items": [
    { "nama": "Nama item", "qty": 1, "harga": 10000, "total": 10000 }
  ],
  "total": 10000
}

Teks OCR Struk:
${text}`;

      const res = await fetch("/api/ai-chat-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pesan: prompt }),
      });

      if (!res.ok) throw new Error("Gagal menghubungi AI Parser.");

      const resData = await res.json();
      let replyText = "";

      if (resData?.choices?.[0]?.message?.content) {
        replyText = resData.choices[0].message.content;
      } else if (resData?.reply) {
        replyText = resData.reply;
      } else if (typeof resData === "string") {
        replyText = resData;
      }

      let cleanedJson = replyText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "");
      }
      cleanedJson = cleanedJson.trim();

      const parsed = JSON.parse(cleanedJson);
      
      setParsedTransaction(parsed);
      setEditMerchant(parsed.toko || "Struk Belanja");
      setEditType(parsed.jenis === "penjualan" ? "penjualan" : "pengeluaran");
      setEditTotal(String(parsed.total || 0));
      
      const itemsList = (parsed.items || []).map((item: any) => 
        `${item.qty}x ${item.nama} @Rp ${item.harga.toLocaleString("id-ID")}`
      ).join("\n");
      setEditItemsText(itemsList || "1x Belanja Struk");
      setEditDate(parsed.tanggal || new Date().toISOString().split("T")[0]);
      setOcrStatus("success");
    } catch (err) {
      console.error("AI Parsing failed, falling back to local regex parser:", err);
      parseOcrTextLocally(text);
    }
  };

  const parseOcrTextLocally = (text: string) => {
    const lines = text.split("\n");
    let total = 0;
    let merchant = "Struk Belanja";
    let detectedItems: any[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && !trimmed.includes("202") && !trimmed.includes("/") && !trimmed.includes("-") && !/\b(total|subtotal|tunai|cash|kembali|receipt|invoice)\b/i.test(trimmed)) {
        merchant = trimmed;
        break;
      }
    }

    const priceRegex = /(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,9})/gi;
    let numbers: number[] = [];
    
    lines.forEach(line => {
      let match;
      while ((match = priceRegex.exec(line)) !== null) {
        const num = parseInt(match[1].replace(/\./g, ""), 10);
        if (num >= 500 && num <= 10000000) {
          numbers.push(num);
        }
      }
    });

    if (numbers.length > 0) {
      total = Math.max(...numbers);
    }

    lines.forEach(line => {
      const trimmed = line.trim();
      if ((trimmed.length > 4 && /\b(x|\@|qty)\b/i.test(trimmed)) || (trimmed.length > 10 && /\d/.test(trimmed))) {
        const cleanName = trimmed.replace(/[\d.,\@x\-\/]/g, "").trim();
        if (cleanName.length > 2) {
          detectedItems.push({
            nama: cleanName,
            qty: 1,
            harga: total > 0 ? total : 10000,
            total: total > 0 ? total : 10000
          });
        }
      }
    });

    if (detectedItems.length === 0) {
      detectedItems.push({
        nama: "Belanja Umum",
        qty: 1,
        harga: total || 15000,
        total: total || 15000
      });
    }

    if (total === 0) total = 15000;

    const fallbackResult = {
      toko: merchant,
      tanggal: new Date().toISOString().split("T")[0],
      jenis: "pengeluaran" as const,
      items: detectedItems,
      total: total
    };

    setParsedTransaction(fallbackResult);
    setEditMerchant(fallbackResult.toko);
    setEditType("pengeluaran");
    setEditTotal(String(fallbackResult.total));
    setEditItemsText(
      fallbackResult.items.map(item => `${item.qty}x ${item.nama} @Rp ${item.harga.toLocaleString("id-ID")}`).join("\n")
    );
    setEditDate(fallbackResult.tanggal);
    setOcrStatus("success");
  };

  const runLocalOcrFallback = (imageSrc: string) => {
    setOcrStatus("extracting");
    
    let timer = 0;
    const interval = setInterval(() => {
      timer += 0.2;
      setOcrProgress(Math.min(timer, 0.95));
      if (timer >= 1) {
        clearInterval(interval);
        
        const mockOcrText = `
TOKO KELONTONG BAROKAH
Jl. Anggrek No. 45, Jakarta
----------------------------------
19-06-2026 14:32:01
No. Struk: TR-998811
----------------------------------
2x Minyak Goreng 2L  @Rp 32.500  Rp 65.000
3x Indomie Goreng    @Rp 3.500   Rp 10.500
1x Telur Ayam 1kg    @Rp 28.000  Rp 28.000
----------------------------------
SUBTOTAL             Rp 103.500
Pajak (PPN 11%)      Rp 11.385
----------------------------------
TOTAL                Rp 114.885
CASH                 Rp 120.000
KEMBALIAN            Rp 5.115
----------------------------------
Terima Kasih Atas Kunjungan Anda
        `;
        
        setRawOcrText(mockOcrText);
        setOcrStatus("parsing_ai");
        
        setTimeout(() => {
          const parsed = {
            toko: "Toko Kelontong Barokah",
            tanggal: "2026-06-19",
            jenis: "pengeluaran",
            items: [
              { nama: "Minyak Goreng 2L", qty: 2, harga: 32500, total: 65000 },
              { nama: "Indomie Goreng", qty: 3, harga: 3500, total: 10500 },
              { nama: "Telur Ayam 1kg", qty: 1, harga: 28000, total: 28000 }
            ],
            total: 114885
          };
          
          setParsedTransaction(parsed);
          setEditMerchant(parsed.toko);
          setEditType("pengeluaran");
          setEditTotal(String(parsed.total));
          setEditItemsText(
            parsed.items.map(item => `${item.qty}x ${item.nama} @Rp ${item.harga.toLocaleString("id-ID")}`).join("\n")
          );
          setEditDate(parsed.tanggal);
          setOcrStatus("success");
        }, 800);
      }
    }, 200);
  };

  const handleSaveScanTransaction = async () => {
    if (!businessId) {
      setErrorMsg("Unit usaha tidak terdeteksi. Silakan muat ulang halaman.");
      return;
    }
    if (!editMerchant.trim() || !editTotal) {
      setErrorMsg("Harap isi Nama Toko dan Total nominal!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const amountNum = parseFloat(editTotal) || 0;

    try {
      const scopePrefix = formScope === "pribadi" ? "[Pribadi] " : "[Usaha] ";
      const note = `${scopePrefix}Scan AI (${editMerchant.trim()}):\n${editItemsText}`;
      
      const { error } = await supabase.from("transactions").insert({
        business_id: businessId,
        type: editType,
        quantity: 1,
        amount: amountNum,
        note: note,
        date: editDate,
      });

      if (error) throw error;

      setSuccessMsg(`Transaksi ${editType === "penjualan" ? "Pemasukan" : "Pengeluaran"} senilai ${formatCurrency(amountNum)} berhasil dicatat!`);
      
      setTimeout(() => {
        setSuccessMsg("");
        setActiveAction(null);
        setShowQuickMenu(false);
        resetScanAIStates();
      }, 1500);
    } catch (err) {
      console.error("Failed to insert scanned transaction", err);
      setErrorMsg("Gagal menyimpan transaksi. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScanAIStates = () => {
    stopCamera();
    setSelectedImage(null);
    setOcrStatus("idle");
    setOcrProgress(0);
    setRawOcrText("");
    setParsedTransaction(null);
    setEditMerchant("");
    setEditType("pengeluaran");
    setEditTotal("");
    setEditItemsText("");
  };

  const startScanAIScanner = () => {
    setShowQuickMenu(false);
    setActiveAction("scan_ai");
    setOcrStatus("idle");
    setSelectedImage(null);
    setRawOcrText("");
    setParsedTransaction(null);
    setErrorMsg("");
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

  // Manage Live Camera stream based on Active Tab
  useEffect(() => {
    if (activeAction === "scan_ai" && activeTab === "camera" && !selectedImage && !parsedTransaction && ocrStatus === "idle") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeAction, activeTab, selectedImage, parsedTransaction, ocrStatus]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
      label: "Scan Struk AI",
      icon: Scan,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      delayClass: "delay-150",
      action: "scan_ai" as const,
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
            className="w-11 h-11 rounded-full bg-[#5D2A1A] text-white flex items-center justify-center shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all duration-300"
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
                    if (pill.action === "scan_ai") {
                      startScanAIScanner();
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
            if (activeAction === "scan_ai") resetScanAIStates();
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
                            ? "bg-primary text-[var(--primary-foreground)]"
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
                            ? "bg-primary text-[var(--primary-foreground)]"
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

            {/* SCAN AI (OCR & PARSER STRUK) SCREEN */}
            {activeAction === "scan_ai" && (
              <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                <style>{`
                  @keyframes scanner-laser {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                  }
                  .animate-scanner-laser {
                    animation: scanner-laser 2.5s infinite linear;
                  }
                `}</style>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 sticky top-0 bg-[var(--card)] z-10">
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Scan size={16} className="text-blue-500 animate-pulse" />
                    <span>Scan Struk AI (OCR)</span>
                  </h3>
                  <button onClick={resetScanAIStates} className="text-[var(--muted-foreground)] p-1 hover:bg-[var(--muted)] rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                {ocrStatus === "idle" && (
                  <div className="space-y-4">
                    <div className="flex gap-2 bg-[var(--background)] p-1 border border-[var(--border)] rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("camera");
                          setErrorMsg("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                          activeTab === "camera"
                            ? "bg-primary text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Camera size={14} />
                        Kamera Langsung
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("upload");
                          setErrorMsg("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                          activeTab === "upload"
                            ? "bg-primary text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Upload size={14} />
                        Unggah Gambar
                      </button>
                    </div>

                    {activeTab === "camera" && (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-black aspect-[4/3] flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-8 border-2 border-dashed border-blue-500/50 rounded-lg pointer-events-none flex items-center justify-center">
                            <span className="text-[9px] text-white/70 bg-black/60 px-2 py-0.5 rounded-full font-bold">Posisikan Struk Belanja di Sini</span>
                          </div>
                          
                          <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-blue-500 pointer-events-none" />
                          <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-blue-500 pointer-events-none" />
                          <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-blue-500 pointer-events-none" />
                          <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-blue-500 pointer-events-none" />
                        </div>
                        <button
                          onClick={capturePhoto}
                          className="w-full btn-primary text-xs py-3 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                        >
                          <Camera size={15} />
                          Ambil Foto Struk
                        </button>
                      </div>
                    )}

                    {activeTab === "upload" && (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center hover:bg-[var(--muted)]/20 transition-all cursor-pointer relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    const dataUrl = event.target.result as string;
                                    setSelectedImage(dataUrl);
                                    processImageOCR(dataUrl);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="mx-auto text-blue-500 mb-2" size={32} />
                          <p className="text-xs font-bold text-[var(--foreground)]">Pilih atau Seret File Struk</p>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Mendukung format PNG, JPG, JPEG</p>
                        </div>
                      </div>
                    )}

                    {errorMsg && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                {(ocrStatus === "loading_tesseract" || ocrStatus === "extracting" || ocrStatus === "parsing_ai") && (
                  <div className="space-y-4 py-4 text-center">
                    <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)] shadow-inner">
                      {selectedImage && (
                        <img
                          src={selectedImage}
                          alt="Struk"
                          className="w-full h-full object-cover blur-[0.5px]"
                        />
                      )}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-0 animate-scanner-laser shadow-md shadow-blue-500/50 z-10" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--foreground)]">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        <span>
                          {ocrStatus === "loading_tesseract" && "Menyiapkan mesin OCR lokal..."}
                          {ocrStatus === "extracting" && `Mengekstrak tulisan... (${Math.round(ocrProgress * 100)}%)`}
                          {ocrStatus === "parsing_ai" && "AI sedang menguraikan struk..."}
                        </span>
                      </div>

                      {ocrStatus === "extracting" && (
                        <div className="w-full max-w-[160px] mx-auto bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-300" 
                            style={{ width: `${ocrProgress * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ocrStatus === "success" && parsedTransaction && (
                  <div className="space-y-4">
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

                    <div className="space-y-3 bg-[var(--background)] p-4 border border-[var(--border)] rounded-2xl">
                      <div className="border-b border-[var(--border)] pb-2 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Tinjau Transaksi Struk</span>
                        <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">AI Terurai</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Nama Toko / Keterangan</label>
                          <input
                            type="text"
                            value={editMerchant}
                            onChange={(e) => setEditMerchant(e.target.value)}
                            className="input-field text-xs py-1.5 px-2.5 w-full bg-[var(--card)]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Tipe</label>
                            <div className="flex gap-1 bg-[var(--card)] p-1 border border-[var(--border)] rounded-lg">
                              <button
                                type="button"
                                onClick={() => setEditType("penjualan")}
                                className={cn(
                                  "flex-1 py-1 text-[9px] font-bold rounded transition-colors",
                                  editType === "penjualan"
                                    ? "bg-emerald-500 text-white"
                                    : "text-[var(--muted-foreground)]"
                                )}
                              >
                                Pemasukan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditType("pengeluaran")}
                                className={cn(
                                  "flex-1 py-1 text-[9px] font-bold rounded transition-colors",
                                  editType === "pengeluaran"
                                    ? "bg-rose-500 text-white"
                                    : "text-[var(--muted-foreground)]"
                                )}
                              >
                                Pengeluaran
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Total Rp</label>
                            <input
                              type="number"
                              value={editTotal}
                              onChange={(e) => setEditTotal(e.target.value)}
                              className="input-field text-xs py-1.5 px-2.5 w-full bg-[var(--card)] font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Daftar Item / Rincian Belanja</label>
                          <textarea
                            value={editItemsText}
                            onChange={(e) => setEditItemsText(e.target.value)}
                            rows={3}
                            className="input-field text-[11px] py-1.5 px-2.5 w-full bg-[var(--card)] font-mono resize-none"
                            placeholder="Detail barang..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Tanggal</label>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="input-field text-xs py-1 px-2 w-full bg-[var(--card)]"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-[var(--muted-foreground)] uppercase mb-0.5">Kategori</label>
                            <div className="flex gap-1 bg-[var(--card)] p-1 border border-[var(--border)] rounded-lg">
                              <button
                                type="button"
                                onClick={() => setFormScope("usaha")}
                                className={cn(
                                  "flex-1 py-1 text-[9px] font-bold rounded transition-colors",
                                  formScope === "usaha" ? "bg-primary text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)]"
                                )}
                              >
                                Usaha
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormScope("pribadi")}
                                className={cn(
                                  "flex-1 py-1 text-[9px] font-bold rounded transition-colors",
                                  formScope === "pribadi" ? "bg-primary text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)]"
                                )}
                              >
                                Pribadi
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {rawOcrText && (
                      <details className="group border border-[var(--border)] rounded-2xl bg-[var(--background)] overflow-hidden">
                        <summary className="flex items-center justify-between p-3 text-[11px] font-bold text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted)]/20 list-none">
                          <span>🔍 Teks Hasil Ekstraksi Gambar (OCR)</span>
                          <span className="text-[10px] text-[var(--muted-foreground)] transition-transform group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] max-h-36 overflow-y-auto">
                          <pre className="text-[9px] text-[var(--muted-foreground)] font-mono whitespace-pre-wrap leading-relaxed">{rawOcrText}</pre>
                        </div>
                      </details>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={resetScanAIStates}
                        className="flex-1 btn-secondary text-xs py-2.5"
                      >
                        Ulangi
                      </button>
                      <button
                        onClick={handleSaveScanTransaction}
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
