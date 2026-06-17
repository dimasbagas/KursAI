"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Shield,
  UserCog,
  User,
  Mail,
  Trash2,
  Loader2,
  X,
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface TeamMemberDetail {
  id: string; // team_member.id
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "manager" | "staff";
  can_create_transaction: boolean;
  can_manage_stock: boolean;
  can_view_reports: boolean;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMemberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  
  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [inviting, setInviting] = useState(false);

  const businessId = useAuthStore((s) => s.businessId);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (businessId) {
      loadTeamMembers();
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const loadTeamMembers = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      // 1. Fetch team members relations
      const { data: teamData, error: teamError } = await supabase
        .from("team_members")
        .select("*")
        .eq("business_id", businessId);
      
      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setMembers([]);
        return;
      }

      // 2. Fetch associated users profiles
      const userIds = teamData.map((m) => m.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);
      
      if (usersError) throw usersError;

      // 3. Map together
      const mapped: TeamMemberDetail[] = teamData.map((member) => {
        const profile = usersData?.find((u) => u.id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          name: profile?.name || "Pengguna KursAI",
          email: profile?.email || "unknown@email.com",
          avatar: profile?.avatar || undefined,
          role: member.role,
          can_create_transaction: member.can_create_transaction,
          can_manage_stock: member.can_manage_stock,
          can_view_reports: member.can_view_reports,
        };
      });

      setMembers(mapped);
    } catch (err: any) {
      console.error("Failed to load team members", err);
      alert("Gagal memuat tim: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      // 1. Verify if user email exists in auth/public users
      const { data: targetUser, error: findError } = await supabase
        .from("users")
        .select("id")
        .eq("email", inviteEmail.trim().toLowerCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!targetUser) {
        alert("Email tidak terdaftar di KursAI. Pastikan rekan Anda sudah melakukan registrasi akun KursAI terlebih dahulu.");
        return;
      }

      // 2. Check if already a member
      const isAlreadyMember = members.some((m) => m.user_id === targetUser.id);
      if (isAlreadyMember) {
        alert("Pengguna tersebut sudah ditambahkan ke dalam tim bisnis Anda.");
        return;
      }

      // 3. Insert new member connection
      const { error: insertError } = await supabase
        .from("team_members")
        .insert({
          business_id: businessId,
          user_id: targetUser.id,
          role: inviteRole,
          can_create_transaction: true,
          can_manage_stock: inviteRole === "manager",
          can_view_reports: inviteRole === "manager"
        });

      if (insertError) throw insertError;

      setShowInvite(false);
      setInviteEmail("");
      loadTeamMembers();
    } catch (err: any) {
      console.error("Failed to invite member", err);
      alert("Gagal mengundang anggota: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const togglePermission = async (member: TeamMemberDetail, field: "can_create_transaction" | "can_manage_stock" | "can_view_reports") => {
    // Prevent self-lockout or changes if not owner (though RLS rules protect this, we do it in client UX too)
    if (currentUser?.role !== "owner") {
      alert("Hanya Pemilik Toko (Owner) yang dapat mengubah perizinan anggota tim.");
      return;
    }

    try {
      const newValue = !member[field];
      const { error } = await supabase
        .from("team_members")
        .update({ [field]: newValue })
        .eq("id", member.id);
      
      if (error) throw error;
      
      // Update local state instantly
      setMembers(members.map(m => m.id === member.id ? { ...m, [field]: newValue } : m));
    } catch (err: any) {
      console.error("Failed to toggle permission", err);
      alert("Gagal memperbarui izin: " + err.message);
    }
  };

  const handleRemoveMember = async (member: TeamMemberDetail) => {
    if (currentUser?.role !== "owner") {
      alert("Hanya Pemilik Toko (Owner) yang dapat menghapus anggota tim.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengeluarkan ${member.name} dari tim?`)) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", member.id);
      
      if (error) throw error;
      loadTeamMembers();
    } catch (err: any) {
      console.error("Failed to delete member", err);
      alert("Gagal mengeluarkan anggota tim: " + err.message);
    }
  };

  const permissionLabel = {
    can_create_transaction: "Buat Transaksi",
    can_manage_stock: "Kelola Stok",
    can_view_reports: "Lihat Laporan"
  };

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Tim & Akses</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Undang staf toko Anda dan atur perizinan akses mereka secara real-time</p>
        </div>
        {currentUser?.role === "owner" && (
          <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2 text-[var(--primary-foreground)]">
            <Plus size={18} />
            Undang Anggota
          </button>
        )}
      </div>

      {/* Roles Info Guide */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-primary" />
          <span className="text-sm font-bold text-[var(--foreground)] tracking-wider uppercase">Panduan Peran & Perizinan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="bg-[var(--muted)]/40 border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400">
              <UserCog size={18} />
              <span className="font-bold">Manager</span>
            </div>
            <p className="text-[var(--muted-foreground)] leading-relaxed font-normal">
              Manager ditujukan untuk asisten kepercayaan Anda. Secara bawaan memiliki izin penuh atas pengelolaan stok barang, laporan keuangan, dan pencatatan transaksi.
            </p>
          </div>
          <div className="bg-[var(--muted)]/40 border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <User size={18} />
              <span className="font-bold">Staff</span>
            </div>
            <p className="text-[var(--muted-foreground)] leading-relaxed font-normal">
              Staff ditujukan untuk kasir penjaga toko. Secara bawaan hanya diperbolehkan mencatat penjualan harian dan tidak dapat merubah modal produk atau melihat laba rugi.
            </p>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card">
        <h2 className="text-base font-bold text-[var(--foreground)] mb-4">Anggota Tim Aktif</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)] font-semibold">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada anggota tim terdaftar</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Undang kasir atau asisten toko Anda untuk berkolaborasi mencatat pembukuan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] gap-4"
              >
                {/* Profile Block */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    member.role === "manager" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-green-500/10 text-green-600 dark:text-green-400"
                  }`}>
                    {member.role === "manager" ? <UserCog size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--foreground)]">{member.name}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">{member.email}</p>
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t sm:border-t-0 border-[var(--border)]/40 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>Transaksi:</span>
                    <button 
                      onClick={() => togglePermission(member, "can_create_transaction")}
                      className={`transition-colors duration-200 ${member.can_create_transaction ? "text-primary" : "text-[var(--muted-foreground)] opacity-40"}`}
                    >
                      {member.can_create_transaction ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>Stok:</span>
                    <button 
                      onClick={() => togglePermission(member, "can_manage_stock")}
                      className={`transition-colors duration-200 ${member.can_manage_stock ? "text-primary" : "text-[var(--muted-foreground)] opacity-40"}`}
                    >
                      {member.can_manage_stock ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>Laporan:</span>
                    <button 
                      onClick={() => togglePermission(member, "can_view_reports")}
                      className={`transition-colors duration-200 ${member.can_view_reports ? "text-primary" : "text-[var(--muted-foreground)] opacity-40"}`}
                    >
                      {member.can_view_reports ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  {currentUser?.role === "owner" && (
                    <button 
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 rounded-lg hover:bg-[var(--muted)] transition-colors"
                      title="Keluarkan Anggota"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Undang Rekan Ke Tim</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs font-semibold text-[var(--foreground)]">
              <div>
                <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Email Rekan Anda</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field pl-10 placeholder:text-[var(--muted-foreground)]" 
                    placeholder="nama@email.com" 
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] font-normal mt-1 leading-normal">
                  * Rekan Anda harus terdaftar terlebih dahulu di aplikasi KursAI sebelum dapat dimasukkan ke dalam tim.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Peran Default</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="input-field text-[var(--foreground)] bg-[var(--card)]"
                >
                  <option value="staff">Staff (Kasir - akses transaksi terbatas)</option>
                  <option value="manager">Manager (Akses penuh kecuali kepemilikan)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInvite(false)} 
                  className="btn-secondary flex-1 py-2"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={inviting}
                  className="btn-primary text-[var(--primary-foreground)] flex-1 py-2 flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menghubungkan...
                    </>
                  ) : (
                    "Tambahkan Tim"
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
