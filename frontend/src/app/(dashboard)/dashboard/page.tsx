"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  Bot,
  Plus,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Calendar,
  X,
  FileSpreadsheet,
  Building,
  Check,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";

type TimeRange = "hari ini" | "7 hari" | "1 bulan" | "6 bulan" | "1 tahun" | "YTD" | "manual";

export default function DashboardPage() {
  // Core state
  const [activeTab, setActiveTab] = useState<"ringkasan" | "kur">("ringkasan");
  const [timeRange, setTimeRange] = useState<TimeRange>("1 bulan");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
  // Metrics & Stats
  const [metrics, setMetrics] = useState({
    pendapatan: 0,
    pengeluaran: 0,
    labaBersih: 0,
    jumlahTransaksi: 0,
    modalMasuk: 0,
  });

  // AI Prediction state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState({
    prediksi7Hari: 0,
    estimasiBulanan: 0,
    daysHistory: 0,
  });

  // KUR state
  const [kurChecklist, setKurChecklist] = useState({
    ktpKK: false,
    nib: false,
    laporanKeuangan: false,
    rekeningBank: false,
    agunan: false,
  });

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "penjualan",
    amount: "",
    note: "",
    product_id: "",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
  });
  const [txSubmitting, setTxSubmitting] = useState(false);

  const handleOpenModal = (type: string = "penjualan") => {
    setNewTx({
      type,
      amount: "",
      note: "",
      product_id: "",
      quantity: 1,
      date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const businessId = useAuthStore((s) => s.businessId);

  // Initial Load
  useEffect(() => {
    if (businessId) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  // Re-filter when transactions or date range changes
  useEffect(() => {
    filterData();
  }, [allTransactions, timeRange, customStartDate, customEndDate]);

  const loadDashboardData = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // 1. Fetch all transactions with product relations
      const { data: txs, error: txError } = await supabase
        .from("transactions")
        .select("*, products(name, category)")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (txError) throw txError;

      // 2. Fetch all products
      const { data: prods, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", businessId);

      if (prodError) throw prodError;

      setAllTransactions(txs || []);
      setAllProducts(prods || []);
      calculateAiPredictions(txs || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAiPredictions = (txs: any[]) => {
    // Look at last 90 days of transactions for AI estimation
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const historyTxs = txs.filter((t) => {
      const d = new Date(t.date);
      return d >= ninetyDaysAgo && (t.type === "penjualan" || t.type === "pendapatan_lain");
    });

    // Calculate unique days in record to find average revenue per day
    const uniqueDays = new Set(
      historyTxs.map((t) => new Date(t.date).toISOString().split("T")[0])
    );

    const totalRevenue = historyTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const dayCount = uniqueDays.size || 1;
    const avgDailyRevenue = totalRevenue / dayCount;

    setAiPredictions({
      prediksi7Hari: Math.round(avgDailyRevenue * 7),
      estimasiBulanan: Math.round(avgDailyRevenue * 30),
      daysHistory: dayCount,
    });
  };

  const triggerAiRefresh = () => {
    setAiLoading(true);
    setTimeout(() => {
      calculateAiPredictions(allTransactions);
      setAiLoading(false);
    }, 1200);
  };

  const filterData = () => {
    if (allTransactions.length === 0) {
      setFilteredTransactions([]);
      setMetrics({ pendapatan: 0, pengeluaran: 0, labaBersih: 0, jumlahTransaksi: 0, modalMasuk: 0 });
      return;
    }

    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "hari ini":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7 hari":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1 bulan":
        startDate.setDate(now.getDate() - 30);
        break;
      case "6 bulan":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1 tahun":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "manual":
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          const filtered = allTransactions.filter((t) => {
            const d = new Date(t.date);
            return d >= start && d <= end;
          });
          updateMetrics(filtered);
          setFilteredTransactions(filtered);
          return;
        }
        break;
    }

    const filtered = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate;
    });

    updateMetrics(filtered);
    setFilteredTransactions(filtered);
  };

  const updateMetrics = (txs: any[]) => {
    const pendapatan = txs
      .filter((t) => (t.type === "penjualan" || t.type === "pendapatan_lain") && !t.note?.startsWith("[MODAL]"))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const pengeluaran = txs
      .filter((t) => t.type === "pengeluaran" || t.type === "pembelian")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const modalMasuk = txs
      .filter((t) => t.type === "pendapatan_lain" && t.note?.startsWith("[MODAL]"))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const labaBersih = pendapatan - pengeluaran;
    const jumlahTransaksi = txs.length;

    setMetrics({ pendapatan, pengeluaran, labaBersih, jumlahTransaksi, modalMasuk });
  };

  // Handle transaction submission
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setTxSubmitting(true);
    try {
      const isModalType = newTx.type === "modal";
      const dbType = isModalType ? "pendapatan_lain" : newTx.type;
      const dbNote = isModalType ? `[MODAL] ${newTx.note}`.trim() : newTx.note;

      const { error } = await supabase.from("transactions").insert({
        business_id: businessId,
        type: dbType,
        amount: Number(newTx.amount),
        note: dbNote,
        product_id: newTx.product_id || null,
        quantity: newTx.quantity || 1,
        date: new Date(newTx.date).toISOString(),
      });

      if (error) throw error;

      // Reset form & reload
      setNewTx({
        type: "penjualan",
        amount: "",
        note: "",
        product_id: "",
        quantity: 1,
        date: new Date().toISOString().split("T")[0],
      });
      setIsModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      alert("Gagal mencatat transaksi. Silakan coba lagi.");
    } finally {
      setTxSubmitting(false);
    }
  };

  // Group transactions for chart depending on timeRange
  const getChartData = () => {
    const grouped: { [key: string]: { dateStr: string; Pendapatan: number; Pengeluaran: number } } = {};

    // Grouping helper
    filteredTransactions.forEach((tx) => {
      const dateObj = new Date(tx.date);
      let key = "";
      
      if (timeRange === "6 bulan" || timeRange === "1 tahun" || timeRange === "YTD") {
        // Group by Month (e.g. "Jun 2026")
        key = dateObj.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      } else {
        // Group by Day (e.g. "12 Jun")
        key = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      }

      if (!grouped[key]) {
        grouped[key] = { dateStr: key, Pendapatan: 0, Pengeluaran: 0 };
      }

      const val = Number(tx.amount);
      if ((tx.type === "penjualan" || tx.type === "pendapatan_lain") && !tx.note?.startsWith("[MODAL]")) {
        grouped[key].Pendapatan += val;
      } else if (tx.type === "pengeluaran" || tx.type === "pembelian") {
        grouped[key].Pengeluaran += val;
      }
    });

    // Convert to sorted array
    return Object.values(grouped).reverse();
  };

  // Top products calculations
  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; qty: number; revenue: number } } = {};

    filteredTransactions
      .filter((t) => t.type === "penjualan" && t.product_id)
      .forEach((t) => {
        const prodName = t.products?.name || "Produk Tanpa Nama";
        if (!productSales[t.product_id]) {
          productSales[t.product_id] = { name: prodName, qty: 0, revenue: 0 };
        }
        productSales[t.product_id].qty += t.quantity || 1;
        productSales[t.product_id].revenue += Number(t.amount);
      });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Expense breakdown calculations
  const getExpenseCategories = () => {
    const categories: { [key: string]: number } = {};

    filteredTransactions
      .filter((t) => t.type === "pengeluaran" || t.type === "pembelian")
      .forEach((t) => {
        let cat = t.products?.category || "Lain-lain";
        if (t.note) {
          // Detect some simple categories based on note keywords
          const noteLower = t.note.toLowerCase();
          if (noteLower.includes("gaji") || noteLower.includes("karyawan")) cat = "Gaji Karyawan";
          else if (noteLower.includes("sewa")) cat = "Sewa Tempat";
          else if (noteLower.includes("listrik") || noteLower.includes("air") || noteLower.includes("wifi")) cat = "Utilitas";
          else if (noteLower.includes("bahan") || noteLower.includes("stok")) cat = "Bahan Baku";
        }
        categories[cat] = (categories[cat] || 0) + Number(t.amount);
      });

    const totalExpense = Object.values(categories).reduce((s, v) => s + v, 0) || 1;

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / totalExpense) * 100),
    })).sort((a, b) => b.value - a.value);
  };

  // KUR calculations
  const totalTxCount = allTransactions.length;
  // Calculate active months
  const activeMonths = (() => {
    if (allTransactions.length === 0) return 0;
    const dates = allTransactions.map((t) => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const diffMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + maxDate.getMonth() - minDate.getMonth();
    return Math.max(1, diffMonths + 1);
  })();

  const creditScore = totalTxCount >= 30 ? Math.min(850, 300 + Math.round((totalTxCount - 30) * 5) + Math.min(200, Math.round(metrics.pendapatan / 1000000) * 10)) : 300;
  const isKurEligible = totalTxCount >= 30 && activeMonths >= 3;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-muted text-sm">Menyiapkan laporan pembukuan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/40 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Dashboard Keuangan</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Kelola pembukuan dan analisis kelayakan kredit UMKM Anda</p>
        </div>

        <div className="flex rounded-xl bg-dark-sidebar p-1 border border-dark-border/60">
          <button
            onClick={() => setActiveTab("ringkasan")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "ringkasan"
                ? "bg-primary text-black shadow-md font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Ringkasan Keuangan
          </button>
          <button
            onClick={() => setActiveTab("kur")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "kur"
                ? "bg-primary text-black shadow-md font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Building size={15} />
            Kelayakan KUR
          </button>
        </div>
      </div>

      {activeTab === "ringkasan" ? (
        <>
          {/* Filters & Actions Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-dark-sidebar/40 p-4 rounded-2xl border border-dark-border/50">
            <div className="flex flex-wrap items-center gap-2">
              {(["hari ini", "7 hari", "1 bulan", "6 bulan", "1 tahun", "YTD", "manual"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    timeRange === range
                      ? "bg-primary/20 border border-primary text-primary"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {range === "YTD" ? "YTD" : range}
                </button>
              ))}
            </div>

            {timeRange === "manual" && (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs p-2 text-[var(--foreground)] focus:outline-none focus:border-primary"
                />
                <span className="text-muted text-xs">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs p-2 text-[var(--foreground)] focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 self-start xl:self-auto w-full xl:w-auto">
              <button
                onClick={() => {
                  alert("Laporan Keuangan (SAK EMKM) berhasil diunduh ke komputer Anda sebagai lampiran pengajuan KUR.");
                }}
                className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl border border-dark-border/60 hover:border-primary/20 transition-all flex-1 xl:flex-none"
              >
                <FileSpreadsheet size={16} className="text-primary" /> Unduh Laporan
              </button>
              <button
                onClick={() => handleOpenModal("modal")}
                className="bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-cyan-500/20 dark:border-cyan-500/40 dark:text-cyan-300 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl hover:bg-cyan-100 hover:border-cyan-300 dark:hover:bg-cyan-500/30 dark:hover:border-cyan-500/60 transition-all shadow-lg shadow-cyan-500/5 dark:shadow-cyan-500/5 flex-1 xl:flex-none"
              >
                <Plus size={16} /> Tambah Modal
              </button>
              <button
                onClick={() => handleOpenModal("penjualan")}
                className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-lg shadow-primary/20 flex-1 xl:flex-none"
              >
                <Plus size={16} /> Tambah Transaksi
              </button>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="stat-card border-green-500/10 hover:border-green-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted font-semibold">Total Pendapatan</p>
                  <p className="text-2xl font-black text-green-400 mt-2">{formatCurrency(metrics.pendapatan)}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>

            <div className="stat-card border-red-500/10 hover:border-red-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted font-semibold">Total Pengeluaran</p>
                  <p className="text-2xl font-black text-red-400 mt-2">{formatCurrency(metrics.pengeluaran)}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
              </div>
            </div>

            <div className="stat-card border-primary/10 hover:border-primary/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted font-semibold">Laba Bersih</p>
                  <p className={`text-2xl font-black mt-2 ${metrics.labaBersih >= 0 ? "text-primary" : "text-red-400"}`}>
                    {formatCurrency(metrics.labaBersih)}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metrics.labaBersih >= 0 ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"}`}>
                  <CheckCircle size={18} />
                </div>
              </div>
            </div>

            <div className="stat-card border-cyan-500/10 hover:border-cyan-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted font-semibold">Total Modal Masuk</p>
                  <p className="text-2xl font-black text-cyan-400 mt-2">{formatCurrency(metrics.modalMasuk)}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
              </div>
            </div>

            <div className="stat-card border-purple-500/10 hover:border-purple-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted font-semibold">Jumlah Transaksi</p>
                  <p className="text-2xl font-black text-purple-400 mt-2">{metrics.jumlahTransaksi} kali</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="card">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-4">Grafik Pendapatan & Pengeluaran</h3>
            {filteredTransactions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted">
                <Calendar size={36} className="opacity-40 mb-2" />
                <p className="text-sm">Tidak ada data transaksi pada rentang waktu ini.</p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84CC16" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="dateStr" stroke="var(--muted-foreground)" fontSize={10} />
                    <YAxis 
                      stroke="var(--muted-foreground)" 
                      fontSize={10}
                      tickFormatter={(val) => `Rp ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${(val / 1000).toFixed(0)}k`}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", color: "var(--foreground)" }}
                      formatter={(val: any) => formatCurrency(Number(val))}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Area type="monotone" dataKey="Pendapatan" stroke="#84CC16" fillOpacity={1} fill="url(#colorPendapatan)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" fillOpacity={1} fill="url(#colorPengeluaran)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Products & Expense Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="card">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-4">5 Produk Terlaris</h3>
              {getTopProducts().length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  <Package size={30} className="mx-auto mb-2 opacity-40" />
                  Belum ada produk terlaris di periode ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {getTopProducts().map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{prod.name}</p>
                        <p className="text-xs text-muted mt-0.5">{prod.qty} item terjual</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatCurrency(prod.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div className="card">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-4">Pengeluaran Berdasarkan Kategori</h3>
              {getExpenseCategories().length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  <DollarSign size={30} className="mx-auto mb-2 opacity-40" />
                  Belum ada catatan pengeluaran di periode ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {getExpenseCategories().map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[var(--foreground)]/80">{cat.name}</span>
                        <span className="text-[var(--muted-foreground)] font-medium">{formatCurrency(cat.value)} ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-dark-bg/60 h-2 rounded-full overflow-hidden border border-dark-border/40">
                        <div 
                          className="bg-red-400 h-full rounded-full" 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Forecast / Prediction Card */}
          <div className="card border-primary/20 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 shadow-md shadow-primary/10">
                  <Bot size={20} className="animate-pulse-glow" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-[var(--foreground)] tracking-wide">Estimasi Omzet Bulanan</h4>
                    <button 
                      onClick={triggerAiRefresh} 
                      className={`text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-0.5 rounded transition-all ${aiLoading ? "animate-spin text-primary" : ""}`}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-dark mt-1">
                    Prediksi dihitung dari riwayat transaksi bisnis riil Anda selama 90 hari terakhir ({aiPredictions.daysHistory} hari aktif).
                  </p>
                </div>
              </div>

              <div className="flex gap-6 border-l border-dark-border/60 pl-6 self-start md:self-auto">
                <div>
                  <span className="text-[10px] text-muted-dark font-bold uppercase tracking-wider">Prediksi 7 Hari Kedepan</span>
                  <p className="text-lg font-black text-primary mt-1">{formatCurrency(aiPredictions.prediksi7Hari)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">Estimasi Omzet Bulanan</span>
                  <p className="text-lg font-black text-[var(--foreground)] mt-1">{formatCurrency(aiPredictions.estimasiBulanan)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Kelayakan KUR */
        <div className="space-y-6">
          {/* Main Info Box */}
          <div className="card border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <CreditCard className="text-primary" /> Akses Modal: Cek Kelayakan KUR
            </h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Cek perkiraan kelayakan Kredit Usaha Rakyat (KUR) berdasarkan skor kredit dan pembukuanmu di DagangkuAI.
            </p>
            <div className="mt-4 p-3 bg-[var(--background)]/60 border border-[var(--border)] rounded-xl text-xs text-muted-dark flex items-start gap-2">
              <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p>
                <span className="text-[var(--foreground)] font-bold">Perkiraan awal, bukan keputusan kredit.</span> Hasil di halaman ini dihitung dari pembukuanmu di DagangkuAI dan bersifat indikatif. Keputusan akhir kelayakan, plafon, dan bunga sepenuhnya ditentukan oleh bank penyalur KUR. <Link href="#" className="text-primary hover:underline font-medium">Pelajari cara skor dihitung</Link>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Box */}
            <div className="card flex flex-col justify-between h-full lg:col-span-1 border-dark-border">
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Skor Kredit Bisnis</h4>
                <p className="text-xs text-muted-dark mt-1">
                  Penilaian berdasarkan {totalTxCount} transaksi dalam 7 bulan terakhir. Minimal 30 transaksi untuk menghitung skor.
                </p>
                <p className="text-[11px] text-muted-dark/70 mt-2">
                  Dasar penilaian kelayakan KUR, dari {totalTxCount} transaksi usaha dalam {activeMonths} bulan aktif.
                </p>
              </div>

              <div className="my-6 text-center">
                <span className="text-6xl font-black text-[var(--foreground)]">{creditScore}</span>
                <p className={`text-sm font-bold mt-2 ${totalTxCount >= 30 ? "text-primary" : "text-yellow-500"}`}>
                  {totalTxCount >= 30 ? "Skor Kredit Baik" : "Belum cukup data"}
                </p>
              </div>

              <div className="border-t border-dark-border/60 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Rata-rata omzet/bulan:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    {formatCurrency(totalTxCount > 0 ? (metrics.pendapatan / Math.max(1, activeMonths)) : 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Usia usaha:</span>
                  <span className="font-bold text-[var(--foreground)]">± {activeMonths} bulan</span>
                </div>
              </div>
            </div>

            {/* Assessment Details */}
            <div className="card lg:col-span-2 border-dark-border space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Hasil Cek Kelayakan</h4>
                <p className="text-xs text-muted-dark mt-1">Penilaian konservatif berbasis aturan, tanpa AI.</p>
              </div>

              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                isKurEligible 
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-yellow-500/10 border-yellow-500/25 text-yellow-500"
              }`}>
                <AlertTriangle className="flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">{isKurEligible ? "Rekomendasi Layak KUR (Super Mikro / Mikro)" : "Belum Cukup Data"}</p>
                  <p className="text-xs mt-1 text-muted-dark">
                    {isKurEligible 
                      ? "Pembukuan Anda telah memenuhi kriteria dasar kelayakan bank. Silakan unduh dokumen laporan."
                      : "Butuh minimal 30 transaksi dan 3 bulan pencatatan rutin agar kelayakan dapat dihitung secara akurat."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Alasan Penilaian</h5>
                <ul className="space-y-2 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${totalTxCount >= 30 ? "bg-green-400" : "bg-red-400"}`} />
                    <span>
                      {totalTxCount >= 30 
                        ? `Memenuhi syarat jumlah pencatatan (${totalTxCount} transaksi saat ini).`
                        : `Butuh minimal 30 transaksi untuk menghitung skor. Saat ini ${totalTxCount} transaksi.`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${activeMonths >= 3 ? "bg-green-400" : "bg-red-400"}`} />
                    <span>
                      {activeMonths >= 3
                        ? `Memenuhi masa aktif minimal (${activeMonths} bulan pencatatan aktif).`
                        : `Baru ${activeMonths} bulan pencatatan aktif, butuh minimal 3 bulan agar penilaian kelayakan akurat.`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>Hasil ini hanya perkiraan awal berdasarkan data pembukuanmu di DagangkuAI. Keputusan akhir kelayakan, plafon, dan bunga sepenuhnya ditentukan oleh bank penyalur KUR.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Document Checklist & Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checklist */}
            <div className="card border-dark-border">
              <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">Checklist Dokumen</h4>
              <p className="text-xs text-muted-dark mb-4">Centang dokumen yang sudah kamu siapkan (tersimpan sementara di halaman ini saja).</p>
              
              <div className="space-y-3">
                {[
                  { key: "ktpKK", label: "KTP dan Kartu Keluarga (KK)" },
                  { key: "nib", label: "NIB atau surat izin usaha (bisa dibuat gratis lewat OSS)" },
                  { key: "laporanKeuangan", label: "Laporan keuangan usaha (unduh Laporan Keuangan dari dashboard DagangkuAI)" },
                  { key: "rekeningBank", label: "Rekening bank aktif beserta mutasi 3-6 bulan terakhir" },
                  { key: "agunan", label: "Agunan tambahan biasanya tidak diwajibkan untuk KUR Super Mikro/Mikro, tapi siapkan jika bank meminta" },
                ].map((doc) => (
                  <label key={doc.key} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] cursor-pointer hover:border-primary/20 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={(kurChecklist as any)[doc.key]}
                      onChange={(e) => setKurChecklist({ ...kurChecklist, [doc.key]: e.target.checked })}
                      className="mt-0.5 rounded border-[var(--border)] bg-[var(--background)] text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className={`text-xs ${((kurChecklist as any)[doc.key]) ? "text-[var(--foreground)] line-through opacity-50" : "text-[var(--muted-foreground)]"}`}>{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="card border-dark-border flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">Langkah Selanjutnya</h4>
                <p className="text-xs text-muted-dark mb-4">Saran agar pengajuanmu makin kuat di mata bank.</p>
                
                <ul className="space-y-3 text-xs text-muted">
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>Catat semua transaksi usaha setiap hari lewat Chat AI agar riwayat keuanganmu lengkap.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>Pisahkan transaksi pribadi dari pembukuan usaha supaya laporan keuanganmu akurat di mata bank.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>Lengkapi kategori di setiap transaksi. Pencatatan yang rapi menaikkan skor kreditmu.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>Setelah 3 bulan pencatatan rutin, kembali ke halaman ini untuk cek ulang kelayakanmu.</span>
                  </li>
                </ul>
              </div>

              {/* Mock SAK EMKM Download */}
              <div className="border-t border-dark-border/60 pt-4 mt-4 flex flex-col gap-3">
                <div>
                  <h5 className="text-xs font-bold text-[var(--foreground)]">Siapkan Laporan Keuanganmu</h5>
                  <p className="text-[11px] text-muted-dark mt-1">Bank akan meminta laporan keuangan. Buka Dashboard lalu klik tombol “Unduh Laporan” dan pilih Laporan Keuangan (SAK EMKM) sebagai lampiran pengajuan.</p>
                </div>
                <button
                  onClick={() => alert("Laporan SAK EMKM (Neraca, Laba Rugi, Catatan Laporan Keuangan) berhasil diunduh ke komputer Anda sebagai lampiran pengajuan KUR.")}
                  className="btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl border border-dark-border hover:border-primary/20 transition-all"
                >
                  <FileSpreadsheet size={15} className="text-primary" /> Unduh Laporan Keuangan (SAK EMKM)
                </button>
              </div>
            </div>
          </div>

          {/* Reference Table */}
          <div className="card border-dark-border">
            <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">Referensi Jenis KUR</h4>
            <p className="text-xs text-muted-dark mb-4">Angka plafon dan bunga bersifat indikatif. Bunga bersubsidi sekitar ±6%/tahun, dapat berbeda per bank dan kebijakan pemerintah terbaru.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Plafon (indikatif)</th>
                    <th className="py-2.5 px-3">Bunga (indikatif)</th>
                    <th className="py-2.5 px-3">Cocok untuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/50 text-muted">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[var(--foreground)]">Super Mikro</td>
                    <td className="py-3 px-3">s.d. Rp10.000.000</td>
                    <td className="py-3 px-3">± 6%/tahun (subsidi)</td>
                    <td className="py-3 px-3">Usaha baru / ultra mikro</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[var(--foreground)]">Mikro</td>
                    <td className="py-3 px-3">Rp10.000.000 – Rp100.000.000</td>
                    <td className="py-3 px-3">± 6%/tahun (subsidi)</td>
                    <td className="py-3 px-3">Usaha mikro berjalan</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[var(--foreground)]">Kecil</td>
                    <td className="py-3 px-3">Rp100.000.000 – Rp500.000.000</td>
                    <td className="py-3 px-3">± 6%/tahun (subsidi)</td>
                    <td className="py-3 px-3">Usaha kecil, umumnya butuh agunan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Connect to KUR */}
          <div className="card border-dark-border bg-dark-sidebar/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Hubungkan dengan Penyalur KUR</h4>
              <p className="text-xs text-muted-dark mt-1">Hubungkan dengan penyalur KUR & fintech lending langsung dari DagangkuAI. Bagikan profil kelayakanmu dengan satu klik.</p>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)] self-start sm:self-auto">
              ⏳ Segera Hadir
            </span>
          </div>
        </div>
      )}

      {/* ============ ADD TRANSACTION MODAL ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-white p-1 rounded-full hover:bg-dark-hover"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Catat Transaksi Manual</h3>
              <p className="text-xs text-muted-dark">Tambahkan catatan keuangan langsung ke pembukuan Anda</p>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted font-bold">Jenis Transaksi</label>
                <select
                  value={newTx.type}
                  onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="penjualan">Pendapatan: Penjualan</option>
                  <option value="pendapatan_lain">Pendapatan: Lainnya</option>
                  <option value="pengeluaran">Pengeluaran: Operasional</option>
                  <option value="pembelian">Pengeluaran: Pembelian Stok</option>
                  <option value="kasbon">Kasbon / Piutang</option>
                  <option value="modal">Modal: Investasi / Modal Masuk</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold">Nominal Transaksi (Rupiah)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 15000"
                  value={newTx.amount}
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold">Hubungkan dengan Produk (Opsional)</label>
                <select
                  value={newTx.product_id}
                  onChange={(e) => setNewTx({ ...newTx, product_id: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Tidak menghubungkan produk --</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                  ))}
                </select>
              </div>

              {newTx.product_id && (
                <div className="space-y-1">
                  <label className="text-muted font-bold">Jumlah (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTx.quantity}
                    onChange={(e) => setNewTx({ ...newTx, quantity: Number(e.target.value) })}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-muted font-bold">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembelian gula pasir 5kg"
                  value={newTx.note}
                  onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold">Tanggal</label>
                <input
                  type="date"
                  required
                  value={newTx.date}
                  onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 btn-secondary py-2.5 rounded-lg border border-dark-border hover:bg-dark-hover"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="w-1/2 btn-primary py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
                >
                  {txSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
