"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  HelpCircle,
  FileText,
  FileCheck,
  Settings,
  Building,
  ArrowRight,
  TrendingUp,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function AksesModalPage() {
  const [loading, setLoading] = useState(true);
  const [txCount, setTxCount] = useState(0);
  const [activeMonths, setActiveMonths] = useState(0);
  const [avgOmzet, setAvgOmzet] = useState(0);
  const [creditScore, setCreditScore] = useState(300);
  
  // Checklist state stored in localStorage
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    ktp: false,
    nib: false,
    laporan: false,
    rekening: false,
    agunan: false
  });

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    // Load checklist from localStorage if available
    const saved = localStorage.getItem("kursai_modal_checklist");
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse checklist", e);
      }
    }

    if (businessId) {
      calculateCreditMetrics();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const calculateCreditMetrics = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      // Fetch all transactions
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", businessId);

      if (error) throw error;

      const count = txs?.length || 0;
      setTxCount(count);

      if (count === 0) {
        setCreditScore(300);
        setActiveMonths(0);
        setAvgOmzet(0);
        return;
      }

      // Calculate active months
      const dates = txs.map((tx: any) => new Date(tx.date || tx.created_at).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(); // Compare to today
      
      const diffYears = maxDate.getFullYear() - minDate.getFullYear();
      const diffMonths = (diffYears * 12) + (maxDate.getMonth() - minDate.getMonth());
      const months = Math.max(1, diffMonths); // Minimum 1 month if there's data
      setActiveMonths(months);

      // Calculate monthly turnover (omzet)
      const totalIncome = txs
        .filter((tx: any) => tx.type === "penjualan" || tx.type === "pendapatan_lain")
        .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
      
      const averageOmzet = totalIncome / months;
      setAvgOmzet(averageOmzet);

      // Score calculation logic (rule-based)
      if (count < 30 || months < 3) {
        setCreditScore(300); // Insufficient data default
      } else {
        // Base score
        let score = 550;

        // Points for transaction frequency
        if (count >= 100) score += 80;
        else if (count >= 50) score += 40;

        // Points for business age (active months)
        if (months >= 12) score += 60;
        else if (months >= 6) score += 30;

        // Points for income/turnover level
        if (averageOmzet >= 50000000) score += 100; // >50M
        else if (averageOmzet >= 15000000) score += 60; // >15M
        else if (averageOmzet >= 5000000) score += 30; // >5M

        // Points for cashflow ratio (Revenue vs Expenses)
        const totalExpenses = txs
          .filter((tx: any) => tx.type === "pengeluaran" || tx.type === "pembelian")
          .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
        
        if (totalIncome > totalExpenses * 1.5) {
          score += 60; // Very healthy margin
        } else if (totalIncome > totalExpenses) {
          score += 30; // Positive cashflow
        } else {
          score -= 40; // Negative cashflow penalty
        }

        setCreditScore(Math.min(850, Math.max(300, score)));
      }

    } catch (err: any) {
      console.error("Failed to compute credit metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    localStorage.setItem("kursai_modal_checklist", JSON.stringify(updated));
  };

  // Determine eligibility status
  const hasEnoughData = txCount >= 30 && activeMonths >= 3;
  
  const getEligibilityBadge = () => {
    if (!hasEnoughData) return { label: "Belum Cukup Data", style: "text-muted bg-dark-hover border-dark-border" };
    if (creditScore >= 700) return { label: "Sangat Layak", style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (creditScore >= 600) return { label: "Layak (Mikro)", style: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (creditScore >= 500) return { label: "Layak (Super Mikro)", style: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Kurang Layak", style: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  };

  const badge = getEligibilityBadge();

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
          <Landmark className="text-primary" size={24} />
          Akses Modal: Cek Kelayakan KUR
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Cek perkiraan kelayakan Kredit Usaha Rakyat (KUR) berdasarkan skor kredit dan pembukuanmu di KursAI.</p>
      </div>

      {/* Alert Banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-xs text-blue-600 dark:text-blue-400 font-semibold leading-relaxed">
        <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
          <h4 className="font-bold text-[var(--foreground)] mb-0.5">Perkiraan awal, bukan keputusan kredit</h4>
          <p className="text-[var(--muted-foreground)]">
            Hasil di halaman ini dihitung dari pembukuanmu di KursAI dan bersifat indikatif. Keputusan akhir kelayakan, plafon, dan bunga sepenuhnya ditentukan oleh bank penyalur KUR. <span className="text-primary hover:underline cursor-pointer">Pelajari cara skor dihitung &gt;</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit Score Card */}
            <div className="card p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Skor Kredit Bisnis</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Dasar penilaian kelayakan KUR, dari {txCount} transaksi usaha dalam {activeMonths} bulan aktif.
                </p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <span className="text-5xl font-black text-[var(--foreground)] tracking-tight">{creditScore}</span>
                <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                  creditScore >= 700 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                  creditScore >= 550 ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" :
                  creditScore >= 450 ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)]"
                }`}>
                  {!hasEnoughData ? "Belum Cukup Data" : 
                   creditScore >= 750 ? "Sangat Baik" :
                   creditScore >= 650 ? "Baik" :
                   creditScore >= 550 ? "Cukup" : "Kurang"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4 text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-bold tracking-wider">Rata-rata omzet/bulan</span>
                  <strong className="text-[var(--foreground)] text-sm mt-0.5 block">{formatCurrency(avgOmzet)}</strong>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-bold tracking-wider">Usia usaha</span>
                  <strong className="text-[var(--foreground)] text-sm mt-0.5 block">± {activeMonths} bulan</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer">
                  Lihat detail skor di dashboard <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Assessment Result Card */}
            <div className="card p-6 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Hasil Cek Kelayakan</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Penilaian konservatif berbasis aturan, tanpa AI.</p>
              </div>

              <div>
                <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${badge.style}`}>
                  {badge.label}
                </span>
              </div>

              {/* Assessment bullets */}
              <div className="space-y-3 text-xs font-semibold text-[var(--muted-foreground)] border-t border-[var(--border)] pt-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--foreground)]">Alasan Penilaian</p>
                <div className="flex items-start gap-2.5 leading-relaxed">
                  {txCount >= 30 ? (
                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={15} className="text-[var(--muted-foreground)] opacity-60 shrink-0 mt-0.5" />
                  )}
                  <span>
                    Butuh minimal 30 transaksi untuk menghitung skor. Saat ini <strong>{txCount} transaksi</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 leading-relaxed">
                  {activeMonths >= 3 ? (
                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={15} className="text-[var(--muted-foreground)] opacity-60 shrink-0 mt-0.5" />
                  )}
                  <span>
                    Baru <strong>{activeMonths} bulan</strong> pencatatan aktif, butuh minimal 3 bulan agar penilaian kelayakan akurat.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 leading-relaxed">
                  <Info size={15} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Hasil ini hanya perkiraan awal berdasarkan pembukuan Anda. Keputusan akhir kredit ditentukan oleh pihak bank penyalur KUR.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Document Checklist & Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Checklist Card */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  Checklist Dokumen
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Centang dokumen yang sudah kamu siapkan (tersimpan sementara di halaman ini saja).</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { key: "ktp", label: "KTP dan Kartu Keluarga (KK)" },
                  { key: "nib", label: "NIB atau surat izin usaha (bisa dibuat gratis lewat OSS)" },
                  { key: "laporan", label: "Laporan keuangan usaha (unduh Laporan Keuangan dari dashboard KursAI)" },
                  { key: "rekening", label: "Rekening bank aktif beserta mutasi 3-6 bulan terakhir" },
                  { key: "agunan", label: "Agunan tambahan biasanya tidak diwajibkan untuk KUR Super Mikro/Mikro, tapi siapkan jika bank meminta" }
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors leading-relaxed">
                    <input
                      type="checkbox"
                      checked={checklist[item.key] || false}
                      onChange={() => handleChecklistChange(item.key)}
                      className="mt-0.5 rounded border-[var(--border)] bg-[var(--card)] text-primary focus:ring-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Langkah Selanjutnya
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Saran agar pengajuanmu makin kuat di mata bank.</p>
              </div>

              <div className="space-y-4 pt-2 text-xs font-semibold text-[var(--muted-foreground)]">
                {[
                  "Catat semua transaksi usaha setiap hari lewat Chat AI agar riwayat keuanganmu lengkap.",
                  "Pisahkan transaksi pribadi dari pembukuan usaha supaya laporan keuanganmu akurat di mata bank.",
                  "Lengkapi kategori di setiap transaksi. Pencatatan yang rapi menaikkan skor kreditmu.",
                  "Setelah 3 bulan pencatatan rutin, kembali ke halaman ini untuk cek ulang kelayakanmu."
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KUR Reference Table */}
          <div className="card p-0 overflow-hidden border-[var(--border)] shadow-xl">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Referensi Jenis KUR</h3>
              <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-1">
                Angka plafon dan bunga bersifat indikatif. Bunga bersubsidi sekitar ±6%/tahun, dapat berbeda per bank dan kebijakan pemerintah terbaru.
              </p>
            </div>
            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[11px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                    <th className="px-5 py-4">Jenis</th>
                    <th className="px-5 py-4">Plafon (indikatif)</th>
                    <th className="px-5 py-4">Bunga (indikatif)</th>
                    <th className="px-5 py-4">Cocok Untuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60 text-[var(--muted-foreground)]">
                  <tr className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-5 py-3.5 text-[var(--foreground)] font-bold">Super Mikro</td>
                    <td className="px-5 py-3.5">s.d. Rp10.000.000</td>
                    <td className="px-5 py-3.5">± 6%/tahun (subsidi)</td>
                    <td className="px-5 py-3.5">Usaha baru / ultra mikro</td>
                  </tr>
                  <tr className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-5 py-3.5 text-[var(--foreground)] font-bold">Mikro</td>
                    <td className="px-5 py-3.5">Rp10.000.000 - Rp100.000.000</td>
                    <td className="px-5 py-3.5">± 6%/tahun (subsidi)</td>
                    <td className="px-5 py-3.5">Usaha mikro berjalan</td>
                  </tr>
                  <tr className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-5 py-3.5 text-[var(--foreground)] font-bold">Kecil</td>
                    <td className="px-5 py-3.5">Rp100.000.000 - Rp500.000.000</td>
                    <td className="px-5 py-3.5">± 6%/tahun (subsidi)</td>
                    <td className="px-5 py-3.5">Usaha kecil, umumnya butuh agunan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Cards Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download financial statement card */}
            <div className="card p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[var(--foreground)]">Siapkan Laporan Keuanganmu</h4>
                <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-1">
                  Bank akan meminta laporan keuangan. Buka Dashboard lalu unduh Laporan Keuangan (SAK EMKM) sebagai lampiran pengajuan.
                </p>
              </div>
              <div>
                <Link href="/dashboard">
                  <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1 font-bold">
                    Buka Dashboard <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

            {/* Connect to bank lender card */}
            <div className="card p-5 flex flex-col justify-between space-y-4 border border-[var(--border)] bg-[var(--card)]/50">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">Hubungkan dengan Penyalur KUR</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    Segera Hadir
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-1">
                  Hubungkan dengan penyalur KUR & fintech lending langsung dari KursAI. Bagikan profil kelayakanmu dengan satu klik.
                </p>
              </div>
              <div>
                <button disabled className="btn-secondary text-xs py-2 px-4 text-[var(--muted-foreground)] opacity-50 border-[var(--border)] cursor-not-allowed">
                  Segera Hadir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
