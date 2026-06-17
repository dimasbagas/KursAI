"use client";

import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    icon: Sparkles,
    features: [
      "50 transaksi/bulan",
      "1 toko",
      "1 user",
      "AI terbatas",
      "Laporan dasar",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "Rp 49.000",
    period: "/bulan",
    icon: Crown,
    popular: true,
    features: [
      "Transaksi unlimited",
      "5 toko",
      "AI penuh",
      "Invoice & kwitansi",
      "Ekspor PDF",
      "Dukungan prioritas",
    ],
    current: false,
  },
  {
    name: "Business",
    price: "Rp 149.000",
    period: "/bulan",
    icon: Crown,
    features: [
      "Semua fitur Pro",
      "Multi user",
      "Manajemen tim",
      "AI unlimited",
      "API access",
      "Dedicated support",
    ],
    current: false,
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("free");

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Langganan</h1>
        <p className="text-muted mt-1">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card relative ${
              plan.popular
                ? "border-primary/50 ring-1 ring-primary/20"
                : plan.current
                ? "border-primary/30"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                POPULER
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-dark-card border border-primary/30 text-primary text-xs font-bold px-3 py-1 rounded-full">
                PAKET SAAT INI
              </div>
            )}

            <div className="text-center mb-6">
              <plan.icon size={32} className={`mx-auto mb-3 ${plan.popular ? "text-primary" : "text-muted"}`} />
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted text-sm">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                plan.current
                  ? "bg-dark-card border border-dark-border text-muted cursor-default"
                  : plan.popular
                  ? "bg-primary text-black hover:bg-primary-hover"
                  : "btn-secondary"
              }`}
              disabled={plan.current}
            >
              {plan.current ? "Paket Aktif" : `Pilih ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
