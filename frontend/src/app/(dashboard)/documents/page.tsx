"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Plus,
  Search,
  Loader2,
  Trash2,
  Printer,
  ChevronRight,
  X,
  FileCheck,
  User,
  Calendar,
  Building
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatDate } from "@/lib/utils";

interface DocumentDb {
  id: string;
  business_id: string;
  type: "surat_penawaran" | "surat_perjanjian" | "invoice" | "kwitansi" | "surat_jalan";
  title: string;
  content: {
    recipient: string;
    recipient_details?: string;
    body: string;
    date: string;
    signee_1?: string; // Sender
    signee_2?: string; // Recipient
  };
  file_path?: string;
  created_at: string;
}

const templatePresets = [
  { type: "surat_penawaran", name: "Surat Penawaran", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
  { type: "surat_perjanjian", name: "Surat Perjanjian", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
  { type: "surat_jalan", name: "Surat Jalan", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessName, setBusinessName] = useState("KursAI Store");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [docType, setDocType] = useState<DocumentDb["type"]>("surat_penawaran");
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientDetails, setRecipientDetails] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [docDate, setDocDate] = useState("");
  const [signee1, setSignee1] = useState(""); // Sender signee
  const [signee2, setSignee2] = useState(""); // Recipient signee
  const [saving, setSaving] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    if (businessId) {
      loadDocuments();
      loadBusinessDetails();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const loadBusinessDetails = async () => {
    if (!businessId) return;
    try {
      const { data } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .maybeSingle();
      if (data) setBusinessName(data.name);
    } catch (err) {
      console.error("Failed to load business details", err);
    }
  };

  const loadDocuments = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error("Failed to load documents", err);
      alert("Gagal memuat dokumen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: DocumentDb["type"]) => {
    setDocType(type);
    setTitle(
      type === "surat_penawaran" ? "Penawaran Kerjasama Produk" :
      type === "surat_perjanjian" ? "Surat Perjanjian Sewa / Jasa" : "Surat Jalan Barang"
    );
    setRecipient("");
    setRecipientDetails("");
    setSignee1("Pemilik Bisnis");
    setSignee2("Klien / Mitra");
    setDocDate(new Date().toISOString().split("T")[0]);
    
    // Set default templates for body texts
    if (type === "surat_penawaran") {
      setBodyText(
        "Dengan hormat,\n\nBersama surat ini, kami bermaksud menawarkan produk/jasa dari toko kami untuk menjalin kerjasama saling menguntungkan. Berikut ini adalah rincian detail produk unggulan kami...\n\nKami berharap kerjasama ini dapat berlanjut ke tahap pertemuan resmi untuk penandatanganan memorandum. Atas perhatian Anda, kami ucapkan terima kasih."
      );
    } else if (type === "surat_perjanjian") {
      setBodyText(
        "Pada hari ini, para pihak yang bertanda tangan di bawah ini bersepakat untuk mengadakan perjanjian kerjasama bisnis, dengan rincian pasal sebagai berikut:\n\nPasal 1: Pihak Pertama berkewajiban menyuplai kebutuhan Pihak Kedua.\nPasal 2: Sistem pembayaran dilakukan secara tempo maksimal 14 hari kerja.\n\nDemikian surat perjanjian ini dibuat dalam kondisi sadar untuk ditaati bersama."
      );
    } else {
      setBodyText(
        "Bersama surat jalan ini, kami mengirimkan produk-produk berikut kepada penerima:\n\n1. Produk A - Qty: 50 pcs\n2. Produk B - Qty: 20 pcs\n\nHarap lakukan pengecekan fisik barang sebelum menandatangani bukti serah terima surat jalan ini."
      );
    }

    setShowCreateModal(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!title.trim() || !recipient.trim()) {
      alert("Judul dokumen dan nama penerima wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("documents")
        .insert({
          business_id: businessId,
          type: docType,
          title: title.trim(),
          content: {
            recipient: recipient.trim(),
            recipient_details: recipientDetails.trim() || undefined,
            body: bodyText.trim(),
            date: docDate,
            signee_1: signee1.trim() || undefined,
            signee_2: signee2.trim() || undefined
          }
        });

      if (error) throw error;
      setShowCreateModal(false);
      loadDocuments();
    } catch (err: any) {
      console.error("Failed to save document", err);
      alert("Gagal membuat dokumen: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadDocuments();
    } catch (err: any) {
      console.error("Failed to delete document", err);
      alert("Gagal menghapus dokumen: " + err.message);
    }
  };

  const handlePrintDocument = (doc: DocumentDb) => {
    const printWindow = window.open("", "_blank", "width=800,height=800");
    if (!printWindow) {
      alert("Pop-up diblokir. Harap izinkan pop-up untuk mencetak dokumen.");
      return;
    }

    const typeLabels = {
      surat_penawaran: "SURAT PENAWARAN",
      surat_perjanjian: "SURAT PERJANJIAN KERJASAMA",
      surat_jalan: "SURAT JALAN BARANG",
      invoice: "INVOICE",
      kwitansi: "KWITANSI"
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 50px 70px; line-height: 1.6; }
            .kop-surat { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 30px; }
            .kop-title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .kop-sub { font-size: 12px; margin: 5px 0 0 0; font-style: italic; }
            .doc-title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin-bottom: 25px; text-transform: uppercase; }
            .meta-info { margin-bottom: 25px; font-size: 14px; }
            .recipient-block { margin-bottom: 25px; font-size: 14px; }
            .content-body { font-size: 14px; text-align: justify; white-space: pre-line; margin-bottom: 40px; }
            .signature-section { display: grid; grid-template-cols: 1fr 1fr; gap: 50px; font-size: 14px; margin-top: 50px; }
            .sig-box { text-align: center; }
            .sig-space { height: 80px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <h1 class="kop-title">${businessName}</h1>
            <p class="kop-sub">Sistem Manajemen Dokumen Terintegrasi KursAI UMKM</p>
          </div>

          <div class="doc-title">${typeLabels[doc.type]}</div>

          <div class="meta-info">
            <strong>Tanggal:</strong> ${formatDate(doc.content.date)}<br/>
            <strong>Hal:</strong> ${doc.title}
          </div>

          <div class="recipient-block">
            Kepada Yth,<br/>
            <strong>${doc.content.recipient}</strong><br/>
            ${doc.content.recipient_details ? doc.content.recipient_details.replace(/\n/g, "<br/>") : ""}
          </div>

          <div class="content-body">
            ${doc.content.body}
          </div>

          <div class="signature-section">
            <div class="sig-box">
              <p>Pihak Pertama,</p>
              <div class="sig-space"></div>
              <p><strong>( ${doc.content.signee_1 || "Pengirim"} )</strong></p>
            </div>
            <div class="sig-box">
              <p>Pihak Kedua,</p>
              <div class="sig-space"></div>
              <p><strong>( ${doc.content.signee_2 || "Penerima"} )</strong></p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.recipient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeLabels = {
    surat_penawaran: "Surat Penawaran",
    surat_perjanjian: "Surat Perjanjian",
    surat_jalan: "Surat Jalan",
    invoice: "Invoice",
    kwitansi: "Kwitansi"
  };

  const typeStyles = {
    surat_penawaran: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    surat_perjanjian: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    surat_jalan: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    invoice: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    kwitansi: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Surat & Dokumen</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Buat, kelola, dan cetak dokumen resmi usaha secara mudah</p>
        </div>
      </div>

      {/* Templates Quick Selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[var(--foreground)] tracking-wider uppercase">Pilih Template Dokumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templatePresets.map((preset) => (
            <button
              key={preset.type}
              onClick={() => handleOpenModal(preset.type as any)}
              className="card flex flex-col justify-between p-5 border text-left hover:border-primary/40 transition-all duration-300 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <FileText size={28} className="text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-md border border-[var(--border)]">Draft PDF</span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5">{preset.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Format surat resmi kop bisnis</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Cari nama dokumen atau penerima..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Documents Table */}
      <div className="card p-0 overflow-hidden border-[var(--border)] shadow-xl">
        <h2 className="text-sm font-bold text-[var(--foreground)] p-4 border-b border-[var(--border)]">Daftar Dokumen Anda</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)] font-semibold">
            <FileCheck size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada dokumen yang dibuat</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Pilih salah satu template di atas untuk mulai membuat surat resmi</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs font-semibold">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[11px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                  <th className="px-5 py-4">Judul Dokumen</th>
                  <th className="px-5 py-4">Tipe</th>
                  <th className="px-5 py-4">Mitra / Penerima</th>
                  <th className="px-5 py-4 text-right">Tanggal Surat</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-5 py-3.5 text-[var(--foreground)] font-bold">{doc.title}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[10px] font-bold ${typeStyles[doc.type]}`}>
                        {typeLabels[doc.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{doc.content.recipient}</td>
                    <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{formatDate(doc.content.date)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintDocument(doc)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          title="Cetak Surat Resmi"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-rose-500 rounded-lg hover:bg-[var(--muted)] transition-colors"
                          title="Hapus Surat"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                Buat {typeLabels[docType]} Baru
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Judul / Hal Surat</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="Hal atau subject surat"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Tanggal Dokumen</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="date"
                      required
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Nama Penerima / Mitra</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      required
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Nama individu atau CV/PT"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Informasi Detail Penerima</label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3 top-3 text-muted" />
                    <textarea
                      value={recipientDetails}
                      onChange={(e) => setRecipientDetails(e.target.value)}
                      className="input-field pl-10 h-[50px] resize-none py-1.5"
                      placeholder="Alamat / No. Telp penerima"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Isi Dokumen (Body Surat)</label>
                <textarea
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="input-field h-[180px] resize-none py-2 font-normal leading-relaxed text-sm"
                  placeholder="Ketik isi surat di sini..."
                />
              </div>

              {/* Signatures Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dark-border/40 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Pihak Pertama (Pengirim)</label>
                  <input
                    type="text"
                    value={signee1}
                    onChange={(e) => setSignee1(e.target.value)}
                    className="input-field py-1.5"
                    placeholder="Nama Penanggungjawab"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Pihak Kedua (Penerima)</label>
                  <input
                    type="text"
                    value={signee2}
                    onChange={(e) => setSignee2(e.target.value)}
                    className="input-field py-1.5"
                    placeholder="Nama Penerima"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Dokumen"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
