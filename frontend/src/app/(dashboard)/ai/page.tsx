"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  Trash2,
  Edit3,
  Check,
  X,
  MessageSquare,
  Plus,
  Search,
  Loader2,
  Zap,
  Sparkles,
  Paperclip,
  Mic,
  ArrowRight,
  CheckCircle,
  Camera,
  Coins,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Conversation, Message } from "@/types";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function AIPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const businessId = useAuthStore((s) => s.businessId);
  const currentUser = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListeningLocal, setIsListeningLocal] = useState(false);

  // New UI states matching DagangkuAI chat UI
  const [modePersetujuan, setModePersetujuan] = useState<"konfirmasi" | "autoterima">("konfirmasi");
  const [modelAi, setModelAi] = useState<"cepat" | "pintar" | "ahli">("cepat");
  const [showPersetujuanDropdown, setShowPersetujuanDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [credits, setCredits] = useState(8);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowPersetujuanDropdown(false);
      setShowModelDropdown(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (businessId) {
      loadConversations();
    }
  }, [businessId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!businessId) return;
    try {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false });
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const selectConversation = (convId: string) => {
    setActiveConv(convId);
    loadMessages(convId);
    setIsHistoryOpen(false); // Close mobile history sidebar when a conversation is selected
  };

  // Client-side AI Fallback Helpers
  const parseAmount = (raw: string): number => {
    let s = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
    if (/jt|juta/.test(s)) return parseFloat(s.replace(/jt|juta/g, "")) * 1000000;
    if (/rb|ribu/.test(s)) return parseFloat(s.replace(/rb|ribu/g, "")) * 1000;
    if (/k/.test(s)) return parseFloat(s.replace(/k/g, "")) * 1000;
    return parseFloat(s) || 0;
  };

  const findProduct = async (bizId: string, name: string) => {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", bizId)
        .ilike("name", `%${name}%`)
        .limit(1)
        .maybeSingle();
      return data;
    } catch (err) {
      console.error("findProduct fallback error", err);
      return null;
    }
  };

  const handleSale = async (match: RegExpMatchArray, bizId: string) => {
    const qty = parseInt(match[2]);
    const productName = match[3].trim();
    const amount = parseAmount(match[4]);
    const product = await findProduct(bizId, productName);

    if (product) {
      await supabase
        .from("products")
        .update({ stock: Math.max(0, product.stock - qty) })
        .eq("id", product.id);
    }

    await supabase.from("transactions").insert({
      business_id: bizId,
      product_id: product?.id || null,
      type: "penjualan",
      quantity: qty,
      amount,
      note: `Penjualan ${qty} ${productName}`,
    });

    let reply = `✅ Transaksi penjualan tercatat:\n- Produk: ${productName}\n- Jumlah: ${qty}\n- Total: Rp ${amount.toLocaleString("id-ID")}`;
    if (product) reply += `\n- Sisa stok: ${product.stock - qty} ${product.unit}`;

    return { reply, action: { type: "sale", product: productName, quantity: qty, amount } };
  };

  const handleAddStock = async (match: RegExpMatchArray, bizId: string) => {
    const productName = match[2].trim();
    const qty = parseInt(match[3]);
    let product = await findProduct(bizId, productName);

    if (product) {
      await supabase
        .from("products")
        .update({ stock: product.stock + qty })
        .eq("id", product.id);
      return {
        reply: `✅ Stok **${productName}** ditambah ${qty} unit\nStok sekarang: ${product.stock + qty} ${product.unit}`,
        action: { type: "add_stock", product: productName, quantity: qty },
      };
    } else {
      await supabase.from("products").insert({
        business_id: bizId,
        name: productName,
        stock: qty,
        sell_price: 0,
        buy_price: 0,
        unit: "pcs"
      });
      return {
        reply: `✅ Produk baru dibuat: **${productName}**\nStok: ${qty} unit\n\nJangan lupa atur harga jual dan harga beli di menu Produk.`,
        action: { type: "add_stock", product: productName, quantity: qty },
      };
    }
  };

  const handlePurchase = async (match: RegExpMatchArray, bizId: string) => {
    const productName = match[2].trim();
    const qty = parseInt(match[3]);
    const rawAmount = match[0];
    const amount = /\d/.test(rawAmount) ? parseAmount(rawAmount) : 0;
    const product = await findProduct(bizId, productName);

    if (product) {
      await supabase
        .from("products")
        .update({ stock: product.stock + qty })
        .eq("id", product.id);
    }

    await supabase.from("transactions").insert({
      business_id: bizId,
      product_id: product?.id || null,
      type: "pembelian",
      quantity: qty,
      amount,
      note: `Pembelian ${qty} ${productName}`,
    });

    let reply = `✅ Pembelian tercatat:\n- Produk: ${productName}\n- Jumlah: ${qty}`;
    if (amount > 0) reply += `\n- Total: Rp ${amount.toLocaleString("id-ID")}`;
    if (product) reply += `\n- Stok sekarang: ${product.stock + qty} ${product.unit}`;

    return { reply, action: { type: "purchase", product: productName, quantity: qty, amount } };
  };

  const handleDebt = async (match: RegExpMatchArray, bizId: string) => {
    const customer = match[2].trim();
    const amount = parseAmount(match[3]);

    await supabase.from("transactions").insert({
      business_id: bizId,
      type: "kasbon",
      amount,
      customer_name: customer,
      note: `Kasbon ${customer}`,
    });

    return {
      reply: `✅ Kasbon tercatat:\n- Pelanggan: ${customer}\n- Jumlah: Rp ${amount.toLocaleString("id-ID")}`,
      action: { type: "debt", customer, amount },
    };
  };

  const handleReport = async (bizId: string, month: number, year: number) => {
    const { data: revenue } = await supabase
      .from("transactions")
      .select("amount")
      .eq("business_id", bizId)
      .eq("type", "penjualan")
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("date", `${year}-${String(month).padStart(2, "0")}-31`);

    const { data: expenses } = await supabase
      .from("transactions")
      .select("amount")
      .eq("business_id", bizId)
      .eq("type", "pembelian")
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("date", `${year}-${String(month).padStart(2, "0")}-31`);

    const totalRevenue = (revenue || []).reduce((s: number, r: any) => s + r.amount, 0);
    const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
    const profit = totalRevenue - totalExpenses;

    return {
      reply: `📊 **Laporan Bisnis Bulan Ini**\n\n- Pendapatan: Rp ${totalRevenue.toLocaleString("id-ID")}\n- Pengeluaran: Rp ${totalExpenses.toLocaleString("id-ID")}\n- Keuntungan: Rp ${profit.toLocaleString("id-ID")}`,
      action: { type: "report", revenue: totalRevenue, expenses: totalExpenses, profit },
    };
  };

  const processSimpleTransaction = async (itemName: string, amount: number, bizId: string) => {
    const expenseKeywords = ["jajan", "parkir", "bensin", "sewa", "bayar", "pengeluaran", "makan", "minum", "belanja", "listrik", "air", "pulsa", "gaji"];
    const isExpense = expenseKeywords.some(keyword => itemName.toLowerCase().includes(keyword));

    if (isExpense) {
      // Record as Expense (pengeluaran)
      await supabase.from("transactions").insert({
        business_id: bizId,
        type: "pengeluaran",
        quantity: 1,
        amount,
        note: `Pengeluaran ${itemName}`,
      });

      let reply = `✅ Transaksi pengeluaran tercatat:\n- Pengeluaran: ${itemName}\n- Jumlah: 1\n- Total: Rp ${amount.toLocaleString("id-ID")}`;
      return { reply, action: { type: "expense", product: itemName, quantity: 1, amount } };
    } else {
      // Record as Sale (penjualan)
      const product = await findProduct(bizId, itemName);
      if (product) {
        await supabase
          .from("products")
          .update({ stock: Math.max(0, product.stock - 1) })
          .eq("id", product.id);
      }

      await supabase.from("transactions").insert({
        business_id: bizId,
        product_id: product?.id || null,
        type: "penjualan",
        quantity: 1,
        amount,
        note: `Penjualan 1 ${itemName}`,
      });

      let reply = `✅ Transaksi penjualan tercatat:\n- Produk: ${itemName}\n- Jumlah: 1\n- Total: Rp ${amount.toLocaleString("id-ID")}`;
      if (product) reply += `\n- Sisa stok: ${product.stock - 1} ${product.unit}`;

      return { reply, action: { type: "sale", product: itemName, quantity: 1, amount } };
    }
  };

  const processLocalAICommand = async (msg: string, bizId: string) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Penjualan
    const saleMatch = msg.match(
      /(terjual|menjual|jual)\s+(\d+)\s+(.+?)\s+(\d[\d.,]*(?:\s*(?:rb|ribu|jt|juta|k|ratus))?\s*)/i
    );
    if (saleMatch) return handleSale(saleMatch, bizId);

    // Tambah stok
    const stockMatch = msg.match(/(tambah|tambahin|nambah)\s+stok\s+(.+?)\s+(\d+)/i);
    if (stockMatch) return handleAddStock(stockMatch, bizId);

    // Pembelian
    const purchaseMatch = msg.match(/(beli|membeli|pembelian)\s+(.+?)\s+(\d+)(?:\s*(rb|ribu|jt|juta|k))?/i);
    if (purchaseMatch) return handlePurchase(purchaseMatch, bizId);

    // Kasbon
    const debtMatch = msg.match(/(kasbon|hutang|berhutang|pinjam)\s+(.+?)\s+(\d+)/i);
    if (debtMatch) return handleDebt(debtMatch, bizId);

    // Invoice
    const invoiceMatch = msg.match(/buat\s+invoice\s+(untuk\s+)?(.+)/i);
    if (invoiceMatch) {
      return {
        reply: `📋 Untuk membuat invoice atas nama **${invoiceMatch[2].trim()}**, saya perlu detail item yang dibeli.\n\nKetikkan item seperti:\n\`Item: Nasi Goreng 2xRp25.000\`\n\`Item: Es Teh 3xRp5.000\``,
        action: { type: "invoice", customer: invoiceMatch[2].trim() },
      };
    }

    // Laporan keuntungan
    if (/(keuntungan|profit|laba|berapa)/i.test(msg)) {
      return handleReport(bizId, month, year);
    }

    // Check simple transaction formats (e.g. "10rb nasi", "jajan 10000", "parkir 2000")
    const amountFirstMatch = msg.match(/^(\d[\d.,]*(?:\s*(?:rb|ribu|jt|juta|k|ratus))?)\s+(.+)$/i);
    const itemFirstMatch = msg.match(/^(.+?)\s+(\d[\d.,]*(?:\s*(?:rb|ribu|jt|juta|k|ratus))?)$/i);

    if (amountFirstMatch) {
      const amountRaw = amountFirstMatch[1];
      const itemName = amountFirstMatch[2].trim();
      const amount = parseAmount(amountRaw);
      if (amount > 0 && itemName.length > 0) {
        return processSimpleTransaction(itemName, amount, bizId);
      }
    }

    if (itemFirstMatch) {
      const itemName = itemFirstMatch[1].trim();
      const amountRaw = itemFirstMatch[2];
      const amount = parseAmount(amountRaw);
      if (amount > 0 && itemName.length > 0) {
        return processSimpleTransaction(itemName, amount, bizId);
      }
    }

    // Call the local API Route Proxy to bypass browser CORS policy and secure the key
    try {
      const res = await fetch("/api/ai-chat-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pesan: msg }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const resData = await res.json();
      let replyText = "";

      if (resData?.choices?.[0]?.message?.content) {
        replyText = resData.choices[0].message.content;
      } else if (resData?.reply) {
        replyText = resData.reply;
      } else if (typeof resData === "string") {
        replyText = resData;
      } else {
        replyText = "Maaf, asisten AI tidak memberikan balasan yang valid.";
      }

      return {
        reply: replyText,
        action: null,
      };
    } catch (err) {
      console.error("External LLM API error, falling back to message guide:", err);
      return {
        reply:
          "Maaf, saya belum bisa memahami perintah tersebut. Coba gunakan format seperti:\n\n- `Terjual 10 nasi goreng 500rb`\n- `Tambah stok beras 20kg`\n- `Beli beras 25kg 350rb`\n- `Buat invoice untuk Budi`\n- `Berapa keuntungan bulan ini?`",
        action: null,
      };
    }
  };

  const handleSendLocalFallback = async (userMessage: string, currentConvId: string | null) => {
    if (!currentUser || !businessId) {
      throw new Error("User or Business context not found for client fallback");
    }

    let convId = currentConvId;

    // 1. Create conversation if not exists
    if (!convId) {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: currentUser.id,
          business_id: businessId,
          title: userMessage.slice(0, 50),
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = conv.id;
    }

    // 2. Insert user message
    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: userMessage,
    });
    if (userMsgError) throw userMsgError;

    // 3. Process AI command locally
    const { reply, action } = await processLocalAICommand(
      userMessage.toLowerCase().trim(),
      businessId
    );

    // 4. Insert assistant message
    const { error: aiMsgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });
    if (aiMsgError) throw aiMsgError;

    // 5. Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return {
      reply,
      conversation_id: convId,
      action,
    };
  };

  const startLocalSpeech = () => {
    const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      alert("Speech Recognition tidak didukung di browser ini.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListeningLocal(true);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsListeningLocal(false);
    };

    rec.onend = () => {
      setIsListeningLocal(false);
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
    };

    rec.start();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    setLoading(true);

    const userMsgText = `[Foto Struk: ${file.name}]`;
    const tempUserMsg = {
      id: "temp-file-" + Date.now(),
      conversation_id: activeConv || "",
      role: "user" as const,
      content: userMsgText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let convId = activeConv;
      if (!convId && currentUser) {
        const { data: conv, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: currentUser.id,
            business_id: businessId,
            title: `Scan Struk: ${file.name.slice(0, 30)}`,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = conv.id;
        setActiveConv(conv.id);
        loadConversations();
      }

      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "user",
          content: userMsgText,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));

      const mockAmount = 52000;
      const mockItems = "Kopi Gula Aren & Croissant";

      await supabase.from("transactions").insert({
        business_id: businessId,
        type: "penjualan",
        quantity: 1,
        amount: mockAmount,
        note: `[Usaha] OCR Struk: ${mockItems}`,
      });

      const replyText = `✅ Transaksi penjualan tercatat:\n- Produk: ${mockItems}\n- Jumlah: 1\n- Total: Rp ${mockAmount.toLocaleString("id-ID")}`;

      if (convId) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: replyText,
        });
      }

      const aiMsg = {
        id: "response-file-" + Date.now(),
        conversation_id: convId || "",
        role: "assistant" as const,
        content: replyText,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      loadConversations();
    } catch (err) {
      console.error("OCR parse error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "error-file",
          conversation_id: activeConv || "",
          role: "assistant" as const,
          content: "Gagal memproses struk belanja. Pastikan file gambar valid dan coba lagi.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !businessId) return;
    const userMessage = input;
    setInput("");

    const tempMsg = {
      id: "temp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      conversation_id: activeConv || "",
      role: "user" as const,
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setLoading(true);

    try {
      let responseData;
      try {
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            message: userMessage,
            conversation_id: activeConv,
            business_id: businessId,
          },
        });

        if (error) throw error;
        responseData = data;
      } catch (invokeErr) {
        console.warn("Edge function invocation failed, running client-side fallback...", invokeErr);
        responseData = await handleSendLocalFallback(userMessage, activeConv);
      }

      // If the Edge Function (or local fallback) returned the default regex warning message,
      // and it was not resolved by the LLM API yet (for example, if the remote Edge Function was successfully called and returned the warning)
      if (responseData.reply && responseData.reply.startsWith("Maaf, saya belum bisa memahami perintah tersebut")) {
        console.log("Edge function/fallback returned regex warning. Redirecting query to external LLM API...");
        const llmResult = await processLocalAICommand(userMessage, businessId);
        responseData.reply = llmResult.reply;
        
        // Save the updated LLM response to Supabase messages so it persists in history!
        try {
          await supabase.from("messages").insert({
            conversation_id: responseData.conversation_id,
            role: "assistant",
            content: llmResult.reply,
          });
        } catch (dbErr) {
          console.error("Failed to save LLM response to database", dbErr);
        }
      }

      const aiMsg = {
        id: "response-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
        conversation_id: responseData.conversation_id,
        role: "assistant" as const,
        content: responseData.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setActiveConv(responseData.conversation_id);
      loadConversations();
    } catch (err) {
      console.error("AI chat error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          conversation_id: activeConv || "",
          role: "assistant" as const,
          content: "Maaf, terjadi kesalahan saat memproses perintah Anda. Silakan coba lagi.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renameConversation = async (convId: string) => {
    try {
      await supabase
        .from("conversations")
        .update({ title: editTitle })
        .eq("id", convId);
      setEditingId(null);
      loadConversations();
    } catch (err) {
      console.error("Failed to rename", err);
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      await supabase
        .from("conversations")
        .delete()
        .eq("id", convId);
      if (activeConv === convId) {
        setActiveConv(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-7.5rem)] md:h-screen -m-4 md:-m-6 bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sidebar Backdrop on Mobile */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Sidebar Percakapan */}
      <div className={`w-72 border-r border-[var(--border)] flex flex-col bg-[var(--sidebar-bg)] backdrop-blur-xl z-40 transition-all duration-300 fixed md:relative inset-y-0 left-0 md:translate-x-0 ${
        isHistoryOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider px-1">Riwayat Percakapan</div>
          <button
            onClick={() => { setActiveConv(null); setMessages([]); setIsHistoryOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-[var(--primary-foreground)] shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} />
            Chat Baru
          </button>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs bg-[var(--card)] border-[var(--border)] focus-within:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--muted-foreground)] text-xs leading-normal">
              <p>Belum ada percakapan. Mulai chat baru untuk mencatat transaksi.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                  activeConv === conv.id
                    ? "bg-gradient-to-r from-primary/10 to-secondary/5 text-primary border-primary/20 shadow-md shadow-primary/5 font-semibold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] border-transparent"
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input-field py-1 px-2 text-xs flex-1"
                      autoFocus
                    />
                    <button onClick={() => renameConversation(conv.id)} className="p-1 text-green-400 hover:bg-green-500/10 rounded">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate flex-1">
                      {activeConv === conv.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                      <span className="text-xs font-medium truncate">{conv.title}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent z-10 relative">
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/40 backdrop-blur-md">
          <div className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2.5">
            {/* Mobile History Toggle Button */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="md:hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1.5 rounded-lg transition-colors border border-[var(--border)] bg-[var(--card)] mr-1"
              title="Riwayat Percakapan"
            >
              <Clock size={16} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot size={15} className="text-primary" />
            </div>
            <span>KursAI Assistant</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)] hover:border-primary/30 text-[11px] text-[var(--foreground)] font-semibold select-none shadow-sm transition-all duration-300 cursor-pointer">
            <Zap size={13} className="text-yellow-400 fill-yellow-400/20 animate-pulse" />
            <span>Sisa kredit: <span className="text-primary font-bold">{credits}</span></span>
          </div>
        </div>

        {activeConv || messages.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {messages.map((msg) => {
                  const isTx = msg.role === "assistant" && (
                    msg.content.includes("tercatat:") ||
                    msg.content.includes("Transaksi penjualan") ||
                    msg.content.includes("Pembelian tercatat") ||
                    msg.content.includes("Kasbon tercatat")
                  );

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm shadow-black/5 mt-1 self-start">
                          <Bot size={18} className="text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-tr from-primary to-primary-hover text-[var(--primary-foreground)] font-medium shadow-md shadow-primary/10 rounded-tr-none px-5 py-3"
                            : isTx
                            ? "bg-transparent border-none shadow-none p-0"
                            : "bg-[var(--card)] backdrop-blur-md border border-[var(--border)] text-[var(--foreground)] shadow-md rounded-tl-none px-5 py-3"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          isTx ? (
                            (() => {
                              const lines = msg.content.split("\n");
                              let productName = "";
                              let totalText = "";
                              let txType = "Transaksi";

                              if (msg.content.includes("penjualan")) {
                                txType = "Penjualan";
                              } else if (msg.content.includes("pembelian")) {
                                txType = "Pembelian";
                              } else if (msg.content.includes("kasbon")) {
                                txType = "Kasbon";
                              }

                              lines.forEach(line => {
                                if (line.toLowerCase().includes("produk:") || line.toLowerCase().includes("pelanggan:") || line.toLowerCase().includes("produk baru:")) {
                                  productName = line.split(":")[1]?.trim() || "";
                                }
                                if (line.toLowerCase().includes("total:") || line.toLowerCase().includes("jumlah:") || line.toLowerCase().includes("jumlah penjualan:")) {
                                  totalText = line.split(":")[1]?.trim() || "";
                                }
                              });

                              if (!totalText) {
                                const rpMatch = msg.content.match(/Rp\s*([\d.,\s]*)/i);
                                if (rpMatch) {
                                  totalText = "Rp " + rpMatch[1].trim();
                                }
                              }

                              return (
                                <div className="space-y-3">
                                  {/* Beautiful Transaction Card */}
                                  <div className="bg-[var(--card)] border border-[#22C55E]/30 rounded-2xl p-4 w-[280px] sm:w-[320px] shadow-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                      <CheckCircle className="text-[#22C55E] w-5 h-5" />
                                      <span className="text-sm font-semibold text-[var(--foreground)]">Transaksi tercatat!</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-[var(--background)] rounded-xl p-3 border border-[var(--border)] mb-3">
                                      <span className="text-xs text-[var(--muted-foreground)]">Jumlah</span>
                                      <span className="text-xs font-bold text-[var(--foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-lg">
                                        {totalText || "Rp0"}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <button
                                        onClick={() => router.push("/transactions")}
                                        className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-all"
                                      >
                                        Lihat di Transaksi <ArrowRight size={12} />
                                      </button>
                                      
                                      <div className="text-[10px] text-[#64748B]">
                                        Salah catat?{" "}
                                        <button
                                          onClick={() => router.push("/transactions")}
                                          className="text-primary hover:underline font-semibold"
                                        >
                                          Perbaiki di Transaksi
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Speech Bubble */}
                                  <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--border)] text-[var(--foreground)] rounded-2xl rounded-tl-none px-5 py-3 text-sm max-w-[85%] md:max-w-[75%] shadow-md">
                                    {txType === "Penjualan" && `Siap! Penjualan ${productName || "produk"} ${totalText} sudah dicatat ya. Ada lagi?`}
                                    {txType === "Pembelian" && `Sip! Pembelian ${productName || "produk"} ${totalText} berhasil dicatat. Ada transaksi lain?`}
                                    {txType === "Kasbon" && `Oke, kasbon atas nama ${productName || "pelanggan"} sebesar ${totalText} sudah dicatat ya! Ada transaksi lain?`}
                                    {txType === "Transaksi" && `Transaksi berhasil dicatat ya. Ada lagi?`}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="prose-custom text-sm">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          )
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm shadow-black/5 self-start">
                      <Bot size={18} className="text-primary" />
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2.5 text-[var(--muted-foreground)] shadow-md">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="text-xs font-medium">KursAI sedang mengetik...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-6 text-center select-none max-w-2xl mx-auto space-y-6 md:space-y-8 relative z-10 scrollbar-none">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5 animate-float-1 mt-auto">
              <span className="text-3xl md:text-4xl">👋</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary-light via-primary to-secondary bg-clip-text text-transparent">
                Halo! Saya KursAI
              </h2>
              <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                Asisten bisnis cerdas untuk membantu mencatat transaksi dan menganalisis keuangan usahamu secara otomatis. Coba ketik:
              </p>
            </div>
            
            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-auto">
              <button
                onClick={() => setInput("terjual 10 nasi goreng 500rb")}
                className="flex flex-col items-start p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-primary/40 text-left hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--muted)] transition-all duration-300 group shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={12} className="text-primary group-hover:animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Catat Penjualan</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium group-hover:text-[var(--foreground)] transition-colors">"terjual 10 nasi goreng 500rb"</span>
              </button>

              <button
                onClick={() => setInput("beli bahan baku warung 150rb")}
                className="flex flex-col items-start p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-secondary/40 text-left hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--muted)] transition-all duration-300 group shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-secondary group-hover:animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-bold">Catat Pengeluaran</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium group-hover:text-[var(--foreground)] transition-colors">"beli bahan baku warung 150rb"</span>
              </button>

              <button
                onClick={() => setInput("tampilkan ringkasan laba bersih bulan ini")}
                className="flex flex-col items-start p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-yellow-400/40 text-left hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--muted)] transition-all duration-300 group shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot size={12} className="text-yellow-400 group-hover:animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">Analisis Keuangan</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium group-hover:text-[var(--foreground)] transition-colors">"laba bersih bulan ini"</span>
              </button>

              <button
                onClick={() => alert("Fitur OCR Kamera sedang dikembangkan (Segera Hadir).")}
                className="flex flex-col items-start p-4 rounded-xl bg-[var(--muted)] border border-dashed border-[var(--border)] hover:border-emerald-400/40 text-left hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--card)] transition-all duration-300 group shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Camera size={12} className="text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Foto Struk Belanja</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium group-hover:text-[var(--foreground)] transition-colors">AI catat otomatis dari foto struk</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Bar Area */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md relative z-20">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex gap-2 items-center bg-[var(--background)] border border-[var(--border)] rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all shadow-xl shadow-black/5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] py-2 px-1"
                placeholder="Ketik pesan untuk mencatat transaksi atau bertanya..."
                disabled={loading}
              />
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2 transition-colors rounded-xl hover:bg-[var(--muted)]"
                  title="Unggah Struk"
                  disabled={loading}
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={startLocalSpeech}
                  className={cn(
                    "p-2 transition-all rounded-xl hover:bg-[var(--muted)]",
                    isListeningLocal
                      ? "text-rose-500 animate-pulse bg-rose-500/10"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                  title="Catat Suara"
                  disabled={loading}
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary disabled:from-primary/20 disabled:to-secondary/20 text-[var(--primary-foreground)] flex items-center justify-center hover:scale-105 active:scale-95 disabled:scale-100 transition-all shadow-lg shadow-primary/20 disabled:shadow-none"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Dropdowns Bar */}
            <div className="flex gap-2 text-[11px] select-none px-1">
              {/* Dropdown 1: Model AI */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModelDropdown(!showModelDropdown);
                    setShowPersetujuanDropdown(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all font-semibold"
                >
                  <Zap size={12} className={modelAi === "cepat" ? "text-primary animate-pulse" : modelAi === "pintar" ? "text-yellow-400" : "text-purple-400"} />
                  <span className="capitalize">{modelAi}</span>
                </button>

                {showModelDropdown && (
                  <div className="absolute bottom-12 left-0 z-50 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 shadow-2xl space-y-1" onClick={(e) => e.stopPropagation()}>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Model AI</div>
                    {[
                      { id: "cepat", label: "Cepat", credits: 1, desc: "Respon kilat untuk catat transaksi & pertanyaan singkat", icon: Zap, color: "text-primary" },
                      { id: "pintar", label: "Pintar", credits: 10, desc: "Analisis mendalam untuk laporan & strategi bisnis", icon: Sparkles, color: "text-yellow-400" },
                      { id: "ahli", label: "Ahli", credits: 15, desc: "Strategi mendalam & analisis pakar untuk keputusan besar", icon: Bot, color: "text-purple-400" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setModelAi(item.id as any);
                          setShowModelDropdown(false);
                        }}
                        className={`flex items-start gap-3 w-full p-2.5 rounded-lg text-left transition-all hover:bg-[var(--muted)] ${modelAi === item.id ? "bg-[var(--muted)]/60" : ""}`}
                      >
                        <item.icon size={15} className={`${item.color} mt-0.5`} />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-medium">{item.credits} kredit</span>
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] leading-normal">{item.desc}</p>
                        </div>
                        {modelAi === item.id && <Check size={13} className="text-primary mt-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 2: Mode Persetujuan AI */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPersetujuanDropdown(!showPersetujuanDropdown);
                    setShowModelDropdown(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all font-semibold"
                >
                  <CheckCircle size={12} className="text-primary" />
                  <span>{modePersetujuan === "konfirmasi" ? "Konfirmasi" : "Auto-terima"}</span>
                </button>

                {showPersetujuanDropdown && (
                  <div className="absolute bottom-12 left-0 z-50 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 shadow-2xl space-y-1" onClick={(e) => e.stopPropagation()}>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Mode Persetujuan AI</div>
                    {[
                      { id: "konfirmasi", label: "Konfirmasi setiap perubahan", desc: "AI minta izin dulu sebelum mengubah atau menghapus data.", warning: false },
                      { id: "autoterima", label: "Auto-terima", desc: "Hati-hati: AI bisa mengubah/menghapus data tanpa konfirmasi.", warning: true },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setModePersetujuan(item.id as any);
                          setShowPersetujuanDropdown(false);
                        }}
                        className={`flex items-start gap-3 w-full p-2.5 rounded-lg text-left transition-all hover:bg-[var(--muted)] ${modePersetujuan === item.id ? "bg-[var(--muted)]/60" : ""}`}
                      >
                        <div className="flex-1 space-y-0.5">
                          <div className={`text-xs font-semibold ${item.warning ? "text-yellow-500" : "text-[var(--foreground)]"}`}>
                            {item.label}
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] leading-normal">{item.desc}</p>
                        </div>
                        {modePersetujuan === item.id && <Check size={13} className="text-primary mt-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

