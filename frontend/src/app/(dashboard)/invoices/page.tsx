"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Download,
  Send,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  FileCheck,
  Calendar,
  User,
  Phone,
  MapPin,
  X,
  Printer,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice, InvoiceItem } from "@/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessName, setBusinessName] = useState("KursAI Store");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [selectedManageInvoice, setSelectedManageInvoice] = useState<Invoice | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState(11); // Default PPN 11%
  const [items, setItems] = useState<{ description: string; quantity: number; price: number }[]>([
    { description: "", quantity: 1, price: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);

  useEffect(() => {
    if (businessId) {
      loadInvoices();
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

  const loadInvoices = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error("Failed to load invoices", err);
      alert("Gagal memuat invoice: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`INV/${dateStr}/${random}`);
  };

  const openCreateModal = () => {
    generateInvoiceNumber();
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setNotes("");
    setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]); // Default 7 days
    setItems([{ description: "", quantity: 1, price: 0 }]);
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * taxPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!customerName.trim()) {
      alert("Nama pelanggan harus diisi");
      return;
    }
    if (items.some(item => !item.description.trim() || item.price <= 0)) {
      alert("Pastikan deskripsi item terisi dan harga lebih dari 0");
      return;
    }

    setSaving(true);
    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const total = calculateTotal();

      // Insert Invoice header
      const { data: newInv, error: invError } = await supabase
        .from("invoices")
        .insert({
          business_id: businessId,
          invoice_number: invoiceNumber,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          customer_address: customerAddress.trim() || null,
          subtotal,
          tax,
          total,
          status: "draft",
          notes: notes.trim() || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null
        })
        .select()
        .single();

      if (invError) throw invError;

      // Insert Invoice Items
      const invoiceItems = items.map(item => ({
        invoice_id: newInv.id,
        description: item.description.trim(),
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Also create a sales transaction automatically for better integration!
      // (Optionally, only do this if status is marked paid, but for now we let it manage invoices separately)

      setShowCreateModal(false);
      loadInvoices();
    } catch (err: any) {
      console.error("Failed to save invoice", err);
      alert("Gagal membuat invoice: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Invoice["status"]) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      loadInvoices();
      setActionMenuId(null);
    } catch (err: any) {
      console.error("Failed to update status", err);
      alert("Gagal merubah status: " + err.message);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus invoice ini? Semua item terkait juga akan terhapus.")) return;
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadInvoices();
      setActionMenuId(null);
    } catch (err: any) {
      console.error("Failed to delete invoice", err);
      alert("Gagal menghapus invoice: " + err.message);
    }
  };

  // Printing engine in popup windows
  const handlePrint = async (inv: Invoice, type: "faktur" | "kwitansi") => {
    // Open print window immediately to bypass browser async pop-up block
    const printWindow = window.open("", "_blank", "width=800,height=800");
    if (!printWindow) {
      alert("Pop-up diblokir. Harap izinkan pop-up untuk mencetak dokumen.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Memuat...</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 80vh; margin: 0; color: #64748b; }
            .loading { font-size: 14px; font-weight: 600; text-align: center; }
          </style>
        </head>
        <body>
          <div class="loading">Sedang memuat dokumen...</div>
        </body>
      </html>
    `);

    try {
      const { data: dbItems, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", inv.id);
      
      if (error) throw error;
      const invoiceItems: InvoiceItem[] = dbItems || [];

      if (type === "faktur") {
        // Corporate styled invoice letterhead
        printWindow.document.write(`
          <html>
            <head>
              <title>Faktur #${inv.invoice_number}</title>
              <style>
                body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #10b981; }
                .invoice-title { font-size: 28px; font-weight: 800; text-align: right; color: #0f172a; margin: 0; }
                .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .details-block h4 { margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
                .details-block p { margin: 0 0 6px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background-color: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 12px; font-size: 13px; border-bottom: 2px solid #e2e8f0; }
                td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                .totals-box { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: 20px; font-size: 14px; }
                .totals-row { display: flex; justify-content: space-between; width: 300px; padding: 4px 0; }
                .totals-row.grand-total { border-top: 2px solid #e2e8f0; padding-top: 10px; font-size: 18px; font-weight: bold; color: #0f172a; }
                .footer { text-align: center; margin-top: 60px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                @media print {
                  body { padding: 20px; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="logo">${businessName}</div>
                  <p style="margin: 4px 0; font-size: 13px; color: #64748b;">AI Business Management System</p>
                </div>
                <div>
                  <h1 class="invoice-title">FAKTUR PENJUALAN</h1>
                  <p style="margin: 4px 0 0 0; text-align: right; font-weight: 600;">No: ${inv.invoice_number}</p>
                </div>
              </div>
              
              <div class="details-grid">
                <div class="details-block">
                  <h4>Diterbitkan Oleh</h4>
                  <p><strong>${businessName}</strong></p>
                  <p>Sistem KursAI Terintegrasi</p>
                </div>
                <div class="details-block">
                  <h4>Ditujukan Kepada</h4>
                  <p><strong>${inv.customer_name}</strong></p>
                  ${inv.customer_phone ? `<p>Telp: ${inv.customer_phone}</p>` : ""}
                  ${inv.customer_address ? `<p>${inv.customer_address}</p>` : ""}
                </div>
              </div>

              <div class="details-grid" style="margin-bottom: 20px; gap: 20px;">
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <span style="font-size: 12px; color: #64748b; display: block; text-transform: uppercase;">Tanggal Transaksi</span>
                  <strong style="font-size: 14px;">${formatDate(inv.created_at)}</strong>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                  <span style="font-size: 12px; color: #64748b; display: block; text-transform: uppercase;">Jatuh Tempo</span>
                  <strong style="font-size: 14px; color: #ef4444;">${inv.due_date ? formatDate(inv.due_date) : "-"}</strong>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Deskripsi Item</th>
                    <th style="text-align: center; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 140px;">Harga Satuan</th>
                    <th style="text-align: right; width: 160px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceItems.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(item.price)}</td>
                      <td style="text-align: right; font-weight: 500;">${formatCurrency(item.total)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>

              <div class="totals-box">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>${formatCurrency(inv.subtotal)}</span>
                </div>
                <div class="totals-row">
                  <span>Pajak (PPN ${((inv.tax / inv.subtotal) * 100 || 0).toFixed(0)}%)</span>
                  <span>${formatCurrency(inv.tax)}</span>
                </div>
                <div class="totals-row grand-total">
                  <span>Total Bayar</span>
                  <span>${formatCurrency(inv.total)}</span>
                </div>
              </div>

              ${inv.notes ? `
                <div style="margin-top: 40px; padding: 15px; background: #fafafa; border-radius: 8px; font-size: 13px;">
                  <h4 style="margin: 0 0 6px 0; color: #475569;">Catatan Tambahan</h4>
                  <p style="margin: 0; color: #64748b;">${inv.notes}</p>
                </div>
              ` : ""}

              <div class="footer">
                <p>Terima kasih atas kepercayaan Anda bertransaksi dengan kami.</p>
                <p style="margin-top: 8px; font-size: 10px; color: #cbd5e1;">Dicetak otomatis melalui KursAI Business Assistant</p>
              </div>

              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
      } else {
        // Dotted thermal POS receipt (80mm)
        printWindow.document.write(`
          <html>
            <head>
              <title>Kwitansi #${inv.invoice_number}</title>
              <style>
                body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; width: 300px; margin: 0 auto; font-size: 12px; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; font-size: 12px; }
                .right { text-align: right; }
                .receipt-title { font-size: 16px; font-weight: bold; margin: 10px 0; }
                @media print {
                  body { padding: 10px; width: 100%; }
                }
              </style>
            </head>
            <body>
              <div class="center">
                <span class="bold" style="font-size: 16px;">${businessName}</span><br/>
                <span>KursAI Integrated Store</span><br/>
                <span class="receipt-title">KWITANSI PEMBAYARAN</span>
              </div>
              <div class="divider"></div>
              <table>
                <tr><td>No. Faktur:</td><td class="right">${inv.invoice_number}</td></tr>
                <tr><td>Tanggal:</td><td class="right">${formatDate(inv.created_at)}</td></tr>
                <tr><td>Pelanggan:</td><td class="right">${inv.customer_name}</td></tr>
                <tr><td>Status:</td><td class="right bold">${inv.status.toUpperCase()}</td></tr>
              </table>
              <div class="divider"></div>
              <table>
                <thead>
                  <tr>
                    <th align="left">Menu/Item</th>
                    <th align="center">Qty</th>
                    <th align="right">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceItems.map(item => `
                    <tr>
                      <td colspan="3">${item.description}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td align="center">${item.quantity}x</td>
                      <td align="right">${formatCurrency(item.price)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <div class="divider"></div>
              <table>
                <tr><td>Subtotal</td><td class="right">${formatCurrency(inv.subtotal)}</td></tr>
                <tr><td>PPN</td><td class="right">${formatCurrency(inv.tax)}</td></tr>
                <tr class="bold"><td>TOTAL</td><td class="right">${formatCurrency(inv.total)}</td></tr>
              </table>
              <div class="divider"></div>
              <div class="center" style="margin-top: 15px;">
                <span>Maturnuwun / Terima Kasih</span><br/>
                <span>Simpan kwitansi ini sebagai bukti pembelian yang sah.</span>
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
      }
      printWindow.document.close();
    } catch (err: any) {
      console.error("Failed to print", err);
      alert("Gagal memproses cetak: " + err.message);
    }
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const message = `Halo ${inv.customer_name},\n\nBerikut tagihan Anda untuk Invoice *${inv.invoice_number}* sebesar *${formatCurrency(inv.total)}*.\nJatuh tempo pada tanggal: ${inv.due_date ? formatDate(inv.due_date) : "-"}.\n\nSilakan lakukan pembayaran dan konfirmasikan kembali. Terima kasih!\n\n-- *${businessName}*`;
    const encoded = encodeURIComponent(message);
    const phoneNum = inv.customer_phone ? inv.customer_phone.replace(/\D/g, "") : "";
    window.open(`https://api.whatsapp.com/send?phone=${phoneNum}&text=${encoded}`, "_blank");
  };

  // Calculations for dashboard indicators
  const totalValue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = invoices.filter(i => i.status === "sent" || i.status === "overdue" || i.status === "draft").reduce((sum, inv) => sum + inv.total, 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    sent: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    paid: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    overdue: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    cancelled: "text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)]",
  };

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    sent: "Terkirim",
    paid: "Lunas",
    overdue: "Jatuh Tempo",
    cancelled: "Batal",
  };

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Faktur & Kwitansi</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Buat, kelola, cetak tagihan dan nota penjualan toko secara instan</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Buat Invoice
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Invoice</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--foreground)]">{invoices.length}</span>
            <span className="text-xs text-[var(--muted-foreground)]">dokumen</span>
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Terbayar (Lunas)</span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Sisa Piutang (Aktif)</span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalUnpaid)}</span>
          </div>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Jatuh Tempo</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overdueCount}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">invoice</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Cari nomor invoice atau pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="mx-auto mb-4 text-[var(--muted-foreground)] opacity-50" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Belum ada invoice</h3>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Mulai membuat invoice untuk melacak tagihan pelanggan Anda</p>
          <button onClick={openCreateModal} className="btn-primary">Buat Invoice Baru</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[11px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                  <th className="px-5 py-4">Nomor Invoice</th>
                  <th className="px-5 py-4">Nama Pelanggan</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Total Tagihan</th>
                  <th className="px-5 py-4 text-right">Tanggal Buat</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 text-xs font-semibold">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-[var(--foreground)] tracking-wide">{inv.invoice_number}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--foreground)]">{inv.customer_name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[var(--foreground)]">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3.5 text-right text-[var(--muted-foreground)]">{formatDate(inv.created_at)}</td>
                    <td className="px-5 py-3.5 text-center relative">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handlePrint(inv, "faktur")}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors" 
                          title="Cetak Faktur"
                        >
                          <Printer size={15} />
                        </button>
                        <button 
                          onClick={() => handlePrint(inv, "kwitansi")}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-[var(--muted)] transition-colors" 
                          title="Cetak Struk/Kwitansi"
                        >
                          <FileCheck size={15} />
                        </button>
                        <button 
                          onClick={() => handleShareWhatsApp(inv)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[var(--muted)] transition-colors" 
                          title="Kirim WhatsApp"
                        >
                          <Send size={15} />
                        </button>
                        <button 
                          onClick={() => setSelectedManageInvoice(inv)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          title="Kelola Invoice"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Buat Invoice Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
              {/* Header Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Nomor Invoice</label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Nama Pelanggan</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        required
                        placeholder="Nama pelanggan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Nomor HP</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="628xxxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Jatuh Tempo</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="date"
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Alamat Pelanggan</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3 text-muted" />
                      <textarea
                        placeholder="Alamat penagihan pelanggan"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="input-field pl-10 h-[84px] resize-none py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Item Tagihan</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-secondary text-[11px] py-1 px-3 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Deskripsi barang / jasa"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                          className="input-field text-center"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="Harga"
                          value={item.price || ""}
                          onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                          className="input-field text-right"
                        />
                      </div>
                      <div className="w-28 text-right font-bold text-[var(--foreground)] px-2">
                        {formatCurrency(item.quantity * item.price)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 rounded-lg hover:bg-[var(--muted)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Bottom */}
              <div className="border-t border-[var(--border)] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Catatan</label>
                  <textarea
                    placeholder="Catatan rekening transfer, dsb."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field h-[80px] resize-none py-2"
                  />
                </div>

                <div className="space-y-2 text-xs font-semibold text-[var(--muted-foreground)]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[var(--foreground)]">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pajak PPN (%)</span>
                    <div className="w-20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                        className="input-field py-1 text-center"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[var(--foreground)] border-t border-[var(--border)] pt-2">
                    <span>Total Tagihan</span>
                    <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
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
                    "Simpan Invoice"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Invoice Status Modal */}
      {selectedManageInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Kelola Invoice</h2>
              <button onClick={() => setSelectedManageInvoice(null)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-[var(--foreground)]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">Nomor Invoice</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-0.5">{selectedManageInvoice.invoice_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">Pelanggan</p>
                  <p className="text-xs text-[var(--foreground)] font-semibold mt-0.5">{selectedManageInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">Total Tagihan</p>
                  <p className="text-xs text-primary font-bold mt-0.5">{formatCurrency(selectedManageInvoice.total)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-3 space-y-2 text-[var(--foreground)]">
              <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider mb-2">Ubah Status Pembayaran</p>
              
              {selectedManageInvoice.status !== "paid" && (
                <button
                  onClick={() => {
                    updateStatus(selectedManageInvoice.id, "paid");
                    setSelectedManageInvoice(null);
                  }}
                  className="w-full btn-secondary text-xs py-2 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} />
                  Tandai Lunas
                </button>
              )}

              {selectedManageInvoice.status !== "sent" && selectedManageInvoice.status !== "paid" && (
                <button
                  onClick={() => {
                    updateStatus(selectedManageInvoice.id, "sent");
                    setSelectedManageInvoice(null);
                  }}
                  className="w-full btn-secondary text-xs py-2 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  Tandai Terkirim
                </button>
              )}

              {selectedManageInvoice.status !== "cancelled" && (
                <button
                  onClick={() => {
                    updateStatus(selectedManageInvoice.id, "cancelled");
                    setSelectedManageInvoice(null);
                  }}
                  className="w-full btn-secondary text-xs py-2 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 flex items-center justify-center gap-2"
                >
                  <XCircle size={15} />
                  Batalkan Invoice
                </button>
              )}

              <div className="border-t border-[var(--border)] my-3" />

              <button
                onClick={() => {
                  deleteInvoice(selectedManageInvoice.id);
                  setSelectedManageInvoice(null);
                }}
                className="w-full btn-secondary text-xs py-2 border-rose-500/30 hover:bg-rose-500/10 text-rose-500 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                Hapus Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
