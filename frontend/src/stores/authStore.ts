import { create } from "zustand";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  businessId: string | null;
  isLoading: boolean;
  setAuth: (user: User, businessId?: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  businessId: null,
  isLoading: true,
  setAuth: (user, businessId) => {
    set({ user, businessId });
  },
  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isDemoMode");
      localStorage.removeItem("demoUser");
      localStorage.removeItem("demoBusinessId");
    }
    await supabase.auth.signOut();
    set({ user: null, businessId: null });
  },
  setLoading: (isLoading) => set({ isLoading }),
  loadUser: async () => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("isDemoMode") === "true") {
        const savedUser = localStorage.getItem("demoUser");
        const savedBusinessId = localStorage.getItem("demoBusinessId");
        
        const resolvedUser = savedUser ? JSON.parse(savedUser) : {
          id: "demo-user-id",
          name: "Dimas Bagas (Demo)",
          email: "demo@kursai.com",
          role: "owner"
        };
        
        set({
          user: resolvedUser,
          businessId: savedBusinessId || "demo-business-id",
          isLoading: false,
        });
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        set({ user: null, businessId: null, isLoading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", authUser.id)
        .limit(1)
        .maybeSingle();

      let businessId = business?.id || null;
      let resolvedUser = profile || { id: authUser.id, name: authUser.user_metadata?.name || "", email: authUser.email || "", role: "owner" };

      if (!businessId) {
        const { data: teamMember } = await supabase
          .from("team_members")
          .select("business_id, role")
          .eq("user_id", authUser.id)
          .limit(1)
          .maybeSingle();
          
        if (teamMember) {
          businessId = teamMember.business_id;
          resolvedUser = {
            ...resolvedUser,
            role: teamMember.role || "staff"
          };
        }
      }

      set({
        user: resolvedUser,
        businessId,
        isLoading: false,
      });
    } catch {
      set({ user: null, businessId: null, isLoading: false });
    }
  },
}));
