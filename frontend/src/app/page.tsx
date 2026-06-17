"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  const [activeChatIndex, setActiveChatIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const proximityContainerRef = useRef<HTMLDivElement>(null);

  // Initialize interactive canvas background
  useEffect(() => {
    try {
      renderCanvas();
    } catch (e) {
      console.error("Failed to initialize canvas:", e);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-dark-bg text-white selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      
      {/* Premium Floating Animated Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] animate-float-1" />
        <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-secondary/8 blur-[120px] animate-float-2" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-float-2" />
      </div>

      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-dark-bg/75 backdrop-blur-xl border-b border-dark-border"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Bot size={20} className="text-black" />
            </motion.div>
            <span className="font-bold text-2xl tracking-tight text-white group-hover:text-primary transition-colors">
              Kurs<span className="text-primary text-gradient">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
            <Link href="#fitur" className="transition-colors hover:text-primary">Fitur</Link>
            <Link href="#cara-kerja" className="transition-colors hover:text-primary">Cara Kerja</Link>
            <Link href="#faq" className="transition-colors hover:text-primary">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-muted hover:text-white px-4 py-2 rounded-full hover:bg-dark-hover transition-all">
              Masuk
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/register" className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5 rounded-full shadow-lg shadow-primary/25">
                Daftar Gratis <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>


      {/* Hero Section with Glowy Waves */}
      <GlowyWavesHero />


      {/* Interactive App Showcase with Container Scroll */}
      <section id="showcase" className="w-full bg-dark-bg relative md:-mt-20">
        <ContainerScroll
          titleComponent={
            <div className="mb-4">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Intip Tampilan Aplikasi <br />
                <span className="text-4xl md:text-[5.5rem] font-black mt-2 leading-none text-gradient block">
                  KursAI Assistant
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto mt-4 leading-relaxed">
                Scroll ke bawah untuk melihat bagaimana dashboard pembukuan Anda ter-update secara otomatis saat Anda melakukan pencatatan.
              </p>
            </div>
          }
        >
          <div className="grid md:grid-cols-12 gap-5 items-stretch h-full w-full bg-dark-sidebar p-4 md:p-6 text-left">
            {/* Chat Simulator */}
            <div className="md:col-span-5 bg-dark-bg/40 border border-dark-border/80 rounded-2xl p-4 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 pb-3 border-b border-dark-border/60">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot size={16} className="text-primary animate-pulse-glow" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white tracking-wide">KursAI Assistant</p>
                  <span className="flex items-center gap-1.5 text-[8px] text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Online
                  </span>
                </div>
              </div>

              <div className="flex-1 py-3 space-y-3 overflow-y-auto bg-dark-bg/10 flex flex-col justify-end">
                <div className="flex justify-end">
                  <div className="bg-primary text-black rounded-xl rounded-tr-sm px-3.5 py-2 text-[10px] font-bold shadow-md">
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
                      <div className="w-5 h-5 rounded-lg bg-primary/25 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={10} className="text-primary" />
                      </div>
                      <div className="bg-dark-card border border-dark-border rounded-full px-3 py-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                      <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                        <Bot size={12} className="text-black" />
                      </div>
                      <div className="bg-dark-card border border-primary/20 rounded-xl rounded-tl-sm p-3 max-w-[85%] text-[10px] space-y-2 shadow-xl">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <CheckCircle size={11} />
                          <span>{chatExamples[activeChatIndex].output.title}</span>
                        </div>
                        <div className="space-y-1 border-l border-primary/30 pl-2 my-1">
                          {chatExamples[activeChatIndex].output.details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="text-muted">{detail.label}:</span>
                              <span className="font-semibold text-white text-right">{detail.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-green-400 font-bold bg-green-500/10 border border-green-500/15 py-0.5 px-2 rounded-md w-fit">
                          <Zap size={9} />
                          <span>{chatExamples[activeChatIndex].output.stock}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2.5 border-t border-dark-border bg-dark-sidebar/40 flex gap-2">
                <input
                  type="text"
                  disabled
                  placeholder="Ketik transaksi... (Mengetik otomatis)"
                  className="input-field py-1.5 px-3 text-[10px] flex-1 pointer-events-none bg-dark-bg/60 border-dark-border/80"
                />
                <button disabled className="btn-primary p-2 pointer-events-none opacity-50 rounded-lg">
                  <Sparkles size={12} />
                </button>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="md:col-span-7 bg-dark-bg/30 border border-dark-border/40 rounded-2xl p-4 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex items-center justify-between border-b border-dark-border/30 pb-2.5 mb-2.5">
                <div>
                  <h3 className="text-[11px] font-bold text-white tracking-wide">Ringkasan Analisis Keuangan</h3>
                  <p className="text-[9px] text-muted">Statistik Terkini Bisnis</p>
                </div>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border text-primary">
                  ⚡ Real-Time
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="card p-2 bg-dark-bg/60 border-dark-border/80 rounded-xl">
                  <div className="flex items-center gap-1 text-[8px] text-muted font-medium">
                    <span className="w-1 h-1 rounded-full bg-green-400" />
                    <span>Masuk</span>
                  </div>
                  <p className="text-xs font-black text-green-400 mt-1">Rp 4.680.000</p>
                </div>

                <div className="card p-2 bg-dark-bg/60 border-dark-border/80 rounded-xl">
                  <div className="flex items-center gap-1 text-[8px] text-muted font-medium">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    <span>Keluar</span>
                  </div>
                  <p className="text-xs font-black text-red-400 mt-1">Rp 1.820.000</p>
                </div>

                <div className="card p-2 bg-dark-bg/60 border-dark-border/80 rounded-xl">
                  <div className="flex items-center gap-1 text-[8px] text-muted font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Laba</span>
                  </div>
                  <p className="text-xs font-black text-primary mt-1">Rp 2.860.000</p>
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="mt-3 p-2 bg-dark-bg/30 border border-dark-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white tracking-wide">Tren Keuangan Mingguan</span>
                </div>
                <div className="h-16 flex items-end gap-2.5 pt-1">
                  {[55, 75, 45, 90, 60, 80, 95].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full gap-1">
                      <div className="w-full flex items-end gap-1 h-full">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.04 }}
                          className="flex-1 bg-green-400/80 rounded-t-sm"
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val * 0.4}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.04 }}
                          className="flex-1 bg-red-400/80 rounded-t-sm"
                        />
                      </div>
                      <span className="text-[6px] text-muted-dark font-bold">M{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="mt-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Top Produk Terlaris</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center text-[10px] py-1.5 px-2 bg-dark-bg/60 rounded-lg border border-dark-border/80">
                    <span className="font-semibold text-white truncate">Nasi Goreng</span>
                    <span className="font-bold text-primary">Rp 4.68m</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] py-1.5 px-2 bg-dark-bg/60 rounded-lg border border-dark-border/80">
                    <span className="font-semibold text-white truncate">Es Teh Manis</span>
                    <span className="font-bold text-primary">Rp 2.70m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>


      {/* Features Grid Section */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 md:px-6 py-24 border-t border-dark-border/50">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20 space-y-4"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Satu Chat. Semua Beres.
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-lg mx-auto">
            Fitur andalan pembukuan modern yang disesuaikan khusus untuk ritel, kuliner, jasa, hingga toko grosir.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageSquare size={24} />}
            title="Pencatatan Otomatis"
            desc="Cukup katik obrolan biasa seperti mengirim pesan WA ke teman. AI akan menguraikan dan menyimpan datanya otomatis."
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
            <span className="text-primary font-semibold">KursAI</span> merevolusi cara UMKM mengelola pembukuan. 
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
      <section id="cara-kerja" className="max-w-6xl mx-auto px-4 md:px-6 py-24 border-t border-dark-border/50">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20 space-y-4"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Cara Kerja KursAI
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-sm mx-auto">
            Hanya butuh 3 langkah instan untuk memodernisasi pembukuan toko Anda.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t border-dashed border-dark-border/80" />

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

        <div className="mt-20 text-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Link href="/register" className="btn-primary py-4 px-10 text-base flex items-center justify-center gap-2 rounded-full shadow-2xl shadow-primary/30">
              Buat Akun Sekarang <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 md:px-6 py-24 border-t border-dark-border/50">

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Jawaban Pertanyaan Anda</h2>
          <p className="text-sm sm:text-base text-muted">Berikut penjelasan lengkap mengenai penggunaan KursAI.</p>
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
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="card bg-gradient-to-br from-dark-sidebar via-dark-card to-dark-hover border border-dark-border/80 rounded-[2.5rem] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl"
        >
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 rounded-full bg-secondary/10 blur-[80px] pointer-events-none" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Siap Beralih ke Pembukuan Cerdas?
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Tinggalkan pencatatan manual di kertas atau Excel yang memusingkan. Saatnya kelola bisnis lebih tertata, efisien, dan otomatis bersama KursAI.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-4 inline-block">
              <Link href="/register" className="btn-primary py-4 px-10 text-base flex items-center justify-center gap-2 rounded-full shadow-2xl shadow-primary/30">
                Buat Akun Gratis Sekarang <ArrowUpRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-sidebar/40 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot size={18} className="text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Kurs<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-xs text-muted leading-relaxed max-w-sm">
              KursAI membantu UMKM Indonesia merapikan pencatatan keuangan usaha secara digital dan realtime menggunakan kekuatan kecerdasan buatan (AI) yang dioperasikan dengan chat sederhana.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-xs text-muted font-medium">
              <li><Link href="#fitur" className="hover:text-primary transition-colors">Fitur</Link></li>
              <li><Link href="#cara-kerja" className="hover:text-primary transition-colors">Cara Kerja</Link></li>
              <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legalitas</h4>
            <ul className="space-y-2.5 text-xs text-muted font-medium">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 mt-10 border-t border-dark-border/40 text-center md:flex md:justify-between md:items-center text-xs text-muted-dark space-y-3 md:space-y-0">
          <p>© {new Date().getFullYear()} KursAI. Dibuat untuk kesuksesan bisnis UMKM Indonesia.</p>
          <div className="flex justify-center gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-white/70">Semua Sistem Operasional</span>
          </div>
        </div>
      </footer>
      {/* Interactive mouse-trail canvas background */}
      <canvas
        className="pointer-events-none absolute inset-0 w-full h-full -z-20 opacity-30"
        id="canvas"
      ></canvas>
    </div>
  );
}


// Sub-component for Feature Cards
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 20 }}
      className="card bg-dark-sidebar/40 border border-dark-border p-6.5 rounded-[20px] hover:border-primary/40 transition-all duration-300 group shadow-md hover:shadow-primary/5 cursor-pointer relative"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300 shadow-md">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2.5 text-white tracking-wide group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs sm:text-sm text-muted leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Sub-component for Step Cards
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className="text-center relative space-y-4 bg-dark-sidebar/20 border border-dark-border/40 p-6 rounded-3xl hover:border-primary/25 transition-all"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary text-black font-extrabold text-xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
        {num}
      </div>
      <h3 className="text-lg font-bold tracking-wide text-white">{title}</h3>
      <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Sub-component for FAQ Items
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card bg-dark-sidebar/30 border border-dark-border/80 rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4.5 sm:p-5.5 text-left text-sm font-bold text-white hover:bg-dark-hover/20 transition-colors"
      >
        <div className="flex gap-3.5 items-center">
          <HelpCircle size={18} className="text-primary flex-shrink-0" />
          <span>{question}</span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-muted flex-shrink-0 ml-2 text-[10px]"
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
            <p className="p-5 sm:p-6 pt-0 border-t border-dark-border/30 text-xs sm:text-sm text-muted leading-relaxed bg-dark-bg/10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
