export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Business {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  timezone?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  buy_price: number;
  sell_price: number;
  min_stock: number;
  unit: string;
  description?: string;
}

export interface Transaction {
  id: string;
  product_id?: string;
  type: "penjualan" | "pengeluaran" | "pembelian" | "kasbon" | "pendapatan_lain";
  quantity: number;
  amount: number;
  note?: string;
  customer_name?: string;
  date: string;
  created_at: string;
  product_name?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  due_date?: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface DashboardStats {
  revenue_today: number;
  revenue_month: number;
  total_transactions: number;
  total_products: number;
  low_stock_count: number;
  total_debts: number;
}
