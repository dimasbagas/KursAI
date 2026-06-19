"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Check,
  MessageSquare,
  Bot,
  AlertTriangle,
  Coins,
  ChevronDown,
  TrendingDown,
  PhoneCall
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction } from "@/types";

interface ParsedKasbon extends Transaction {
  direction: "piutang" | "utang";
  status: "belum_lunas" | "lunas";
  dueDate: string;
  phone: string;
  cleanNote: string;
}

export default function KasbonPage() {
  const [kasbons, setKasbons] = useState<ParsedKasbon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Filters
  const [filterType, setFilterType] = useState<"semua" | "piutang" | "utang">("semua");
  const [filterStatus, setFilterStatus] = useState<"semua" | "belum_lunas" | "lunas" | "jatuh_tempo">("semua");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    if (businessId) {
      loadKasbons();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const parseKasbon = (tx: Transaction): ParsedKasbon => {
    const note = tx.note || "";
    const isKasbonFormat = note.startsWith("[KASBON]");
    
    let direction: "piutang" | "utang" = "piutang";
    let status: "belum_lunas" | "lunas" = "belum_lunas";
    let dueDate = "";
    let phone = "";
    let cleanNote = note;

    if (isKasbonFormat) {
      // RegEx parser: ^\[KASBON\]\s*\[(piutang|utang)\]\s*\[(belum_lunas|lunas)\]\s*(?:\[Due:\s*([^\]]+)\])?\s*(?:\[Phone:\s*([^\]]+)\])?\s*(.*)$
      const regex = /^\[KASBON\]\s*\[(piutang|utang)\]\s*\[(belum_lunas|lunas)\]\s*(?:\[Due:\s*([^\]]+)\])?\s*(?:\[Phone:\s*([^\]]+)\])?\s*(.*)$/i;
      const match = note.match(regex);
      if (match) {
        direction = match[1].toLowerCase() as any;
        status = match[2].toLowerCase() as any;
        dueDate = match[3] || "";
        phone = match[4] || "";
        cleanNote = match[5] || "";
      }
    } else {
      // Fallback for standard kasbon transaction item
      direction = tx.type === "pengeluaran" || tx.type === "pembelian" ? "utang" : "piutang";
      status = "belum_lunas";
    }

    return {
      ...tx,
      direction,
      status,
      dueDate,
      phone,
      cleanNote
    };
  };

  const loadKasbons = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", businessId)
        .eq("type", "kasbon")
        .order("date", { ascending: false });

      const parsed = (data || []).map((t: any) => parseKasbon(t));
      setKasbons(parsed);
    } catch (err) {
      console.error("Failed to load kasbon", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (kb: ParsedKasbon) => {
    const nextStatus: "belum_lunas" | "lunas" = kb.status === "belum_lunas" ? "lunas" : "belum_lunas";
    
    // Structure note text: [KASBON] [piutang/utang] [status] [Due: date] [Phone: phone] Clean note
    const updatedNote = `[KASBON] [${kb.direction}] [${nextStatus}] ${kb.dueDate ? `[Due: ${kb.dueDate}] ` : ""}${kb.phone ? `[Phone: ${kb.phone}] ` : ""}${kb.cleanNote}`;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ note: updatedNote })
        .eq("id", kb.id);
      if (error) throw error;
      
      // Update state locally
      setKasbons((prev) =>
        prev.map((k) => (k.id === kb.id ? { ...k, status: nextStatus, note: updatedNote } : k))
      );
    } catch (err: any) {
      console.error("Failed to toggle kasbon status", err);
      alert("Gagal memperbarui status kasbon: " + (err.message || "Terjadi kesalahan."));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan kasbon ini?")) return;
    try {
      await supabase.from("transactions").delete().eq("id", id);
      setKasbons((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete kasbon", err);
    }
  };

  const sendWhatsAppReminder = (kb: ParsedKasbon) => {
    if (!kb.phone) {
      alert("Nomor telepon tidak dicantumkan untuk kasbon ini.");
      return;
    }
    const cleanPhone = kb.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    
    const message = `Halo ${kb.customer_name || "Pelanggan"}, kami ingin mengingatkan tentang kewajiban Kasbon sebesar ${formatCurrency(kb.amount)} yang jatuh tempo pada ${kb.dueDate ? formatDate(kb.dueDate) : "-"}. Mohon untuk segera diselesaikan. Terima kasih!`;
    const encodedText = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(url, "_blank");
  };

  // 1. Filter by Direction & Status
  const getFilteredKasbons = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    return kasbons.filter((kb) => {
      // Type Filter (Piutang vs Utang)
      if (filterType === "piutang" && kb.direction !== "piutang") return false;
      if (filterType === "utang" && kb.direction !== "utang") return false;

      // Status Filter
      if (filterStatus === "belum_lunas" && kb.status !== "belum_lunas") return false;
      if (filterStatus === "lunas" && kb.status !== "lunas") return false;
      if (filterStatus === "jatuh_tempo") {
        const isOverdue = kb.status === "belum_lunas" && kb.dueDate && kb.dueDate < todayStr;
        if (!isOverdue) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          (kb.customer_name || "").toLowerCase().includes(q) ||
          kb.cleanNote.toLowerCase().includes(q) ||
          kb.phone.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredKasbons();

  // Summary Metrics (always based on total active list, unpaid only)
  const unpaidPiutang = kasbons
    .filter((k) => k.direction === "piutang" && k.status === "belum_lunas")
    .reduce((sum, k) => sum + Number(k.amount), 0);

  const unpaidPiutangCount = kasbons.filter((k) => k.direction === "piutang" && k.status === "belum_lunas").length;

  const unpaidUtang = kasbons
    .filter((k) => k.direction === "utang" && k.status === "belum_lunas")
    .reduce((sum, k) => sum + Number(k.amount), 0);

  const unpaidUtangCount = kasbons.filter((k) => k.direction === "utang" && k.status === "belum_lunas").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueCount = kasbons.filter(
    (k) => k.status === "belum_lunas" && k.dueDate && k.dueDate < todayStr
  ).length;

  return (
    <div className="space-y-6 text-[var(--foreground)] pb-12 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Utang-Piutang (Kasbon)</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1.5">Catat kasbon pelanggan dan utang ke supplier, lalu kirim pengingat tagihan lewat WhatsApp.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Plus size={16} />
          Tambah Kasbon
        </button>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Piutang Belum Lunas */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-green-500/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0">
            <Coins size={22} className="text-green-500 dark:text-green-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Piutang Belum Lunas</span>
            <div className="text-lg font-bold text-green-600 dark:text-green-400 leading-tight">
              {formatCurrency(unpaidPiutang)}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] font-medium">{unpaidPiutangCount} kasbon pelanggan</p>
          </div>
        </div>

        {/* Card 2: Utang Belum Lunas */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-orange-500/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={22} className="text-orange-500 dark:text-orange-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Utang Belum Lunas</span>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-tight">
              {formatCurrency(unpaidUtang)}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] font-medium">{unpaidUtangCount} utang ke supplier</p>
          </div>
        </div>

        {/* Card 3: Jatuh Tempo */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-red-500/20 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Jatuh Tempo / Terlambat</span>
            <div className="text-lg font-bold text-[var(--foreground)] leading-tight">
              {overdueCount}
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] font-medium">kasbon perlu ditindaklanjuti</p>
          </div>
        </div>
      </div>

      {/* Subtext info */}
      <div className="text-xs font-semibold text-[var(--muted-foreground)]">
        Piutang belum tertagih: <span className="text-green-600 dark:text-green-400 font-bold">{formatCurrency(unpaidPiutang)}</span> dari <span className="text-[var(--foreground)] font-bold">{unpaidPiutangCount} kasbon pelanggan</span>.
      </div>

      {/* Control Tabs & Action Button Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-8">
        <div className="flex bg-[var(--muted)] border border-[var(--border)] rounded-full p-1 shadow-inner">
          {[
            { id: "semua", label: "Semua" },
            { id: "piutang", label: "Piutang" },
            { id: "utang", label: "Utang" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`text-[11px] font-semibold px-5 py-1.5 rounded-full transition-all ${
                filterType === tab.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Green Add button in control row */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-2 px-5 rounded-full shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 transition-all duration-300"
        >
          <Plus size={14} />
          Tambah Kasbon
        </button>
      </div>

      {/* Search Input & Status Select Dropdown Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Cari nama pelanggan / supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--foreground)] focus:ring-1 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]"
          />
        </div>

        <div className="relative w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer font-semibold"
          >
            <option value="semua">Semua Status</option>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="lunas">Lunas</option>
            <option value="jatuh_tempo">Jatuh Tempo</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
      </div>

      {/* Main Records List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl text-center py-16 px-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins size={22} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Belum ada kasbon</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mb-6 leading-relaxed">
            Catat piutang pelanggan dan utang ke supplier supaya tidak ada tagihan yang terlewat.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-hover hover:scale-[1.02] text-[var(--primary-foreground)] font-bold text-xs py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md shadow-primary/5"
          >
            + Catat Kasbon Pertama
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Tipe</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Nama</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Catatan</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4 text-right">Jumlah</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Jatuh Tempo</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filteredList.map((kb) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = kb.status === "belum_lunas" && kb.dueDate && kb.dueDate < todayStr;

                  return (
                    <tr key={kb.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          kb.direction === "piutang" 
                            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25" 
                            : "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/25"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {kb.direction === "piutang" ? "Piutang" : "Utang"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[var(--foreground)]">
                        {kb.customer_name}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-[var(--muted-foreground)]">
                        {kb.cleanNote || "-"}
                      </td>
                      <td className={`px-5 py-4 text-xs font-bold text-right ${
                        kb.direction === "piutang" ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                      }`}>
                        {formatCurrency(kb.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {kb.dueDate ? (
                          <span className={`font-semibold ${isOverdue ? "text-red-600 dark:text-red-400" : "text-[var(--foreground)]"}`}>
                            {formatDate(kb.dueDate)}
                            {isOverdue && " (Terlambat)"}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          kb.status === "lunas"
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20"
                            : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20"
                        }`}>
                          {kb.status === "lunas" ? "Lunas" : "Belum Lunas"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Reminder (Piutang only) */}
                          {kb.direction === "piutang" && kb.status === "belum_lunas" && (
                            <button
                              onClick={() => sendWhatsAppReminder(kb)}
                              className="p-1.5 text-[var(--muted-foreground)] hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-all"
                              title="Kirim pengingat WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </button>
                          )}
                          
                          {/* Toggle Lunas */}
                          <button
                            onClick={() => handleToggleStatus(kb)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              kb.status === "lunas"
                                ? "text-orange-600 dark:text-orange-400 hover:text-orange-500 bg-orange-50 dark:bg-orange-500/5 hover:bg-orange-500/10 border-orange-200 dark:border-orange-500/20"
                                : "text-green-600 dark:text-green-400 hover:text-green-500 bg-green-50 dark:bg-green-500/5 hover:bg-green-500/10 border-green-200 dark:border-green-500/20"
                            }`}
                            title={kb.status === "lunas" ? "Tandai Belum Lunas" : "Tandai Lunas"}
                          >
                            <Check size={14} />
                          </button>
                          
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(kb.id)}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Hapus catatan"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Floating AI shortcut button */}
      <Link
        href="/ai"
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-[var(--primary-foreground)] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce"
        title="Buka Chat AI"
      >
        <Bot size={22} />
      </Link>

      {/* Add Modal */}
      {showAddModal && (
        <AddKasbonModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadKasbons();
          }}
        />
      )}
    </div>
  );
}

function AddKasbonModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [direction, setDirection] = useState<"piutang" | "utang">("piutang");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim()) return;
    setSaving(true);

    try {
      // Structure note text: [KASBON] [piutang/utang] [status] [Due: date] [Phone: phone] Clean note
      const formattedNote = `[KASBON] [${direction}] [belum_lunas] ${dueDate ? `[Due: ${dueDate}] ` : ""}${phone ? `[Phone: ${phone}] ` : ""}${note.trim()}`;

      const { error } = await supabase.from("transactions").insert({
        business_id: businessId,
        type: "kasbon",
        amount: parseFloat(amount),
        customer_name: name.trim(),
        note: formattedNote,
        quantity: 1,
        date: new Date().toISOString()
      });
      if (error) throw error;
      onSaved();
    } catch (err: any) {
      console.error("Failed to add kasbon", err);
      alert("Gagal mencatat kasbon: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Catat Kasbon Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
          {/* Tipe Selector (Piutang vs Utang) */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Jenis Kasbon</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("piutang")}
                className={`py-2 rounded-xl text-center border font-bold transition-all ${
                  direction === "piutang"
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-[var(--muted)]/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Piutang (Pelanggan Utang ke Kita)
              </button>
              <button
                type="button"
                onClick={() => setDirection("utang")}
                className={`py-2 rounded-xl text-center border font-bold transition-all ${
                  direction === "utang"
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-[var(--muted)]/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Utang (Kita Utang ke Supplier)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
              Nama {direction === "piutang" ? "Pelanggan" : "Supplier"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field placeholder:text-[var(--muted-foreground)]"
              placeholder={`Nama ${direction === "piutang" ? "pelanggan" : "supplier"}`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field placeholder:text-[var(--muted-foreground)]"
              placeholder="Jumlah utang-piutang"
              min={0}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Jatuh Tempo (opsional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">No. WhatsApp (opsional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field placeholder:text-[var(--muted-foreground)]"
                placeholder="Misal: 0812345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Catatan Tambahan</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field placeholder:text-[var(--muted-foreground)]"
              rows={2}
              placeholder="Detail barang cicilan, dll..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-xl">Batal</button>
            <button
              type="submit"
              disabled={saving}
              className={`font-bold flex-1 py-2.5 rounded-xl transition-all text-white ${
                direction === "piutang" 
                  ? "bg-green-500 hover:bg-green-600 disabled:bg-green-500/20" 
                  : "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/20"
              }`}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
