import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  message: string;
  conversation_id?: string;
  business_id: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { message, conversation_id, business_id }: RequestBody = await req.json();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let convId = conversation_id;

    if (!convId) {
      // Ambil conversation terbaru atau buat baru
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, business_id, title: message.slice(0, 50) })
        .select()
        .single();

      convId = conv.id;
    }

    // Simpan pesan user
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Proses AI command
    const { reply, action } = await processAICommand(
      supabase,
      message.toLowerCase().trim(),
      business_id
    );

    // Simpan respon AI
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    // Update conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return new Response(JSON.stringify({ reply, conversation_id: convId, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processAICommand(
  supabase: any,
  msg: string,
  businessId: string
): Promise<{ reply: string; action: any }> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Penjualan
  const saleMatch = msg.match(
    /(terjual|menjual|jual)\s+(\d+)\s+(.+?)\s+(\d[\d.,]*(?:\s*(?:rb|ribu|jt|juta|k|ratus))?\s*)/i
  );
  if (saleMatch) return handleSale(supabase, saleMatch, businessId);

  // Tambah stok
  const stockMatch = msg.match(/(tambah|tambahin|nambah)\s+stok\s+(.+?)\s+(\d+)/i);
  if (stockMatch) return handleAddStock(supabase, stockMatch, businessId);

  // Pembelian
  const purchaseMatch = msg.match(/(beli|membeli|pembelian)\s+(.+?)\s+(\d+)(?:\s*(rb|ribu|jt|juta|k))?/i);
  if (purchaseMatch) return handlePurchase(supabase, purchaseMatch, businessId);

  // Kasbon
  const debtMatch = msg.match(/(kasbon|hutang|berhutang|pinjam)\s+(.+?)\s+(\d+)/i);
  if (debtMatch) return handleDebt(supabase, debtMatch, businessId);

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
    return handleReport(supabase, businessId, month, year);
  }

  return {
    reply:
      "Maaf, saya belum bisa memahami perintah tersebut. Coba gunakan format seperti:\n\n- `Terjual 10 nasi goreng 500rb`\n- `Tambah stok beras 20kg`\n- `Beli beras 25kg 350rb`\n- `Buat invoice untuk Budi`\n- `Berapa keuntungan bulan ini?`",
    action: null,
  };
}

function parseAmount(raw: string): number {
  let s = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  if (/jt|juta/.test(s)) return parseFloat(s.replace(/jt|juta/g, "")) * 1000000;
  if (/rb|ribu/.test(s)) return parseFloat(s.replace(/rb|ribu/g, "")) * 1000;
  if (/k/.test(s)) return parseFloat(s.replace(/k/g, "")) * 1000;
  return parseFloat(s) || 0;
}

async function findProduct(supabase: any, businessId: string, name: string) {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .ilike("name", `%${name}%`)
    .limit(1)
    .single();
  return data;
}

async function handleSale(supabase: any, match: RegExpMatchArray, businessId: string) {
  const qty = parseInt(match[2]);
  const productName = match[3].trim();
  const amount = parseAmount(match[4]);
  const product = await findProduct(supabase, businessId, productName);

  if (product) {
    await supabase
      .from("products")
      .update({ stock: product.stock - qty })
      .eq("id", product.id);
  }

  await supabase.from("transactions").insert({
    business_id: businessId,
    product_id: product?.id || null,
    type: "penjualan",
    quantity: qty,
    amount,
    note: `Penjualan ${qty} ${productName}`,
  });

  let reply = `✅ Transaksi penjualan tercatat:\n- Produk: ${productName}\n- Jumlah: ${qty}\n- Total: Rp ${amount.toLocaleString("id-ID")}`;
  if (product) reply += `\n- Sisa stok: ${product.stock - qty} ${product.unit}`;

  return { reply, action: { type: "sale", product: productName, quantity: qty, amount } };
}

async function handleAddStock(supabase: any, match: RegExpMatchArray, businessId: string) {
  const productName = match[2].trim();
  const qty = parseInt(match[3]);
  let product = await findProduct(supabase, businessId, productName);

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
      business_id: businessId,
      name: productName,
      stock: qty,
      sell_price: 0,
      buy_price: 0,
    });
    return {
      reply: `✅ Produk baru dibuat: **${productName}**\nStok: ${qty} unit\n\nJangan lupa atur harga jual dan harga beli di menu Produk.`,
      action: { type: "add_stock", product: productName, quantity: qty },
    };
  }
}

async function handlePurchase(supabase: any, match: RegExpMatchArray, businessId: string) {
  const productName = match[2].trim();
  const qty = parseInt(match[3]);
  const rawAmount = match[0];
  const amount = /\d/.test(rawAmount) ? parseAmount(rawAmount) : 0;
  const product = await findProduct(supabase, businessId, productName);

  if (product) {
    await supabase
      .from("products")
      .update({ stock: product.stock + qty })
      .eq("id", product.id);
  }

  await supabase.from("transactions").insert({
    business_id: businessId,
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
}

async function handleDebt(supabase: any, match: RegExpMatchArray, businessId: string) {
  const customer = match[2].trim();
  const amount = parseAmount(match[3]);

  await supabase.from("transactions").insert({
    business_id: businessId,
    type: "kasbon",
    amount,
    customer_name: customer,
    note: `Kasbon ${customer}`,
  });

  return {
    reply: `✅ Kasbon tercatat:\n- Pelanggan: ${customer}\n- Jumlah: Rp ${amount.toLocaleString("id-ID")}`,
    action: { type: "debt", customer, amount },
  };
}

async function handleReport(supabase: any, businessId: string, month: number, year: number) {
  const { data: revenue } = await supabase
    .from("transactions")
    .select("amount")
    .eq("business_id", businessId)
    .eq("type", "penjualan")
    .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("date", `${year}-${String(month).padStart(2, "0")}-31`);

  const { data: expenses } = await supabase
    .from("transactions")
    .select("amount")
    .eq("business_id", businessId)
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
}
