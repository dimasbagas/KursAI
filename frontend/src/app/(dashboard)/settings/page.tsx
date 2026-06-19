"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Building,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  MessageSquare,
  Bell,
  CheckCircle,
  HelpCircle,
  Database
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsPage() {
  const router = useRouter();
  const businessId = useAuthStore((s) => s.businessId);
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // States
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [dbNeedsMigration, setDbNeedsMigration] = useState(false);

  // User Profile
  const [fullName, setFullName] = useState("");
  const [phoneUser, setPhoneUser] = useState("");
  const [emailUser, setEmailUser] = useState("");

  // Business Profile
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [category, setCategory] = useState("Lainnya");
  const [legalEntity, setLegalEntity] = useState("Personal");
  const [npwp, setNpwp] = useState("");
  const [useTaxScheme, setUseTaxScheme] = useState(true);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Preferences
  const [pushEnabled, setPushEnabled] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || "");
      setEmailUser(currentUser.email || "");
      loadUserData();
    }
    if (businessId) {
      loadBusinessData();
    } else {
      setLoading(false);
    }
  }, [businessId, currentUser]);

  // Handle local storage fallback values if migration has not been run
  useEffect(() => {
    if (businessId && dbNeedsMigration) {
      try {
        const stored = localStorage.getItem(`fallback_biz_${businessId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCategory(parsed.category || "Lainnya");
          setLegalEntity(parsed.legal_entity || "Personal");
          setNpwp(parsed.npwp || "");
          setUseTaxScheme(parsed.use_tax_scheme ?? true);
          setLocation(parsed.location || "");
          setDescription(parsed.description || "");
        }
      } catch (e) {
        console.error("Failed to load local fallback business data", e);
      }
    }
  }, [businessId, dbNeedsMigration]);

  const loadUserData = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from("users")
        .select("phone")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (data && data.phone) {
        setPhoneUser(data.phone);
      }
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  };

  const loadBusinessData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      // Query with custom extra columns from migration 00003
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .select("id, name, address, phone, timezone, category, legal_entity, npwp, use_tax_scheme, location, description")
        .eq("id", businessId)
        .maybeSingle();

      if (bizError) {
        console.warn("Extra settings columns may be missing. Running fallback query...");
        setDbNeedsMigration(true);
        
        // Fallback to standard columns
        const { data: safeBiz } = await supabase
          .from("businesses")
          .select("id, name, address, phone, timezone")
          .eq("id", businessId)
          .maybeSingle();
        
        if (safeBiz) {
          setBusinessName(safeBiz.name);
          setPhone(safeBiz.phone || "");
          setAddress(safeBiz.address || "");
          setTimezone(safeBiz.timezone || "Asia/Jakarta");
        }
      } else if (biz) {
        setBusinessName(biz.name);
        setPhone(biz.phone || "");
        setAddress(biz.address || "");
        setTimezone(biz.timezone || "Asia/Jakarta");
        setCategory(biz.category || "Lainnya");
        setLegalEntity(biz.legal_entity || "Personal");
        setNpwp(biz.npwp || "");
        setUseTaxScheme(biz.use_tax_scheme ?? true);
        setLocation(biz.location || "");
        setDescription(biz.description || "");
      }
    } catch (err) {
      console.error("Failed to load business settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      // Update in public.users
      const { error } = await supabase
        .from("users")
        .update({
          name: fullName.trim(),
          phone: phoneUser.trim() || null
        })
        .eq("id", currentUser.id);

      if (error) throw error;
      
      // Update state in store
      useAuthStore.getState().setAuth(
        { ...currentUser, name: fullName.trim() },
        businessId || undefined
      );

      alert("Profil Anda berhasil diperbarui!");
    } catch (err: any) {
      console.error("Failed to save profile", err);
      alert("Gagal menyimpan profil: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSavingBusiness(true);
    try {
      const payload: any = {
        name: businessName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        timezone
      };

      // If DB migration was not executed, save extra columns locally instead of DB payload
      if (!dbNeedsMigration) {
        payload.category = category;
        payload.legal_entity = legalEntity;
        payload.npwp = npwp.trim() || null;
        payload.use_tax_scheme = useTaxScheme;
        payload.location = location.trim() || null;
        payload.description = description.trim() || null;
      } else {
        // Save to local storage as fallback
        localStorage.setItem(`fallback_biz_${businessId}`, JSON.stringify({
          category,
          legal_entity: legalEntity,
          npwp,
          use_tax_scheme: useTaxScheme,
          location,
          description
        }));
      }

      const { error } = await supabase
        .from("businesses")
        .update(payload)
        .eq("id", businessId);

      if (error) throw error;
      alert("Informasi usaha Anda berhasil diperbarui!");
    } catch (err: any) {
      console.error("Failed to save business info", err);
      alert("Gagal menyimpan informasi usaha: " + err.message);
    } finally {
      setSavingBusiness(false);
    }
  };

  // 1-Click Offline JSON Backup
  const handleExportData = async () => {
    if (!businessId) return;
    try {
      const [pRes, tRes, iRes, dRes] = await Promise.all([
        supabase.from("products").select("*").eq("business_id", businessId),
        supabase.from("transactions").select("*").eq("business_id", businessId),
        supabase.from("invoices").select("*").eq("business_id", businessId),
        supabase.from("documents").select("*").eq("business_id", businessId)
      ]);

      const backup = {
        version: "kursai_backup_v1",
        exportedAt: new Date().toISOString(),
        businessName,
        products: pRes.data || [],
        transactions: tRes.data || [],
        invoices: iRes.data || [],
        documents: dRes.data || []
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup_kursai_${businessName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      console.error("Backup failed", err);
      alert("Gagal melakukan ekspor data: " + err.message);
    }
  };

  // Restore from JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (backup.version !== "kursai_backup_v1") {
          alert("Format file backup tidak valid.");
          return;
        }

        if (!confirm(`Konfirmasi impor data dari cadangan "${backup.businessName}"? Impor akan menambahkan data baru ke usaha Anda.`)) return;

        setLoading(true);

        // Import Products (skip duplicates by name)
        let importedProducts = 0;
        if (backup.products && backup.products.length > 0) {
          const { data: existing } = await supabase.from("products").select("name").eq("business_id", businessId);
          const existingNames = new Set(existing?.map((p: any) => p.name.toLowerCase()) || []);
          
          const productsToInsert = backup.products
            .filter((p: any) => !existingNames.has(p.name.toLowerCase()))
            .map((p: any) => ({
              business_id: businessId,
              name: p.name,
              sku: p.sku || null,
              category: p.category || null,
              stock: p.stock || 0,
              buy_price: p.buy_price || 0,
              sell_price: p.sell_price || 0,
              min_stock: p.min_stock || 0,
              unit: p.unit || "pcs",
              description: p.description || null
            }));

          if (productsToInsert.length > 0) {
            const { error } = await supabase.from("products").insert(productsToInsert);
            if (error) throw error;
            importedProducts = productsToInsert.length;
          }
        }

        // Import Transactions
        let importedTransactions = 0;
        if (backup.transactions && backup.transactions.length > 0) {
          const txsToInsert = backup.transactions.map((t: any) => ({
            business_id: businessId,
            type: t.type,
            amount: t.amount,
            quantity: t.quantity || 1,
            note: t.note || null,
            customer_name: t.customer_name || null,
            date: t.date || new Date().toISOString()
          }));

          if (txsToInsert.length > 0) {
            const { error } = await supabase.from("transactions").insert(txsToInsert);
            if (error) throw error;
            importedTransactions = txsToInsert.length;
          }
        }

        // Import Invoices
        let importedInvoices = 0;
        if (backup.invoices && backup.invoices.length > 0) {
          const invsToInsert = backup.invoices.map((i: any) => ({
            business_id: businessId,
            invoice_number: i.invoice_number,
            customer_name: i.customer_name,
            customer_phone: i.customer_phone || null,
            customer_address: i.customer_address || null,
            subtotal: i.subtotal || 0,
            tax: i.tax || 0,
            total: i.total || 0,
            status: i.status || "draft",
            notes: i.notes || null,
            due_date: i.due_date || null,
            created_at: i.created_at || new Date().toISOString()
          }));

          if (invsToInsert.length > 0) {
            const { error } = await supabase.from("invoices").insert(invsToInsert);
            if (error) throw error;
            importedInvoices = invsToInsert.length;
          }
        }

        // Import Documents
        let importedDocuments = 0;
        if (backup.documents && backup.documents.length > 0) {
          const docsToInsert = backup.documents.map((d: any) => ({
            business_id: businessId,
            type: d.type,
            title: d.title,
            content: d.content || {},
            created_at: d.created_at || new Date().toISOString()
          }));

          if (docsToInsert.length > 0) {
            const { error } = await supabase.from("documents").insert(docsToInsert);
            if (error) throw error;
            importedDocuments = docsToInsert.length;
          }
        }

        alert(`Impor data sukses! Mengimpor ${importedProducts} produk baru, ${importedTransactions} transaksi, ${importedInvoices} faktur, dan ${importedDocuments} dokumen.`);
        loadBusinessData();
      } catch (err: any) {
        console.error("Import failed", err);
        alert("Gagal mengimpor data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Delete all financial data (transactions, invoices, and products)
  const handleResetFinance = async () => {
    if (!businessId) return;
    if (!confirm("PERINGATAN: Apakah Anda yakin ingin MERESET data keuangan Anda? Seluruh transaksi usaha, invoice/faktur, dan utang kasbon akan terhapus permanen dari toko ini!")) return;
    
    setLoading(true);
    try {
      // Delete transactions first (due to foreign key constraints)
      const { error: txError } = await supabase.from("transactions").delete().eq("business_id", businessId);
      if (txError) throw txError;

      // Delete invoices
      const { error: invError } = await supabase.from("invoices").delete().eq("business_id", businessId);
      if (invError) throw invError;

      // Delete products (kartu stok)
      const { error: prodError } = await supabase.from("products").delete().eq("business_id", businessId);
      if (prodError) throw prodError;

      alert("Data keuangan dan kartu stok berhasil di-reset menjadi nol!");
    } catch (err: any) {
      console.error("Reset failed", err);
      alert("Gagal melakukan reset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete entire business account
  const handleDeleteBusiness = async () => {
    if (!businessId) return;
    const confirmName = prompt(`ZONA BAHAYA! Tindakan ini akan menghapus seluruh data bisnis "${businessName}", data produk, riwayat transaksi, invoices, dokumen, dan staff secara PERMANEN!\n\nUntuk mengonfirmasi, ketik nama bisnis Anda di bawah ini:`);
    
    if (confirmName !== businessName) {
      alert("Konfirmasi gagal. Nama bisnis tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", businessId);

      if (error) throw error;

      alert("Data bisnis Anda telah sepenuhnya dihapus dari sistem.");
      await logout();
      router.push("/register");
    } catch (err: any) {
      console.error("Failed to delete business", err);
      alert("Gagal menghapus bisnis: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSupport = () => {
    const text = `Halo tim support DagangkuAI, saya mempunyai kendala / masukan tentang aplikasi yaitu...`;
    window.open(`https://api.whatsapp.com/send?phone=628123456789&text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4">
      {/* Title */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Pengaturan</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 text-[var(--foreground)]">
          {/* 1. User Profile Form */}
          <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Profil</h2>
              <p className="text-xs text-muted-foreground mt-1">Kelola informasi pribadi Anda</p>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxx"
                  value={phoneUser}
                  onChange={(e) => setPhoneUser(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-primary hover:bg-primary-hover text-[var(--primary-foreground)] font-bold px-6 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingProfile && <Loader2 size={14} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>

          {/* 2. Business Profile Form */}
          {businessId && (
            <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Usaha</h2>
                <p className="text-xs text-muted-foreground mt-1">Kelola informasi usaha Anda</p>
              </div>
              <form onSubmit={handleSaveBusiness} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Nama Usaha</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Jenis Usaha</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Makanan & Minuman">Makanan & Minuman (F&B)</option>
                      <option value="Kelontong & Ritel">Kelontong & Ritel</option>
                      <option value="Pakaian & Fashion">Pakaian & Fashion</option>
                      <option value="Jasa & Servis">Jasa & Servis</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Bentuk Badan Usaha</label>
                    <select
                      value={legalEntity}
                      onChange={(e) => setLegalEntity(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Personal">Personal</option>
                      <option value="CV">CV</option>
                      <option value="PT">PT</option>
                    </select>
                    <span className="block text-[10px] text-muted-foreground mt-1.5 leading-normal">
                      Menentukan standar laporan keuangan (SAK EMKM / SAK EP) pada ekspor laporan
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">NPWP (opsional)</label>
                    <input
                      type="text"
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                      placeholder="00.000.000.0-000.000"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Lokasi</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="bali"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="block text-xs font-semibold text-[var(--foreground)]">Pakai skema PPh Final UMKM 0,5%</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5 leading-normal">
                      PPh Final 0,5% dari omzet bruto sesuai PP 55/2022
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseTaxScheme(!useTaxScheme)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: useTaxScheme ? 'var(--primary)' : 'var(--border)' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      style={{ transform: useTaxScheme ? 'translateX(20px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Deskripsi</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi singkat usaha Anda"
                    className="input-field h-24 resize-none py-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Alamat Usaha</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Alamat penagihan usaha Anda..."
                      className="input-field h-20 resize-none py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">Zona Waktu</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingBusiness}
                    className="bg-primary hover:bg-primary-hover text-[var(--primary-foreground)] font-bold px-6 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingBusiness && <Loader2 size={14} className="animate-spin" />}
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Preferences Card */}
          <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Notifikasi</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Terima pengingat dan kabar penting dari KursAI langsung di perangkat ini.
              </p>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="block text-xs font-semibold text-[var(--foreground)]">Notifikasi push</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5 leading-normal">
                  Aktifkan untuk menerima notifikasi di perangkat ini.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPushEnabled(!pushEnabled)}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{ backgroundColor: pushEnabled ? 'var(--primary)' : 'var(--border)' }}
              >
                <span
                  className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  style={{ transform: pushEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                />
              </button>
            </div>
          </div>

          {/* 4. Feedback & Support Card */}
          <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Masukan & Saran</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Punya ide, saran, atau menemukan kendala? Ceritakan kepada kami agar KursAI semakin baik.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleWhatsAppSupport}
                className="btn-secondary text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5"
              >
                Beri Masukan
              </button>
            </div>
          </div>

          {/* 5. Data Saya Card */}
          {businessId && (
            <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Data Saya</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Unduh seluruh data bisnismu (transaksi, produk, kasbon, stok, modal, faktur) sebagai satu file cadangan, dan impor kembali kapan saja.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn-secondary text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Ekspor data
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  accept=".json"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  Impor data
                </button>
              </div>
              
              <span className="block text-[10px] text-muted-foreground leading-normal">
                Impor menambahkan data dari file ke bisnismu saat ini. Produk dan faktur yang namanya/nomornya sudah ada akan dilewati agar tidak ganda.
              </span>
            </div>
          )}

          {/* 6. Reset Data Keuangan Section */}
          {businessId && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-2.5">
                <RotateCcw size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-amber-600 dark:text-amber-500 leading-tight">Reset Data Keuangan</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mulai pembukuan dari nol tanpa menghapus akun atau langganan Anda.
                  </p>
                </div>
              </div>
              
              <div className="border border-amber-500/30 bg-[var(--muted)]/50 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500">Hapus Semua Catatan Keuangan</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Menghapus seluruh transaksi, utang-piutang, modal, faktur & kwitansi, serta kartu stok usaha ini. Akun, langganan, kredit AI, dan anggota tim tetap aman. Data bisa dipulihkan dalam 30 hari setelah dihapus, setelah itu hilang selamanya.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetFinance}
                    className="border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold px-5 py-2 rounded-xl text-xs transition-all duration-200"
                  >
                    Reset Data Keuangan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7. Danger Zone Section */}
          {businessId && currentUser?.role === "owner" && (
            <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-rose-600 dark:text-rose-500 leading-tight">Zona Berbahaya</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              
              <div className="border border-rose-500/30 bg-[var(--muted)]/50 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500">Hapus Data Bisnis</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Semua data bisnis, transaksi, dan riwayat chat akan dijadwalkan dihapus. Kamu punya 30 hari untuk memulihkannya sebelum dihapus permanen. Ekspor dulu lewat "Data Saya" jika perlu cadangan.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeleteBusiness}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold px-5 py-2 rounded-xl text-xs transition-all duration-200"
                  >
                    Hapus Data Bisnis
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
