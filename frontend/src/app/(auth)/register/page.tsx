"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Pendaftaran gagal");

      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .insert({ owner_id: data.user.id, name: businessName })
        .select()
        .single();

      if (bizError) throw bizError;

      await supabase.from("subscriptions").insert({
        business_id: business.id,
      });

      const userData = {
        id: data.user.id,
        name,
        email,
        role: "owner",
      };

      useAuthStore.getState().setAuth(userData, business.id);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google.");
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isDemoMode", "true");
      localStorage.setItem(
        "demoUser",
        JSON.stringify({
          id: "demo-user-id",
          name: "Dimas Bagas (Demo)",
          email: "demo@kursai.com",
          role: "owner",
        })
      );
      localStorage.setItem("demoBusinessId", "demo-business-id");
    }
    setAuth(
      {
        id: "demo-user-id",
        name: "Dimas Bagas (Demo)",
        email: "demo@kursai.com",
        role: "owner",
      },
      "demo-business-id"
    );
    useAuthStore.getState().setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#17191c] selection:bg-[#fbe1d1] selection:text-[#5d2a1a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Floating Animated Blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#fbe1d1]/30 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#d3e3fc]/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#17191c] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Bot size={32} className="text-[#fbe1d1]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#17191c] tracking-tight">Daftar KursAI</h1>
          <p className="text-[#4c4c4c] mt-2 font-sans text-sm">Mulai kelola bisnis Anda dengan AI</p>
        </div>

        <div className="bg-white border border-[#a3a6af]/30 rounded-[24px] p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4c4c4c] mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f7f7f8] border border-[#a3a6af]/40 rounded-xl px-4 py-2.5 text-[#17191c] placeholder:text-[#777b86] focus:outline-none focus:ring-2 focus:ring-[#17191c] focus:border-[#17191c] transition-all duration-200"
                placeholder="Nama Anda"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4c4c4c] mb-1.5">Nama Usaha</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#f7f7f8] border border-[#a3a6af]/40 rounded-xl px-4 py-2.5 text-[#17191c] placeholder:text-[#777b86] focus:outline-none focus:ring-2 focus:ring-[#17191c] focus:border-[#17191c] transition-all duration-200"
                placeholder="Warung Bu Siti"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4c4c4c] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f7f7f8] border border-[#a3a6af]/40 rounded-xl px-4 py-2.5 text-[#17191c] placeholder:text-[#777b86] focus:outline-none focus:ring-2 focus:ring-[#17191c] focus:border-[#17191c] transition-all duration-200"
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4c4c4c] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f7f7f8] border border-[#a3a6af]/40 rounded-xl px-4 py-2.5 text-[#17191c] placeholder:text-[#777b86] focus:outline-none focus:ring-2 focus:ring-[#17191c] focus:border-[#17191c] transition-all duration-200"
                placeholder="Minimal 6 karakter"
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[#17191c] text-white font-semibold hover:bg-black transition-all duration-200 shadow-sm disabled:opacity-50">
              {loading ? "Memproses..." : "Daftar Gratis"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#a3a6af]/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[#777b86]">atau</span>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 bg-[#fbe1d1] text-[#5d2a1a] font-semibold py-2.5 rounded-xl hover:bg-[#fad4bf] transition-all duration-200 shadow-sm"
              >
                <Sparkles size={18} />
                Cobain Mode Demo (Bypass Login)
              </button>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-secondary py-2.5 mt-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:text-primary-light font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
