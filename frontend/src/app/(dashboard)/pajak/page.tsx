"use client";

import { useState, useEffect } from "react";
import {
  Percent,
  AlertTriangle,
  HelpCircle,
  FileText,
  Loader2,
  Calendar,
  Wallet,
  Calculator,
  ChevronDown,
  ChevronUp,
  Settings,
  Building,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";

interface MonthTaxDetail {
  monthName: string;
  omzet: number;
  porsiBebas: number;
  dasarKenaPajak: number;
  pph: number;
  dueDate: string;
}

export default function PajakPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);
  const [monthlyTax, setMonthlyTax] = useState<MonthTaxDetail[]>([]);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalPPh, setTotalPPh] = useState(0);
  const [lastMonthPPh, setLastMonthPPh] = useState(0);
  const [lastMonthName, setLastMonthName] = useState("");
  const [lastMonthDueDate, setLastMonthDueDate] = useState("");

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false
  });

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    if (businessId) {
      loadTaxData();
    } else {
      setLoading(false);
    }
  }, [businessId, selectedYear]);

  const loadTaxData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      // Fetch all sales/revenue transactions for the current business
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", businessId);

      if (error) throw error;

      // 12 Months preset
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      const monthlyOmzet = Array(12).fill(0);

      // Filter and sum transaction amounts by month
      txs?.forEach((tx) => {
        const txDate = new Date(tx.date || tx.created_at);
        if (txDate.getFullYear() === selectedYear) {
          // Check if transaction is income (penjualan, pendapatan_lain)
          if (tx.type === "penjualan" || tx.type === "pendapatan_lain") {
            const monthIndex = txDate.getMonth();
            monthlyOmzet[monthIndex] += Number(tx.amount) || 0;
          }
        }
      });

      // Calculate cumulative tax exemption threshold (Rp500.000.000 limit for WP Orang Pribadi)
      const THRESHOLD = 500000000;
      let cumulativeSum = 0;

      const calculatedMonthlyDetails: MonthTaxDetail[] = monthNames.map((name, idx) => {
        const omzet = monthlyOmzet[idx];
        const prevCumulative = cumulativeSum;
        cumulativeSum += omzet;

        let porsiBebas = 0;
        if (prevCumulative >= THRESHOLD) {
          porsiBebas = 0;
        } else if (cumulativeSum <= THRESHOLD) {
          porsiBebas = omzet;
        } else {
          porsiBebas = THRESHOLD - prevCumulative;
        }

        const dasarKenaPajak = Math.max(0, omzet - porsiBebas);
        const pph = dasarKenaPajak * 0.005; // PPh Final 0.5%

        // Due date is 15th of the following month
        const nextMonthIdx = (idx + 1) % 12;
        const nextYear = nextMonthIdx === 0 ? selectedYear + 1 : selectedYear;
        const dueDate = `15 ${monthNames[nextMonthIdx]} ${nextYear}`;

        return {
          monthName: name,
          omzet,
          porsiBebas,
          dasarKenaPajak,
          pph,
          dueDate
        };
      });

      setMonthlyTax(calculatedMonthlyDetails);

      // Totals
      const sumOmzet = monthlyOmzet.reduce((a, b) => a + b, 0);
      const sumPPh = calculatedMonthlyDetails.reduce((sum, item) => sum + item.pph, 0);
      setTotalOmzet(sumOmzet);
      setTotalPPh(sumPPh);

      // Last month calculation (dynamic check based on local current time)
      const currentDate = new Date();
      let lastMonthIdx = currentDate.getMonth() - 1;
      let lastMonthYear = currentDate.getFullYear();
      if (lastMonthIdx < 0) {
        lastMonthIdx = 11;
        lastMonthYear -= 1;
      }

      if (selectedYear === lastMonthYear) {
        setLastMonthPPh(calculatedMonthlyDetails[lastMonthIdx].pph);
        setLastMonthName(`${monthNames[lastMonthIdx]} ${selectedYear}`);
        setLastMonthDueDate(calculatedMonthlyDetails[lastMonthIdx].dueDate);
      } else {
        // Fallback to December if viewing past years, or Jan if future
        const fallbackIdx = selectedYear < lastMonthYear ? 11 : 0;
        setLastMonthPPh(calculatedMonthlyDetails[fallbackIdx].pph);
        setLastMonthName(`${monthNames[fallbackIdx]} ${selectedYear}`);
        setLastMonthDueDate(calculatedMonthlyDetails[fallbackIdx].dueDate);
      }

    } catch (err: any) {
      console.error("Failed to load tax details", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen({ ...faqOpen, [index]: !faqOpen[index] });
  };

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
          <Percent className="text-primary" size={24} />
          Asisten Pajak
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Estimasi PPh Final UMKM 0,5% (PP 55/2022) dari omzet usaha yang tercatat di KursAI.</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
        <div>
          <h4 className="font-bold text-[var(--foreground)] mb-0.5">Estimasi, bukan nasihat pajak</h4>
          <p className="text-[var(--muted-foreground)]">
            Angka di halaman ini hanya estimasi berdasarkan transaksi usaha yang tercatat (PP 55/2022). Tarif dan aturan pajak dapat berubah, selalu verifikasi aturan terbaru di <a href="https://pajak.go.id" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">pajak.go.id <ArrowUpRight size={10} /></a> atau konsultasikan dengan konsultan pajak Anda sebelum menyetor.
          </p>
        </div>
      </div>

      {/* Year Selector Pills */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setSelectedYear(2026)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
            selectedYear === 2026
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          2026
        </button>
        <button
          onClick={() => setSelectedYear(2025)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
            selectedYear === 2025
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          2025
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Omzet Tahun {selectedYear}</span>
                <Wallet size={16} className="text-[var(--muted-foreground)]" />
              </div>
              <div>
                <span className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(totalOmzet)}</span>
                <p className="text-[10px] text-[var(--muted-foreground)] font-medium mt-1">Peredaran bruto dari pemasukan usaha tercatat</p>
              </div>
            </div>
            <div className="card p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Estimasi PPh Bulan Lalu</span>
                <Calendar size={16} className={lastMonthPPh > 0 ? "text-primary" : "text-emerald-500"} />
              </div>
              <div>
                <span className={`text-2xl font-bold ${
                  lastMonthPPh > 0 ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {formatCurrency(lastMonthPPh)}
                </span>
                {lastMonthPPh > 0 ? (
                  <>
                    <p className="text-[10px] text-primary font-bold mt-1">
                      Setor sebelum {lastMonthDueDate}
                    </p>
                    <p className="text-[9px] text-[var(--muted-foreground)] font-medium mt-0.5">Masa pajak {lastMonthName}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Laporan Pajak Nihil (tidak perlu setor)
                    </p>
                    <p className="text-[9px] text-[var(--muted-foreground)] font-medium mt-0.5">Masa pajak {lastMonthName}</p>
                  </>
                )}
              </div>
            </div>
            <div className="card p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Estimasi PPh {selectedYear}</span>
                <Calculator size={16} className="text-[var(--muted-foreground)]" />
              </div>
              <div>
                <span className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(totalPPh)}</span>
                <p className="text-[10px] text-[var(--muted-foreground)] font-medium mt-1">Setelah pembebasan omzet Rp500 juta pertama (WP Orang Pribadi)</p>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Card */}
          <div className="card p-0 overflow-hidden border-[var(--border)] shadow-xl">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Rincian Bulanan {selectedYear}</h3>
              <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-1">
                PPh Final 0,5% dihitung dari omzet bruto tiap bulan, setelah bagian bebas pajak Rp500 juta kumulatif untuk WP orang pribadi. Setor paling lambat tanggal 15 bulan berikutnya.
              </p>
            </div>
            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[11px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                    <th className="px-5 py-4">Bulan</th>
                    <th className="px-5 py-4 text-right">Omzet</th>
                    <th className="px-5 py-4 text-right">Porsi Bebas Pajak</th>
                    <th className="px-5 py-4 text-right">Dasar Kena Pajak</th>
                    <th className="px-5 py-4 text-right">PPh 0,5%</th>
                    <th className="px-5 py-4 text-right">Jatuh Tempo Setor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {monthlyTax.map((row) => (
                    <tr key={row.monthName} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="px-5 py-3.5 text-[var(--foreground)] font-bold">{row.monthName}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{formatCurrency(row.omzet)}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{row.porsiBebas > 0 ? formatCurrency(row.porsiBebas) : "-"}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{formatCurrency(row.dasarKenaPajak)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-[var(--foreground)]">{row.pph > 0 ? formatCurrency(row.pph) : "Rp0"}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{row.dueDate}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--muted)]/70 font-bold border-t border-[var(--border)] text-[var(--foreground)]">
                    <td className="px-5 py-4">Total</td>
                    <td className="px-5 py-4 text-right">{formatCurrency(totalOmzet)}</td>
                    <td className="px-5 py-4 text-right">{formatCurrency(monthlyTax.reduce((a, b) => a + b.porsiBebas, 0))}</td>
                    <td className="px-5 py-4 text-right">{formatCurrency(monthlyTax.reduce((a, b) => a + b.dasarKenaPajak, 0))}</td>
                    <td className="px-5 py-4 text-right text-primary">{formatCurrency(totalPPh)}</td>
                    <td className="px-5 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* NPWP Section */}
      <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <Building size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">NPWP Usaha</h4>
            <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-0.5">Belum diisi, diperlukan untuk membuat kode billing secara langsung.</p>
          </div>
        </div>
        <button className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 border-[var(--border)] hover:text-[var(--foreground)] shadow-sm">
          <Settings size={14} />
          Lengkapi di Pengaturan
        </button>
      </div>

      {/* PPh FAQ Accordions */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle size={18} className="text-primary" />
          <h3 className="text-base font-bold text-[var(--foreground)]">Tentang PPh Final UMKM</h3>
        </div>
        <div className="divide-y divide-[var(--border)]/60 text-xs font-semibold">
          {[
            {
              q: "Apa itu PPh Final UMKM 0,5%?",
              a: "PPh Final UMKM 0,5% adalah tarif Pajak Penghasilan final yang ditujukan untuk wajib pajak orang pribadi dan badan yang memiliki peredaran bruto tertentu (di bawah Rp4,8 miliar setahun) sebagaimana diatur dalam Peraturan Pemerintah (PP) No. 55 Tahun 2022."
            },
            {
              q: "Siapa saja yang dapat memakainya?",
              a: "Wajib Pajak Orang Pribadi (jangka waktu pemakaian maksimal 7 tahun), Koperasi dan CV (maksimal 4 tahun), serta PT (maksimal 3 tahun) yang peredaran bruto/omzetnya tidak melebihi Rp4,8 Miliar dalam 1 tahun pajak."
            },
            {
              q: "Bagaimana cara menyetor pajaknya?",
              a: "Penyetoran dapat dilakukan dengan membuat kode billing terlebih dahulu melalui e-Billing DJP (sse2.pajak.go.id) atau fitur perpajakan mitra bank. Setelah mendapatkan Kode Billing (15 digit), bayarkan melalui ATM, Internet Banking, M-Banking, Kantor Pos, atau e-Commerce mitra persepsi paling lambat tanggal 15 bulan berikutnya."
            }
          ].map((item, index) => (
            <div key={index} className="py-3">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between text-left font-bold text-[var(--foreground)] hover:text-primary transition-colors py-1"
              >
                <span>{item.q}</span>
                {faqOpen[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {faqOpen[index] && (
                <div className="mt-2 text-[var(--muted-foreground)] leading-relaxed font-normal pr-4 animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coretax Card Next Feature */}
      <div className="card p-5 border border-purple-500/20 bg-purple-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--foreground)]">PPN & e-Faktur / Coretax untuk PKP</h4>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                Segera Hadir
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] font-semibold mt-0.5">Hitung PPN keluaran/masukan dan siapkan e-Faktur lewat Coretax untuk Pengusaha Kena Pajak.</p>
          </div>
        </div>
        <button disabled className="btn-secondary text-xs py-2 px-4 border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed">
          Segera Hadir
        </button>
      </div>
    </div>
  );
}
