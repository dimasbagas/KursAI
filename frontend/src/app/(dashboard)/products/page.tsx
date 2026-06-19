"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  Package,
  AlertTriangle,
  Edit3,
  Trash2,
  MoreVertical,
  Bot,
  TrendingUp,
  Coins,
  Check,
  X
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal configurations
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Active Action Menu Dropdown State (maps to product ID)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    setIsMounted(true);
    if (businessId) {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  // Click listener to dismiss action dropdowns
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const loadProducts = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = async (p: Product) => {
    const isCurrentlyTracking = !p.description?.includes("[TRACK:false]");
    const cleanDesc = (p.description || "").replace(/\[TRACK:false\]/g, "").trim();
    const nextDescription = isCurrentlyTracking
      ? `${cleanDesc} [TRACK:false]`.trim()
      : cleanDesc;

    try {
      await supabase
        .from("products")
        .update({ description: nextDescription })
        .eq("id", p.id);

      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, description: nextDescription } : item))
      );
    } catch (err) {
      console.error("Failed to toggle stock tracking", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      await supabase.from("products").delete().eq("id", id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  // Helper selectors
  const isTracking = (p: Product) => {
    return !p.description?.includes("[TRACK:false]");
  };

  const getCleanDescription = (p: Product) => {
    return (p.description || "").replace(/\[TRACK:false\]/g, "").trim();
  };

  const calculateMargin = (buyPrice: number, sellPrice: number) => {
    if (sellPrice <= 0) return 0;
    return Math.round(((sellPrice - buyPrice) / sellPrice) * 100);
  };

  // 1. Alert box products (stock <= min_stock)
  const lowStockProducts = products.filter(
    (p) => isTracking(p) && p.min_stock > 0 && p.stock <= p.min_stock
  );

  // 2. Filter list by search query
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const cleanDesc = getCleanDescription(p);
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      cleanDesc.toLowerCase().includes(q)
    );
  });

  // 3. Stat Cards Calculations
  const totalStockValueHPP = products.reduce((sum, p) => sum + p.stock * p.buy_price, 0);
  const totalPotentialSales = products.reduce((sum, p) => sum + p.stock * p.sell_price, 0);
  const activeProductCount = products.length;
  
  const almostOutOfStockCount = products.filter(
    (p) => isTracking(p) && p.min_stock > 0 && p.stock <= p.min_stock && p.stock > 0
  ).length;

  const outOfStockCount = products.filter((p) => isTracking(p) && p.stock === 0).length;

  const averageMargin = products.length > 0
    ? Math.round(
        products.reduce((sum, p) => sum + calculateMargin(p.buy_price, p.sell_price), 0) /
          products.length
      )
    : 0;

  // 4. Status Stock PieChart Data
  const getPieChartData = () => {
    let tersedia = 0;
    let hampirHabis = 0;
    let habis = 0;

    products.forEach((p) => {
      if (!isTracking(p)) return;
      if (p.stock === 0) habis++;
      else if (p.min_stock > 0 && p.stock <= p.min_stock) hampirHabis++;
      else tersedia++;
    });

    return [
      { name: "Tersedia", value: tersedia, color: "#84CC16" },
      { name: "Hampir Habis", value: hampirHabis, color: "#F97316" },
      { name: "Habis", value: habis, color: "#EF4444" }
    ].filter((item) => item.value > 0);
  };

  const pieData = getPieChartData();

  // 5. Highest Value Stock Breakdown
  const topValuedProducts = [...products]
    .map((p) => ({ ...p, totalValue: p.stock * p.buy_price }))
    .filter((p) => p.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const highestValueAmount = topValuedProducts.length > 0 ? topValuedProducts[0].totalValue : 1;

  return (
    <div className="space-y-6 text-white pb-12 relative">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Stok & Inventaris</h1>
          <p className="text-sm text-muted mt-1.5">Kelola produk, HPP, dan stok. Penjualan produk yang dilacak otomatis mengurangi stok.</p>
        </div>
        <button
          onClick={() => {
            setModalMode("add");
            setSelectedProduct(null);
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {/* Warning low stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/35 rounded-2xl p-5 flex items-start gap-4 animate-fade-in shadow-lg shadow-orange-500/5">
          <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-orange-400">
              {lowStockProducts.length} produk hampir habis
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-300">
              {lowStockProducts.map((p) => (
                <span key={p.id} className="bg-orange-500/20 text-orange-300 border border-orange-500/25 px-2 py-0.5 rounded-md">
                  {p.name} (sisa {p.stock} {p.unit || "pcs"})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Stok (3x2 stat cards grid) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Ringkasan Stok</h3>
          <button className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Sembunyikan semua chart
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Card 1: Nilai Stok HPP */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-primary/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 dark:text-green-400 flex items-center justify-center flex-shrink-0">
              <Coins size={22} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Nilai Stok (HPP)</span>
              <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
                {formatCurrency(totalStockValueHPP)}
              </div>
            </div>
          </div>

          {/* Card 2: Potensi Jual */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-primary/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 dark:text-green-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Potensi Jual</span>
              <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
                {formatCurrency(totalPotentialSales)}
              </div>
            </div>
          </div>

          {/* Card 3: Produk Aktif */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-primary/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Package size={22} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Produk Aktif</span>
              <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
                {activeProductCount}
              </div>
            </div>
          </div>

          {/* Card 4: Hampir Habis */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-orange-500/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Hampir Habis</span>
              <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
                {almostOutOfStockCount}
              </div>
            </div>
          </div>

          {/* Card 5: Stok Habis */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-red-500/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <X size={22} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Stok Habis</span>
              <div className="text-lg font-bold text-red-600 dark:text-red-400 leading-tight">
                {outOfStockCount}
              </div>
            </div>
          </div>

          {/* Card 6: Rata-rata Margin */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-primary/20 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} className="text-primary" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Rata-rata Margin</span>
              <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
                {averageMargin}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row containing radial donut status chart and highest value list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Status Stok Produk */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Status Stok Produk</h3>
          </div>
          <div className="p-6 flex flex-col items-center justify-center min-h-60 relative">
            {isMounted && pieData.length > 0 ? (
              <>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Horizontal legends */}
                <div className="flex gap-4 justify-center mt-3 text-xs font-semibold">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 select-none">
                      <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-[var(--muted-foreground)]">{item.name}</span>
                      <span className="text-[var(--foreground)]">({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs font-bold text-[var(--muted-foreground)] py-12">
                Belum ada data pelacakan stok produk
              </div>
            )}
          </div>
        </div>

        {/* Card: Nilai Stok Tertinggi */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Nilai Stok Tertinggi</h3>
          </div>
          <div className="p-6 flex flex-col justify-center min-h-60">
            {topValuedProducts.length === 0 ? (
              <div className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-12">
                Belum ada nilai stok untuk ditampilkan.
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {topValuedProducts.map((p, idx) => {
                  const pct = Math.round((p.totalValue / highestValueAmount) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--foreground)]">{p.name}</span>
                        <div className="space-x-2">
                          <span className="text-[var(--muted-foreground)]">{p.stock} {p.unit || "pcs"}</span>
                          <span className="text-primary font-bold">{formatCurrency(p.totalValue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--muted)]/50 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control bar: search and table button */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mt-8">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]"
          />
        </div>

        <button
          onClick={() => {
            setModalMode("add");
            setSelectedProduct(null);
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-2.5 px-6 rounded-full shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 transition-all duration-300 w-fit"
        >
          <Plus size={14} />
          Tambah Produk
        </button>
      </div>

      {/* Products Records Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl text-center py-16 px-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={22} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Belum ada produk</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mb-6 leading-relaxed">
            Tambahkan produk lewat tombol "Tambah Produk" untuk mengelola HPP dan stok. Produk juga dibuat otomatis saat mencatat penjualan lewat Chat AI.
          </p>
          <button
            onClick={() => {
              setModalMode("add");
              setSelectedProduct(null);
              setShowModal(true);
            }}
            className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md shadow-primary/5"
          >
            + Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Produk</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Stok</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">HPP</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Harga Jual</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Margin</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Ambang</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Lacak</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filtered.map((p) => {
                  const trackingActive = isTracking(p);
                  const isLow = trackingActive && p.min_stock > 0 && p.stock <= p.min_stock;
                  const marginPct = calculateMargin(p.buy_price, p.sell_price);

                  return (
                    <tr key={p.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--foreground)]">
                        {p.name}
                        {p.sku && <p className="text-[10px] text-[var(--muted-foreground)] font-medium mt-0.5">SKU: {p.sku}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={isLow ? "text-red-500" : "text-[var(--foreground)]"}>
                            {p.stock}
                          </span>
                          <span className="text-[var(--muted-foreground)] font-medium">{p.unit || "pcs"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--muted-foreground)]">
                        {formatCurrency(p.buy_price)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--foreground)]">
                        {formatCurrency(p.sell_price)}
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-green-600 dark:text-green-400">
                        {marginPct}%
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--muted-foreground)]">
                        {p.min_stock > 0 ? p.min_stock : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={trackingActive}
                            onChange={() => handleToggleTracking(p)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4 relative">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === p.id ? null : p.id);
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Action Dropdown Menu */}
                          {activeMenuId === p.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-12 top-2 z-30 w-32 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 shadow-2xl space-y-0.5 animate-fade-in text-xs font-bold"
                            >
                              <button
                                onClick={() => {
                                  setModalMode("edit");
                                  setSelectedProduct(p);
                                  setShowModal(true);
                                  setActiveMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full p-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all"
                              >
                                <Edit3 size={12} />
                                Edit Produk
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteProduct(p.id);
                                  setActiveMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full p-2 text-left text-red-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={12} />
                                Hapus Produk
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating AI launcher bot trigger */}
      <Link
        href="/ai"
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-[var(--primary-foreground)] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce"
        title="Buka Chat AI"
      >
        <Bot size={22} />
      </Link>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <AddEditProductModal
          mode={modalMode}
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  mode: "add" | "edit";
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

function AddEditProductModal({ mode, product, onClose, onSaved }: ModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("0");
  const [buyPrice, setBuyPrice] = useState("0");
  const [sellPrice, setSellPrice] = useState("0");
  const [minStock, setMinStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [lacakStok, setLacakStok] = useState(true);
  const [saving, setSaving] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    if (mode === "edit" && product) {
      setName(product.name);
      setSku(product.sku || "");
      setCategory(product.category || "");
      setStock((product.stock ?? 0).toString());
      setBuyPrice((product.buy_price ?? (product as any).cost_price ?? 0).toString());
      setSellPrice((product.sell_price ?? (product as any).price ?? 0).toString());
      setMinStock(product.min_stock > 0 ? product.min_stock.toString() : "");
      setUnit(product.unit || "pcs");
      setLacakStok(!product.description?.includes("[TRACK:false]"));
    }
  }, [mode, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const isTrackingTag = lacakStok ? "" : "[TRACK:false]";
    const cleanDesc = isTrackingTag;

    try {
      if (mode === "add") {
        const { error } = await supabase.from("products").insert({
          business_id: businessId,
          name: name.trim(),
          sku: sku.trim() || null,
          category: category.trim() || null,
          stock: parseInt(stock) || 0,
          buy_price: parseFloat(buyPrice) || 0,
          sell_price: parseFloat(sellPrice) || 0,
          min_stock: parseInt(minStock) || 0,
          unit: unit.trim() || "pcs",
          description: cleanDesc || null
        });
        if (error) throw error;
      } else if (mode === "edit" && product) {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            sku: sku.trim() || null,
            category: category.trim() || null,
            stock: parseInt(stock) || 0,
            buy_price: parseFloat(buyPrice) || 0,
            sell_price: parseFloat(sellPrice) || 0,
            min_stock: parseInt(minStock) || 0,
            unit: unit.trim() || "pcs",
            description: cleanDesc || null
          })
          .eq("id", product.id);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      console.error("Failed to save product", err);
      alert("Gagal menyimpan produk: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
            {mode === "add" ? "Tambah Produk Baru" : "Edit Info Produk"}
          </h2>
          <button onClick={onClose} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Nama Produk</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field placeholder:text-[var(--muted-foreground)]"
              placeholder="cth. Kopi Susu Gula Aren"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Kategori (opsional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field placeholder:text-[var(--muted-foreground)]"
                placeholder="cth. Minuman"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">SKU / Kode (opsional)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="input-field placeholder:text-[var(--muted-foreground)]"
                placeholder="Kode barcode"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Satuan Unit</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-field placeholder:text-[var(--muted-foreground)]"
                placeholder="cth. pcs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Stok Awal</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input-field text-[var(--foreground)]"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">HPP / Harga Modal (Rp)</label>
              <input
                type="number"
                required
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="input-field text-[var(--foreground)]"
                min={0}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Harga Jual (Rp)</label>
              <input
                type="number"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="input-field text-[var(--foreground)]"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Ambang Stok Menipis</label>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="input-field placeholder:text-[var(--muted-foreground)]"
              placeholder="Kosongkan = tanpa alert"
              min={0}
            />
          </div>

          {/* Toggle Lacak Stok */}
          <div className="flex items-center justify-between bg-[var(--muted)]/20 border border-[var(--border)] p-3.5 rounded-xl">
            <div className="space-y-0.5 pr-2">
              <span className="text-[11px] font-bold text-[var(--foreground)] block">Lacak Stok</span>
              <p className="text-[10px] text-[var(--muted-foreground)] leading-normal">
                Penjualan produk ini otomatis mengurangi stok.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lacakStok}
                onChange={() => setLacakStok(!lacakStok)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
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
