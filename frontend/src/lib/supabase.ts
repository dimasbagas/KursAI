import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasValidKey = supabaseAnonKey && supabaseAnonKey !== "your_supabase_anon_key";
const hasValidUrl = isValidUrl(supabaseUrl) && supabaseUrl !== "your_supabase_url";

const urlToUse = hasValidUrl ? supabaseUrl : "https://placeholder-project.supabase.co";
const keyToUse = hasValidKey ? supabaseAnonKey : "placeholder-anon-key";

if (!hasValidUrl || !hasValidKey) {
  console.warn(
    "⚠️ [KursAI] Supabase is not properly configured. " +
    "Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local"
  );
}

// 1. Real Supabase Client Instance
const realSupabase = createClient(urlToUse, keyToUse);

// 2. Mock Storage Seed Utilities for Demo Mode
const getSeedData = (tableName: string): any[] => {
  if (tableName === "users") {
    return [
      { id: "demo-user-id", name: "Dimas Bagas (Demo)", email: "demo@kursai.com", role: "owner" }
    ];
  }
  if (tableName === "businesses") {
    return [
      { id: "demo-business-id", owner_id: "demo-user-id", name: "Warung Kopi Dimas Bagas", category: "Kuliner", legal_entity: "Perseorangan", location: "Pamekasan", npwp: "12.345.678.9-012.000", description: "Warung kopi minimalis dengan racikan biji kopi Nusantara premium." }
    ];
  }
  if (tableName === "team_members") {
    return [
      { id: "team-1", business_id: "demo-business-id", user_id: "staff-1", name: "Gusion Gg", email: "gusion@email.com", role: "staff", can_create_transaction: true, can_manage_stock: true, can_view_reports: true }
    ];
  }
  if (tableName === "products") {
    return [
      { id: "prod-1", business_id: "demo-business-id", name: "Nasi Goreng Spesial", category: "Makanan", sell_price: 25000, buy_price: 15000, price: 25000, cost_price: 15000, stock: 35, min_stock: 5, tracking_stock: true, active: true },
      { id: "prod-2", business_id: "demo-business-id", name: "Es Teh Manis", category: "Minuman", sell_price: 8000, buy_price: 3000, price: 8000, cost_price: 3000, stock: 80, min_stock: 10, tracking_stock: true, active: true },
      { id: "prod-3", business_id: "demo-business-id", name: "Kopi Gayo Arabica", category: "Minuman", sell_price: 18000, buy_price: 8000, price: 18000, cost_price: 8000, stock: 24, min_stock: 5, tracking_stock: true, active: true },
      { id: "prod-4", business_id: "demo-business-id", name: "Indomie Goreng", category: "Makanan", sell_price: 12000, buy_price: 6000, price: 12000, cost_price: 6000, stock: 4, min_stock: 5, tracking_stock: true, active: true }
    ];
  }
  if (tableName === "transactions") {
    const txs = [];
    const today = new Date();
    const notes = {
      penjualan: ["Nasi Goreng + Es Teh", "Es Teh Manis", "Kopi Gayo Arabica", "Makan Siang Pelanggan", "2x Nasi Goreng"],
      pengeluaran: ["Gaji Karyawan Harian", "Bayar Listrik Bulanan", "Beli Sabun Cuci Piring", "Isi Ulang Gas LPG", "Sewa Internet"],
      pembelian: ["Beli Biji Kopi Gayo 2kg", "Bahan Makanan Sayur & Beras", "Beli Es Batu", "Stok Teh Celup"]
    };
    
    for (let i = 45; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const type = i % 3 === 0 ? "pengeluaran" : (i % 5 === 0 ? "pembelian" : "penjualan");
      const list = notes[type as keyof typeof notes];
      const note = list[i % list.length];
      let amount = 0;
      let quantity = 1;
      
      if (type === "penjualan") {
        amount = (i % 2 === 0 ? 33000 : 26000) + (i % 7) * 5000;
        quantity = (i % 3) + 1;
      } else if (type === "pembelian") {
        amount = 120000 + (i % 5) * 20000;
      } else {
        amount = 15000 + (i % 4) * 8000;
        if (note === "Gaji Karyawan Harian") amount = 100000;
        if (note === "Bayar Listrik Bulanan") amount = 150000;
      }
      
      txs.push({
        id: `tx-${45 - i}`,
        business_id: "demo-business-id",
        type,
        amount,
        quantity,
        note: `[Usaha] ${note}`,
        customer_name: type === "penjualan" ? `Pelanggan ${i}` : null,
        date: date.toISOString(),
        created_at: date.toISOString()
      });
    }
    return txs;
  }
  if (tableName === "kasbon") {
    return [
      { id: "kas-1", business_id: "demo-business-id", type: "piutang", customer_name: "Budi Santoso", amount: 50000, paid_amount: 0, date: new Date().toISOString(), status: "belum_lunas", description: "Kasbon Nasi Goreng 2 porsi" },
      { id: "kas-2", business_id: "demo-business-id", type: "utang", customer_name: "Supplier Kopi", amount: 150000, paid_amount: 150000, date: new Date().toISOString(), status: "lunas", description: "Beli kopi bubuk kemarin" }
    ];
  }
  if (tableName === "invoices") {
    return [
      { id: "inv-1", business_id: "demo-business-id", invoice_number: "INV/20260618/0001", customer_name: "Roni Setiawan", client_name: "Roni Setiawan", customer_phone: "08123456789", client_phone: "08123456789", customer_address: "Surabaya", client_address: "Surabaya", total: 75000, amount: 75000, status: "paid", date: new Date().toISOString(), created_at: new Date().toISOString(), due_date: new Date().toISOString() }
    ];
  }
  if (tableName === "documents") {
    return [
      { id: "doc-1", business_id: "demo-business-id", title: "Surat Jalan Bahan Kopi", type: "Surat Jalan", content: "Surat jalan pengiriman bahan baku biji kopi Arabica dari supplier ke warung kopi.", date: new Date().toISOString() }
    ];
  }
  if (tableName === "subscriptions") {
    return [
      { id: "sub-1", business_id: "demo-business-id", status: "active", plan: "Free", end_date: null }
    ];
  }
  return [];
};

const getMockData = (tableName: string): any[] => {
  if (typeof window === "undefined") return [];
  const key = `mock_${tableName}`;
  const dataStr = localStorage.getItem(key);
  let data = [];
  if (!dataStr) {
    data = getSeedData(tableName);
    localStorage.setItem(key, JSON.stringify(data));
  } else {
    data = JSON.parse(dataStr);
  }

  // Auto-migration fallback for products table to map legacy field names
  if (tableName === "products") {
    let modified = false;
    data = data.map((prod: any) => {
      if (prod.buy_price === undefined || prod.buy_price === null) {
        prod.buy_price = prod.cost_price !== undefined ? prod.cost_price : 0;
        modified = true;
      }
      if (prod.sell_price === undefined || prod.sell_price === null) {
        prod.sell_price = prod.price !== undefined ? prod.price : 0;
        modified = true;
      }
      return prod;
    });
    if (modified) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Auto-migration fallback for invoices table to map legacy field names
  if (tableName === "invoices") {
    let modified = false;
    data = data.map((inv: any) => {
      if (inv.customer_name === undefined) {
        inv.customer_name = inv.client_name !== undefined ? inv.client_name : "Roni Setiawan";
        modified = true;
      }
      if (inv.customer_phone === undefined) {
        inv.customer_phone = inv.client_phone !== undefined ? inv.client_phone : "08123456789";
        modified = true;
      }
      if (inv.customer_address === undefined) {
        inv.customer_address = inv.client_address !== undefined ? inv.client_address : "Surabaya";
        modified = true;
      }
      if (inv.total === undefined) {
        inv.total = inv.amount !== undefined ? inv.amount : 75000;
        modified = true;
      }
      if (inv.status === "lunas" || inv.status === undefined) {
        inv.status = "paid";
        modified = true;
      }
      return inv;
    });
    if (modified) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  return data;
};

const saveMockData = (tableName: string, data: any[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`mock_${tableName}`, JSON.stringify(data));
};

// 3. Mock Supabase Query Chainer Emulator
class MockQueryBuilder {
  private tableName: string;
  private data: any[];
  private isMaybeSingle: boolean = false;
  private isSingle: boolean = false;
  private isDelete: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.data = getMockData(tableName);
  }

  select(columns: string = "*") {
    return this;
  }

  eq(column: string, value: any) {
    if (this.isDelete) {
      const allData = getMockData(this.tableName).filter((item: any) => item[column] !== value);
      saveMockData(this.tableName, allData);
      this.data = [];
    } else {
      this.data = this.data.filter((item: any) => item[column] === value);
    }
    return this;
  }

  in(column: string, values: any[]) {
    this.data = this.data.filter((item: any) => values.includes(item[column]));
    return this;
  }

  ilike(column: string, pattern: string) {
    const regexPattern = pattern.replace(/%/g, ".*").toLowerCase();
    const regex = new RegExp(`^${regexPattern}$`);
    this.data = this.data.filter((item: any) => 
      regex.test(String(item[column] || "").toLowerCase())
    );
    return this;
  }


  order(column: string, options?: { ascending: boolean }) {
    const asc = options?.ascending ?? true;
    this.data = [...this.data].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(num: number) {
    this.data = this.data.slice(0, num);
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(rowOrRows: any) {
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    const newRows = rows.map(r => ({
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      date: new Date().toISOString(),
      ...r
    }));
    const allData = [...getMockData(this.tableName), ...newRows];
    saveMockData(this.tableName, allData);
    this.data = newRows;
    return this;
  }

  update(updates: any) {
    const allData = getMockData(this.tableName).map((item: any) => {
      // Direct mock update logic (usually we filter or match by id if query chains eq)
      return { ...item, ...updates };
    });
    saveMockData(this.tableName, allData);
    this.data = allData;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // Promise thenable implementation
  async then(resolve: any) {
    let result: any = this.data;
    if (this.isSingle) {
      result = this.data[0] || null;
    } else if (this.isMaybeSingle) {
      result = this.data[0] || null;
    }
    resolve({ data: result, error: null });
  }
}

// 4. Proxied Supabase client
const supabaseProxy = {
  auth: {
    getUser: async () => {
      if (typeof window !== "undefined" && localStorage.getItem("isDemoMode") === "true") {
        const user = JSON.parse(localStorage.getItem("demoUser") || "{}");
        return { data: { user }, error: null };
      }
      return realSupabase.auth.getUser();
    },
    signInWithPassword: async (credentials: any) => {
      return realSupabase.auth.signInWithPassword(credentials);
    },
    signUp: async (credentials: any) => {
      return realSupabase.auth.signUp(credentials);
    },
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("isDemoMode");
        localStorage.removeItem("demoUser");
        localStorage.removeItem("demoBusinessId");
      }
      return realSupabase.auth.signOut();
    },
    signInWithOAuth: async (options: any) => {
      return realSupabase.auth.signInWithOAuth(options);
    }
  },
  from: (tableName: string) => {
    if (typeof window !== "undefined" && localStorage.getItem("isDemoMode") === "true") {
      return new MockQueryBuilder(tableName);
    }
    return realSupabase.from(tableName);
  }
};

export const supabase = supabaseProxy as any;
