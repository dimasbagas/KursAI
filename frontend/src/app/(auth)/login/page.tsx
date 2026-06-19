"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Login gagal");

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.user.id)
        .limit(1)
        .maybeSingle();

      let businessId = business?.id;
      let userRole = profile?.role || data.user.user_metadata?.role || "owner";

      if (!businessId) {
        const { data: teamMember } = await supabase
          .from("team_members")
          .select("business_id, role")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();
          
        if (teamMember) {
          businessId = teamMember.business_id;
          userRole = teamMember.role || "staff";
        }
      }

      const userData = {
        id: data.user.id,
        name: profile?.name || data.user.user_metadata?.name || email.split("@")[0],
        email: data.user.email || email,
        role: userRole,
      };

      useAuthStore.getState().setAuth(userData, businessId || undefined);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal. Silakan coba lagi.");
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
          <h1 className="text-3xl font-serif font-bold text-[#17191c] tracking-tight">Masuk ke KursAI</h1>
          <p className="text-[#4c4c4c] mt-2 font-sans text-sm">AI Business Assistant untuk UMKM</p>
        </div>

        <div className="bg-white border border-[#a3a6af]/30 rounded-[24px] p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f7f7f8] border border-[#a3a6af]/40 rounded-xl px-4 py-2.5 pr-10 text-[#17191c] placeholder:text-[#777b86] focus:outline-none focus:ring-2 focus:ring-[#17191c] focus:border-[#17191c] transition-all duration-200"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777b86] hover:text-[#17191c]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-[#5d2a1a] hover:text-black transition-colors">
                Lupa password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[#17191c] text-white font-semibold hover:bg-black transition-all duration-200 shadow-sm disabled:opacity-50">
              {loading ? "Memproses..." : "Masuk"}
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
              className="w-full flex items-center justify-center gap-2 border border-[#a3a6af]/40 bg-white text-[#17191c] font-medium py-2.5 rounded-xl hover:bg-[#f7f7f8] transition-all duration-200 shadow-sm mt-3"
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

        <p className="text-center mt-6 text-sm text-[#4c4c4c]">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#5d2a1a] hover:text-black font-semibold transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
