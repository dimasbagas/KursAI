"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  Loader2,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Bot,
  RefreshCw,
  Coins
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Filter States (DagangkuAI style)
  const [timeRange, setTimeRange] = useState<"7d" | "1m" | "3m" | "6m" | "1y" | "ytd">("1m");
  const [typeFilter, setTypeFilter] = useState<"semua" | "pemasukan" | "pengeluaran">("semua");
  const [scopeFilter, setScopeFilter] = useState<"semua" | "usaha" | "pribadi">("semua");
  
  // Collapsible cards state
  const [showCharts, setShowCharts] = useState(true);
  const [collapseChart, setCollapseChart] = useState(false);
  const [collapseCategories, setCollapseCategories] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    setIsMounted(true);
    if (businessId) {
      loadTransactions();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const loadTransactions = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });
      setTransactions(data || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter by Time Range
  const getFilteredByTimeRange = (txs: Transaction[]) => {
    const now = new Date();
    return txs.filter((tx) => {
      const txDate = new Date(tx.date || tx.created_at);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeRange === "7d") return diffDays <= 7;
      if (timeRange === "1m") return diffDays <= 30;
      if (timeRange === "3m") return diffDays <= 90;
      if (timeRange === "6m") return diffDays <= 180;
      if (timeRange === "1y") return diffDays <= 365;
      if (timeRange === "ytd") {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const timeFilteredTransactions = getFilteredByTimeRange(transactions);

  // Calculate Stat Cards (based on current timeRange selection)
  const totalIncome = timeFilteredTransactions
    .filter((t) => t.type === "penjualan" || t.type === "pendapatan_lain")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = timeFilteredTransactions
    .filter((t) => t.type === "pengeluaran" || t.type === "pembelian" || t.type === "kasbon")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netProfit = totalIncome - totalExpense;
  const totalTransactionCount = timeFilteredTransactions.length;

  // 2. Filter list by scope and type tab filters
  const getFinalFilteredTransactions = () => {
    return timeFilteredTransactions.filter((tx) => {
      // Type Filter
      const isIncome = tx.type === "penjualan" || tx.type === "pendapatan_lain";
      if (typeFilter === "pemasukan" && !isIncome) return false;
      if (typeFilter === "pengeluaran" && isIncome) return false;

      // Scope Filter (Usaha vs Pribadi stored inside note bracket e.g. [Pribadi])
      const isPersonal = tx.note?.includes("[Pribadi]");
      if (scopeFilter === "usaha" && isPersonal) return false;
      if (scopeFilter === "pribadi" && !isPersonal) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const noteClean = tx.note?.replace(/^\[Pribadi\]\s*|^\[Usaha\]\s*/, "") || "";
        const matchesSearch =
          noteClean.toLowerCase().includes(query) ||
          (tx.customer_name || "").toLowerCase().includes(query) ||
          tx.type.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const finalFilteredList = getFinalFilteredTransactions();

  // Generate chart data based on time range
  const getChartData = () => {
    let days = 7;
    if (timeRange === "1m") days = 30;
    else if (timeRange === "3m") days = 90;
    else if (timeRange === "6m") days = 180;
    else if (timeRange === "1y") days = 365;
    else if (timeRange === "ytd") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diffTime = Math.abs(new Date().getTime() - startOfYear.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const dataMap: { [key: string]: { dateLabel: string; Pemasukan: number; Pengeluaran: number } } = {};
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      // Format: "18 Mei" or "2 Jun"
      const dayLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dataMap[dateStr] = { dateLabel: dayLabel, Pemasukan: 0, Pengeluaran: 0 };
    }

    timeFilteredTransactions.forEach((tx) => {
      const txDateStr = new Date(tx.date || tx.created_at).toISOString().split("T")[0];
      if (dataMap[txDateStr]) {
        const isIncome = tx.type === "penjualan" || tx.type === "pendapatan_lain";
        const val = Number(tx.amount);
        if (isIncome) {
          dataMap[txDateStr].Pemasukan += val;
        } else {
          dataMap[txDateStr].Pengeluaran += val;
        }
      }
    });

    return Object.values(dataMap);
  };

  const chartData = getChartData();

  // Group expenses by type for Categories summary
  const getExpenseCategories = () => {
    const expenses = timeFilteredTransactions.filter(
      (tx) => tx.type === "pengeluaran" || tx.type === "pembelian" || tx.type === "kasbon"
    );

    const groups = expenses.reduce((acc, tx) => {
      let typeLabel = "Pengeluaran";
      if (tx.type === "pembelian") typeLabel = "Pembelian Bahan/Stok";
      if (tx.type === "kasbon") typeLabel = "Kasbon Karyawan";
      acc[typeLabel] = (acc[typeLabel] || 0) + Number(tx.amount);
      return acc;
    }, {} as { [key: string]: number });

    const total = Object.values(groups).reduce((sum, v) => sum + v, 0);

    return Object.entries(groups).map(([label, amount]) => ({
      label,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }));
  };

  const expenseCategories = getExpenseCategories();

  const transactionLimit = 50;
  const remainingTransactions = Math.max(0, transactionLimit - transactions.length);

  return (
    <div className="space-y-6 text-[var(--foreground)] pb-12 relative">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Transaksi</h1>
          <p className="text-sm text-muted mt-1.5">Kelola arus kas masuk dan keluar bisnis Anda</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-black font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Plus size={16} />
          Tambah Transaksi
        </button>
      </div>

      {/* Time Range Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "7d", label: "7 Hari" },
          { id: "1m", label: "1 Bulan" },
          { id: "3m", label: "3 Bulan" },
          { id: "6m", label: "6 Bulan" },
          { id: "1y", label: "1 Tahun" },
          { id: "ytd", label: "YTD" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTimeRange(item.id as any)}
            className={`border px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              timeRange === item.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md shadow-primary/20"
                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Ringkasan Title and Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Ringkasan</h3>
          <p className="text-xs text-muted-dark">
            {timeRange === "7d"
              ? "7 hari terakhir"
              : timeRange === "1m"
              ? "30 hari terakhir"
              : timeRange === "3m"
              ? "90 hari terakhir"
              : timeRange === "6m"
              ? "180 hari terakhir"
              : timeRange === "1y"
              ? "1 tahun terakhir"
              : "Tahun ini (YTD)"}
          </p>
        </div>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={12} />
          {showCharts ? "Sembunyikan semua chart" : "Tampilkan semua chart"}
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-primary/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Total Pendapatan</span>
            <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
              {formatCurrency(totalIncome)}
            </div>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-red-500/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Total Pengeluaran</span>
            <div className="text-lg font-bold text-red-600 dark:text-red-400 leading-tight">
              {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>

        {/* Card 3: Laba Bersih */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/20 transition-all duration-300">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            netProfit >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            <Activity size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Laba Bersih</span>
            <div className={`text-lg font-bold leading-tight ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(netProfit)}
            </div>
          </div>
        </div>

        {/* Card 4: Jumlah Transaksi */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-blue-500/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <FileText size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Jumlah Transaksi</span>
            <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
              {totalTransactionCount}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible AreaChart (Income vs Expenses) */}
      {showCharts && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300">
          <div
            onClick={() => setCollapseChart(!collapseChart)}
            className="flex justify-between items-center p-5 border-b border-[var(--border)] cursor-pointer select-none hover:bg-[var(--muted)]"
          >
            <h3 className="text-sm font-bold text-[var(--foreground)]">Pendapatan & Pengeluaran</h3>
            {collapseChart ? <ChevronDown size={18} className="text-muted" /> : <ChevronUp size={18} className="text-muted" />}
          </div>

          {!collapseChart && (
            <div className="p-5 h-80">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84CC16" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#84CC16" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="dateLabel" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(value) => `Rp${(value / 1000).toLocaleString("id-ID")}rb`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        color: "var(--foreground)",
                        fontSize: "12px"
                      }}
                      formatter={(value: any) => [formatCurrency(value), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="Pemasukan"
                      stroke="#84CC16"
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Pengeluaran"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted text-xs">
                  Loading Chart...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Expense Categories Card */}
      {showCharts && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300">
          <div
            onClick={() => setCollapseCategories(!collapseCategories)}
            className="flex justify-between items-center p-5 border-b border-[var(--border)] cursor-pointer select-none hover:bg-[var(--muted)]"
          >
            <h3 className="text-sm font-bold text-[var(--foreground)]">Kategori Pengeluaran</h3>
            {collapseCategories ? <ChevronDown size={18} className="text-muted" /> : <ChevronUp size={18} className="text-muted" />}
          </div>

          {!collapseCategories && (
            <div className="p-5">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] text-xs font-medium">
                  Belum ada data pengeluaran
                </div>
              ) : (
                <div className="space-y-4">
                  {expenseCategories.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[var(--foreground)]">
                        <span>{item.label}</span>
                        <div className="space-x-2">
                          <span className="text-[var(--muted-foreground)]">{formatCurrency(item.amount)}</span>
                          <span className="text-primary">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters Bar Area */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-8">
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Tab 1: Pemasukan / Pengeluaran */}
          <div className="flex bg-[var(--muted)] border border-[var(--border)] rounded-full p-1 shadow-inner">
            {[
              { id: "semua", label: "Semua" },
              { id: "pemasukan", label: "Pemasukan" },
              { id: "pengeluaran", label: "Pengeluaran" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full transition-all ${
                  typeFilter === tab.id
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 2: Usaha / Pribadi */}
          <div className="flex bg-[var(--muted)] border border-[var(--border)] rounded-full p-1 shadow-inner">
            {[
              { id: "semua", label: "Semua" },
              { id: "usaha", label: "Usaha" },
              { id: "pribadi", label: "Pribadi" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScopeFilter(tab.id as any)}
                className={`text-[11px] font-semibold px-4 py-1.5 rounded-full transition-all ${
                  scopeFilter === tab.id
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Selector & Search Input */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-1 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all"
            />
          </div>
          <button className="bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Calendar size={14} />
            <span>Semua tanggal</span>
          </button>
        </div>
      </div>

      {/* Usage limit indicator */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 text-xs text-[var(--muted-foreground)] flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-yellow-400" />
          <span>
            Transaksi gratis: <strong className="text-[var(--foreground)]">{transactions.length} / {transactionLimit}</strong> terpakai. Sisa <strong className="text-primary font-bold">{remainingTransactions}</strong>.
          </span>
        </div>
        <Link href="/subscription" className="text-[10px] uppercase font-bold text-primary tracking-wider hover:underline w-fit">
          Upgrade Ke Premium &rarr;
        </Link>
      </div>

      {/* Main Table / List Area */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : finalFilteredList.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl text-center py-16 px-4">
          <ShoppingCart size={40} className="mx-auto mb-4 text-[var(--muted-foreground)] opacity-40" />
          <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Belum ada transaksi</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto mb-6">
            Catat transaksi Anda dengan menekan tombol dibawah ini atau gunakan Chat AI untuk pencatatan otomatis.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-black font-bold text-xs py-2.5 px-5 rounded-xl transition-all duration-300 shadow-md shadow-primary/5 mx-auto"
          >
            + Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Tipe</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Catatan</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Pelanggan</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Jumlah</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4 text-right">Total</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {finalFilteredList.map((tx) => {
                  const isIncome = tx.type === "penjualan" || tx.type === "pendapatan_lain";
                  const isPersonal = tx.note?.includes("[Pribadi]");
                  const displayNote = tx.note
                    ?.replace(/^\[Pribadi\]\s*|^\[Usaha\]\s*/, "")
                    ?.replace(/^\[MODAL\]\s*/, "") || "-";

                  return (
                    <tr key={tx.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isIncome 
                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25" 
                            : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {tx.type === "penjualan" 
                            ? "Penjualan" 
                            : tx.type === "pengeluaran" 
                            ? "Pengeluaran"
                            : tx.type === "pembelian"
                            ? "Pembelian"
                            : tx.type === "kasbon"
                            ? "Kasbon"
                            : "Lain-lain"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          {isPersonal && (
                            <span className="text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                              Pribadi
                            </span>
                          )}
                          {!isPersonal && tx.note?.includes("[Usaha]") && (
                            <span className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                              Usaha
                            </span>
                          )}
                          <span className="font-semibold text-[var(--foreground)]">{displayNote}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--muted-foreground)] font-medium">{tx.customer_name || "-"}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--foreground)]">{tx.quantity}</td>
                      <td className={`px-5 py-4 text-xs font-bold text-right ${
                        isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--muted-foreground)] font-semibold text-right">{formatDate(tx.date || tx.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Trigger Button (Bottom Right) */}
      <Link
        href="/ai"
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce"
        title="Buka Chat AI"
      >
        <Bot size={22} />
      </Link>

      {/* Add Transaction Modal Component */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}

function AddTransactionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState("penjualan");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [scope, setScope] = useState<"usaha" | "pribadi">("usaha");
  const [saving, setSaving] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isModalType = type === "modal";
      const dbType = isModalType ? "pendapatan_lain" : type;
      
      // Prepends [Pribadi] or [Usaha] depending on selected scope
      const scopePrefix = scope === "pribadi" ? "[Pribadi] " : "[Usaha] ";
      const noteWithPrefix = scopePrefix + (isModalType ? `[MODAL] ${note}` : note).trim();

      const { error } = await supabase.from("transactions").insert({
        business_id: businessId,
        type: dbType,
        amount: parseFloat(amount),
        note: noteWithPrefix,
        quantity: parseInt(quantity),
        customer_name: customerName || null,
        date: new Date().toISOString()
      });
      if (error) throw error;
      onSaved();
    } catch (err: any) {
      console.error("Failed to create transaction", err);
      alert("Gagal mencatat transaksi: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Tambah Transaksi Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
          {/* Usaha vs Pribadi Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Kategori Penggunaan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope("usaha")}
                className={`py-2 rounded-xl text-center border font-bold transition-all ${
                  scope === "usaha"
                    ? "bg-primary border-primary text-[var(--primary-foreground)]"
                    : "bg-[var(--muted)]/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Usaha (Bisnis)
              </button>
              <button
                type="button"
                onClick={() => setScope("pribadi")}
                className={`py-2 rounded-xl text-center border font-bold transition-all ${
                  scope === "pribadi"
                    ? "bg-purple-500 border-purple-500 text-white"
                    : "bg-[var(--muted)]/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Pribadi (Non-Bisnis)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Jenis Transaksi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field text-xs text-[var(--foreground)]">
              <option value="penjualan">Penjualan</option>
              <option value="pengeluaran">Pengeluaran</option>
              <option value="pembelian">Pembelian</option>
              <option value="kasbon">Kasbon</option>
              <option value="pendapatan_lain">Pendapatan Lain</option>
              <option value="modal">Modal Masuk</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Jumlah Item</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-field" min={1} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Total Harga (Rp)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" required min={0} placeholder="Masukkan angka" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Nama Pelanggan (opsional)</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" placeholder="Nama pelanggan" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Catatan</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input-field" rows={2} placeholder="Catatan transaksi..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-xl">Batal</button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-hover disabled:bg-primary/20 text-[var(--primary-foreground)] font-bold flex-1 py-2.5 rounded-xl transition-all"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
