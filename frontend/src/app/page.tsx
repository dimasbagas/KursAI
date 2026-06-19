"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ArrowRight,
  TrendingUp,
  Package,
  FileText,
  DollarSign,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Play,
  ArrowUpRight,
  Zap,
  Loader2,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import TextCursorProximity from "@/components/ui/text-cursor-proximity";
import { renderCanvas } from "@/components/ui/canvas";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero-shadcnui";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

// Variants for scroll animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

const chatExamples = [
  {
    input: "Terjual 5 nasi goreng dan 3 es teh 95rb",
    output: {
      title: "Penjualan Tercatat",
      details: [
        { label: "Kategori", value: "Penjualan" },
        { label: "Item", value: "5x Nasi Goreng, 3x Es Teh" },
        { label: "Total Pendapatan", value: "Rp 95.000" },
      ],
      stock: "Stok otomatis berkurang"
    }
  },
  {
    input: "Beli kopi bubuk 2 kg 160rb untuk operasional",
    output: {
      title: "Pengeluaran Tercatat",
      details: [
        { label: "Kategori", value: "Pembelian Bahan" },
        { label: "Item", value: "2 kg Kopi Bubuk" },
        { label: "Total Pengeluaran", value: "Rp 160.000" },
      ],
      stock: "Stok otomatis bertambah"
    }
  },
  {
    input: "Hutang kasbon atas nama Budi 50rb",
    output: {
      title: "Kasbon Tercatat",
      details: [
        { label: "Kategori", value: "Kasbon/Piutang" },
        { label: "Pelanggan", value: "Budi" },
        { label: "Jumlah Kasbon", value: "Rp 50.000" },
      ],
      stock: "Jatuh tempo otomatis dipantau"
    }
  }
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading, loadUser } = useAuthStore();
  const [fastChecking, setFastChecking] = useState(true);

  useEffect(() => {
    const checkFastSession = async () => {
      try {
        if (typeof window !== "undefined") {
          const keys = Object.keys(localStorage);
          const supabaseKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
          const hasLocalToken = supabaseKey ? !!localStorage.getItem(supabaseKey) : false;

          if (hasLocalToken) {
            router.push("/dashboard");
            return; // keep fastChecking true so it stays on loading state
          }
        }
      } catch (e) {
        console.error("Fast session check failed:", e);
      }
      
      await loadUser();
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        router.push("/dashboard");
        return;
      }
      setFastChecking(false);
    };

    checkFastSession();
  }, [loadUser, router]);

  const [activeChatIndex, setActiveChatIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const proximityContainerRef = useRef<HTMLDivElement>(null);

  // Initialize interactive canvas background
  useEffect(() => {
    if (isLoading || user) return;
    
    // Safely check if canvas is in the DOM
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    try {
      renderCanvas();
    } catch (e) {
      console.error("Failed to initialize canvas:", e);
    }
  }, [isLoading, user]);

  // Auto-typing simulator with bouncing thinking bubble
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentInput = chatExamples[activeChatIndex].input;

    if (isTyping) {
      if (typedText.length < currentInput.length) {
        timer = setTimeout(() => {
          setTypedText(currentInput.slice(0, typedText.length + 1));
        }, 50);
      } else {
        setIsTyping(false);
        // Show typing indicator before response
        setShowThinking(true);
        timer = setTimeout(() => {
          setShowThinking(false);
          setShowResponse(true);
        }, 1200);
      }
    } else {
      // Show response for 5 seconds, then transition to next example
      timer = setTimeout(() => {
        setShowResponse(false);
        setTypedText("");
        setIsTyping(true);
        setActiveChatIndex((prev) => (prev + 1) % chatExamples.length);
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [typedText, isTyping, activeChatIndex]);

  if (fastChecking || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0F1117] gap-3">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-slate-400 text-sm font-semibold">Memuat halaman...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-[#17191c] selection:bg-[#fbe1d1] selection:text-[#5d2a1a] overflow-x-hidden font-sans">
      
      {/* Premium Floating Animated Blobs (Steep Palette) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] rounded-full bg-[#fbe1d1]/30 blur-[130px] animate-float-1" />
        <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#d3e3fc]/20 blur-[120px] animate-float-2" />
      </div>

      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#a3a6af]/20"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 bg-[#17191c] rounded-xl flex items-center justify-center shadow-sm"
            >
              <Bot size={20} className="text-white" />
            </motion.div>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#17191c] group-hover:text-[#5d2a1a] transition-colors">
              Kurs<span className="font-sans text-[#5d2a1a]">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#4c4c4c]">
            <Link href="#fitur" className="transition-colors hover:text-[#17191c]">Fitur</Link>
            <Link href="#cara-kerja" className="transition-colors hover:text-[#17191c]">Cara Kerja</Link>
            <Link href="#faq" className="transition-colors hover:text-[#17191c]">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#4c4c4c] hover:text-[#17191c] px-4 py-2 rounded-full hover:bg-[#f7f7f8] transition-all">
              Masuk
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/register" className="bg-[#17191c] text-white hover:bg-black font-semibold py-2 px-5 text-sm flex items-center gap-1.5 rounded-full shadow-sm">
                Daftar Gratis <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Glowy Waves */}
      <GlowyWavesHero />

      {/* Interactive App Showcase with Container Scroll (Marble / Fog Style) */}
      <section id="showcase" className="w-full bg-[#f7f7f8] py-20 relative md:-mt-10 border-t border-b border-[#a3a6af]/10">
        <ContainerScroll
          titleComponent={
            <div className="mb-6">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#17191c] tracking-[-0.025em] leading-tight">
                Intip Tampilan Aplikasi <br />
                <span className="text-4xl md:text-6xl font-serif italic text-[#5d2a1a] font-normal mt-2 block">
                  KursAI Assistant
                </span>
              </h2>
              <p className="text-sm text-[#4c4c4c] max-w-md mx-auto mt-4 leading-relaxed font-sans">
                Lihat bagaimana pencatatan chat sederhana dapat memperbarui grafik dan ringkasan keuangan UMKM Anda secara real-time.
              </p>
            </div>
          }
        >
          <div className="grid md:grid-cols-12 gap-6 items-stretch h-full w-full bg-white rounded-[24px] border border-[#a3a6af]/20 p-4 md:p-6 text-left shadow-sm">
            {/* Chat Simulator */}
            <div className="md:col-span-5 bg-[#f7f7f8] border border-[#a3a6af]/15 rounded-[24px] p-4 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 pb-3 border-b border-[#a3a6af]/15">
                <div className="w-8 h-8 rounded-lg bg-[#17191c]/5 flex items-center justify-center">
                  <Bot size={16} className="text-[#17191c]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17191c] tracking-wide">KursAI Assistant</p>
                  <span className="flex items-center gap-1.5 text-[9px] text-green-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                  </span>
                </div>
              </div>

              <div className="flex-1 py-3 space-y-3 overflow-y-auto flex flex-col justify-end min-h-[200px]">
                <div className="flex justify-end">
                  <div className="bg-[#17191c] text-white rounded-[20px] rounded-tr-[4px] px-3.5 py-2 text-[10px] font-semibold shadow-sm">
                    {typedText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </div>
                </div>

                <AnimatePresence>
                  {showThinking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-1.5 items-start"
                    >
                      <div className="w-5 h-5 rounded-lg bg-[#17191c]/5 border border-[#a3a6af]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={10} className="text-[#17191c]" />
                      </div>
                      <div className="bg-white border border-[#a3a6af]/15 rounded-full px-3 py-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-[#17191c] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-[#17191c] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-[#17191c] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2 items-start"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#17191c] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot size={12} className="text-white" />
                      </div>
                      <div className="bg-white border border-[#a3a6af]/15 rounded-[20px] rounded-tl-[4px] p-3.5 max-w-[85%] text-[10px] space-y-2 shadow-sm">
                        <div className="flex items-center gap-1 text-[#5d2a1a] font-bold">
                          <CheckCircle size={11} />
                          <span>{chatExamples[activeChatIndex].output.title}</span>
                        </div>
                        <div className="space-y-1 border-l-2 border-[#5d2a1a] pl-2 my-1 text-[#4c4c4c]">
                          {chatExamples[activeChatIndex].output.details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="text-[#777b86]">{detail.label}:</span>
                              <span className="font-semibold text-[#17191c] text-right">{detail.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-[#5d2a1a] font-bold bg-[#fbe1d1] border border-[#fbe1d1]/50 py-0.5 px-2 rounded-md w-fit">
                          <Zap size={9} />
                          <span>{chatExamples[activeChatIndex].output.stock}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2.5 border-t border-[#a3a6af]/15 bg-white/40 flex gap-2 rounded-b-[18px] px-1">
                <input
                  type="text"
                  disabled
                  placeholder="Ketik transaksi... (Mengetik otomatis)"
                  className="w-full bg-white border border-[#a3a6af]/20 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none placeholder:text-[#a3a6af]"
                />
                <button disabled className="bg-[#17191c] text-white p-2 rounded-lg opacity-80 pointer-events-none">
                  <Sparkles size={12} />
                </button>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="md:col-span-7 bg-[#f7f7f8] border border-[#a3a6af]/15 rounded-[24px] p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#fbe1d1]/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex items-center justify-between border-b border-[#a3a6af]/15 pb-2.5 mb-2.5">
                <div>
                  <h3 className="text-[11px] font-bold text-[#17191c] tracking-wide">Ringkasan Analisis Keuangan</h3>
                  <p className="text-[9px] text-[#777b86]">Statistik Terkini Bisnis</p>
                </div>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#a3a6af]/20 text-[#5d2a1a]">
                  ⚡ Real-Time
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Sky Wash widget for Income */}
                <div className="bg-[#d3e3fc] border border-[#d3e3fc]/30 p-2.5 rounded-[18px] shadow-sm">
                  <div className="flex items-center gap-1 text-[8px] text-[#17191c]/70 font-bold">
                    <span className="w-1 h-1 rounded-full bg-blue-600" />
                    <span>Masuk</span>
                  </div>
                  <p className="text-[11px] font-black text-blue-900 mt-1">Rp 4.680.000</p>
                </div>

                {/* Apricot Wash widget for Expense */}
                <div className="bg-[#fbe1d1] border border-[#fbe1d1]/30 p-2.5 rounded-[18px] shadow-sm">
                  <div className="flex items-center gap-1 text-[8px] text-[#5d2a1a] font-bold">
                    <span className="w-1 h-1 rounded-full bg-[#5d2a1a]" />
                    <span>Keluar</span>
                  </div>
                  <p className="text-[11px] font-black text-[#5d2a1a] mt-1">Rp 1.820.000</p>
                </div>

                {/* Fog / White widget for Laba */}
                <div className="bg-white border border-[#a3a6af]/15 p-2.5 rounded-[18px] shadow-sm">
                  <div className="flex items-center gap-1 text-[8px] text-[#4c4c4c] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#17191c]" />
                    <span>Laba</span>
                  </div>
                  <p className="text-[11px] font-black text-[#17191c] mt-1">Rp 2.860.000</p>
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="mt-3 p-2.5 bg-white border border-[#a3a6af]/15 rounded-[18px] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-[#17191c] tracking-wide">Tren Keuangan Mingguan</span>
                </div>
                <div className="h-16 flex items-end gap-2.5 pt-1">
                  {[55, 75, 45, 90, 60, 80, 95].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full gap-1">
                      <div className="w-full flex items-end gap-1 h-full">
                        {/* Positive Rust Accent bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.04 }}
                          className="flex-1 bg-[#5d2a1a] rounded-t-sm"
                        />
                        {/* Negative Dove Gray bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val * 0.4}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.04 }}
                          className="flex-1 bg-[#a3a6af] rounded-t-sm"
                        />
                      </div>
                      <span className="text-[6px] text-[#777b86] font-bold">M{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="mt-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-[#777b86] uppercase tracking-wider">Top Produk Terlaris</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center text-[10px] py-1.5 px-2 bg-white rounded-lg border border-[#a3a6af]/15">
                    <span className="font-semibold text-[#4c4c4c] truncate">Nasi Goreng</span>
                    <span className="font-bold text-[#5d2a1a]">Rp 4.68m</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] py-1.5 px-2 bg-white rounded-lg border border-[#a3a6af]/15">
                    <span className="font-semibold text-[#4c4c4c] truncate">Es Teh Manis</span>
                    <span className="font-bold text-[#5d2a1a]">Rp 2.70m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* Features Grid Section (Daylight / Fog Canvas) */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 md:px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20 space-y-4"
        >
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] font-normal tracking-[-0.025em]">
            Satu Chat. Semua Beres.
          </h2>
          <p className="text-base text-[#4c4c4c] leading-relaxed max-w-md mx-auto">
            Fitur andalan pembukuan modern yang disesuaikan khusus untuk ritel, kuliner, jasa, hingga toko grosir.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageSquare size={24} />}
            title="Pencatatan Otomatis"
            desc="Cukup ketik obrolan biasa seperti mengirim pesan WA ke teman. AI akan menguraikan dan menyimpan datanya otomatis."
          />
          <FeatureCard
            icon={<Package size={24} />}
            title="Stok & Inventori"
            desc="Stok berkurang otomatis tiap kali ada penjualan tercatat. Mengirimkan notifikasi instan jika stok produk kritis."
          />
          <FeatureCard
            icon={<TrendingUp size={24} />}
            title="Grafik Laba Rugi"
            desc="Analisis laporan laba kotor, bersih, pengeluaran bahan baku, dan pengeluaran operasional secara instan."
          />
          <FeatureCard
            icon={<FileText size={24} />}
            title="Invoice & Kwitansi"
            desc="Cetak atau bagikan faktur tagihan digital dengan format profesional langsung ke pelanggan via WhatsApp."
          />
          <FeatureCard
            icon={<ArrowLeftRight size={24} />}
            title="Catat Kasbon"
            desc="Kelola piutang pelanggan dan utang supplier secara terpusat untuk menghindari lupa tagihan."
          />
          <FeatureCard
            icon={<ShieldCheck size={24} />}
            title="Aman & Enkripsi"
            desc="Seluruh data Anda dienkripsi penuh di database Supabase Cloud. Keamanan privasi data bisnis Anda 100% terjaga."
          />
        </div>
      </section>

      {/* Cinematic Scroll-Triggered Animation Section */}
      <CinematicHero 
        brandName="KursAI"
        tagline1="Catat Keuangan Toko,"
        tagline2="Tinggal Chat Saja."
        cardHeading="Kemudahan Analisis Keuangan Bisnis"
        cardDescription={
          <>
            <span className="text-[#5d2a1a] font-semibold">KursAI</span> merevolusi cara UMKM mengelola pembukuan. 
            Cukup ketik transaksi Anda seperti chatting biasa, dan AI kami akan langsung menyusun laporan laba rugi, 
            memperbarui stok barang, serta melacak kasbon secara real-time.
          </>
        }
        metricValue={99}
        metricLabel="% Akurasi Deteksi AI"
        ctaHeading="Mulai Langkah Digital Anda."
        ctaDescription="Daftarkan bisnis Anda gratis sekarang juga dan rasakan kemudahan mengelola pembukuan berbasis kecerdasan buatan."
      />

      {/* How It Works (Steps) Section */}
      <section id="cara-kerja" className="w-full bg-[#f7f7f8] py-24 border-t border-b border-[#a3a6af]/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20 space-y-4"
          >
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] font-normal tracking-[-0.025em]">
              Cara Kerja KursAI
            </h2>
            <p className="text-sm text-[#4c4c4c] max-w-xs mx-auto">
              Hanya butuh 3 langkah instan untuk memodernisasi pembukuan toko Anda.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t border-dashed border-[#a3a6af]/30" />

            <StepCard
              num={1}
              title="Daftar Akun Gratis"
              desc="Mulai instan tanpa kartu kredit. Cukup daftar menggunakan akun email atau Google Anda."
            />
            <StepCard
              num={2}
              title="Ketik Obrolan Biasa"
              desc="Tulis perintah seperti 'terjual 5 mie ayam 75rb'. AI Assistant kami akan otomatis mengekstrak datanya."
            />
            <StepCard
              num={3}
              title="Pantau Keuntungan"
              desc="Dashboard akan memperbarui data secara langsung. Laba bersih dan sisa stok barang langsung terpantau."
            />
          </div>

          <div className="mt-16 text-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link href="/register" className="bg-[#17191c] text-white hover:bg-black font-semibold py-3.5 px-10 text-sm flex items-center justify-center gap-2 rounded-full shadow-md">
                Buat Akun Sekarang <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 md:px-6 py-24">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] font-normal tracking-[-0.025em]">Jawaban Pertanyaan Anda</h2>
          <p className="text-sm text-[#4c4c4c]">Berikut penjelasan lengkap mengenai penggunaan KursAI.</p>
        </motion.div>

        <div className="space-y-4">
          <FAQItem
            question="Apakah saya harus download aplikasi di Play Store?"
            answer="Tidak perlu. KursAI adalah aplikasi web (Web App) modern yang sangat ringan dan responsif. Anda hanya perlu membukanya lewat Chrome/Safari di HP, Tablet, atau Laptop kapan saja."
          />
          <FAQItem
            question="Apakah AI mengerti istilah singkatan atau bahasa informal?"
            answer="Sangat mengerti! AI kami disesuaikan khusus untuk pebisnis lokal Indonesia. AI paham singkatan nominal (seperti '15rb', '2jt', '850k'), singkatan barang, dan ungkapan kasual seperti 'tambahin stok' atau 'laku terjual'."
          />
          <FAQItem
            question="Bagaimana keamanan data pembukuan toko saya?"
            answer="Data Anda sepenuhnya aman dan privat. Seluruh data transaksi, piutang, dan stok disimpan secara terenkripsi di server database Supabase yang terlindungi. Tidak akan pernah disebarkan ke pihak manapun."
          />
          <FAQItem
            question="Apakah KursAI sepenuhnya gratis?"
            answer="Ya! Kami menyediakan paket Free selamanya dengan batas kapasitas pencatatan transaksi dasar dan manajemen stok. Bagi pelaku usaha yang membutuhkan fitur tak terbatas, kami menyediakan opsi paket Pro dengan tarif sangat terjangkau."
          />
        </div>
      </section>

      {/* Premium CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#f7f7f8] via-white to-[#fbe1d1]/20 border border-[#a3a6af]/25 rounded-[2.5rem] p-8 sm:p-16 text-center relative overflow-hidden shadow-sm"
        >
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full bg-[#fbe1d1]/30 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 rounded-full bg-[#d3e3fc]/20 blur-[80px] pointer-events-none" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] font-normal leading-tight">
              Siap Beralih ke Pembukuan Cerdas?
            </h2>
            <p className="text-sm sm:text-base text-[#4c4c4c] leading-relaxed">
              Tinggalkan pencatatan manual di kertas atau Excel yang memusingkan. Saatnya kelola bisnis lebih tertata, efisien, dan otomatis bersama KursAI.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4 inline-block">
              <Link href="/register" className="bg-[#17191c] text-white hover:bg-black font-semibold py-4 px-10 text-sm flex items-center justify-center gap-2 rounded-full shadow-md">
                Buat Akun Gratis Sekarang <ArrowUpRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#a3a6af]/15 bg-[#f7f7f8] py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#17191c] rounded-lg flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-[#17191c]">
                Kurs<span className="font-sans text-[#5d2a1a]">AI</span>
              </span>
            </Link>
            <p className="text-xs text-[#4c4c4c] leading-relaxed max-w-sm">
              KursAI membantu UMKM Indonesia merapikan pencatatan keuangan usaha secara digital dan realtime menggunakan kekuatan kecerdasan buatan (AI) yang dioperasikan dengan chat sederhana.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191c] mb-4 font-sans">Navigasi</h4>
            <ul className="space-y-2.5 text-xs text-[#4c4c4c] font-medium font-sans">
              <li><Link href="#fitur" className="hover:text-[#17191c] transition-colors">Fitur</Link></li>
              <li><Link href="#cara-kerja" className="hover:text-[#17191c] transition-colors">Cara Kerja</Link></li>
              <li><Link href="#faq" className="hover:text-[#17191c] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17191c] mb-4 font-sans">Legalitas</h4>
            <ul className="space-y-2.5 text-xs text-[#4c4c4c] font-medium font-sans">
              <li><Link href="/terms" className="hover:text-[#17191c] transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="hover:text-[#17191c] transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 mt-10 border-t border-[#a3a6af]/15 text-center md:flex md:justify-between md:items-center text-xs text-[#777b86] space-y-3 md:space-y-0 font-sans">
          <p>© {new Date().getFullYear()} KursAI. Dibuat untuk kesuksesan bisnis UMKM Indonesia.</p>
          <div className="flex justify-center gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-[#17191c]/70">Semua Sistem Operasional</span>
          </div>
        </div>
      </footer>
      {/* Interactive mouse-trail canvas background */}
      <canvas
        className="pointer-events-none absolute inset-0 w-full h-full -z-20 opacity-20"
        id="canvas"
      ></canvas>
    </div>
  );
}


// Sub-component for Feature Cards (Steep Style: 24px ceramic tile card)
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="bg-[#f7f7f8] border border-[#a3a6af]/15 p-6 rounded-[24px] hover:border-[#5d2a1a]/30 transition-all duration-300 group shadow-sm cursor-pointer relative"
    >
      <div className="w-12 h-12 bg-[#fbe1d1] rounded-2xl flex items-center justify-center mb-5 text-[#5d2a1a] group-hover:bg-[#17191c] group-hover:text-white transition-all duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-bold mb-2.5 text-[#17191c] tracking-wide group-hover:text-[#5d2a1a] transition-colors">{title}</h3>
      <p className="text-xs sm:text-sm text-[#4c4c4c] leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Sub-component for Step Cards (Steep Style: 24px ceramic tile card)
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="text-center relative space-y-4 bg-white border border-[#a3a6af]/15 p-6 rounded-[24px] shadow-sm transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-full bg-[#17191c] text-white font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
        {num}
      </div>
      <h3 className="text-base font-bold tracking-wide text-[#17191c]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#4c4c4c] max-w-xs mx-auto leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Sub-component for FAQ Items (Accordion Style)
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#f7f7f8]/80 border border-[#a3a6af]/15 rounded-[18px] overflow-hidden transition-all duration-300 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4.5 sm:p-5.5 text-left text-sm font-bold text-[#17191c] hover:bg-[#f7f7f8] transition-colors"
      >
        <div className="flex gap-3.5 items-center">
          <HelpCircle size={18} className="text-[#5d2a1a] flex-shrink-0" />
          <span>{question}</span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-[#777b86] flex-shrink-0 ml-2 text-[10px]"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="p-5 sm:p-6 pt-0 border-t border-[#a3a6af]/10 text-xs sm:text-sm text-[#4c4c4c] leading-relaxed bg-white/20">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
