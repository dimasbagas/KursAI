"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { ClipboardCheck, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const susQuestions = [
  "Saya rasa saya akan sering menggunakan aplikasi KursAI.",
  "Saya merasa aplikasi KursAI terlalu rumit untuk digunakan.",
  "Saya merasa aplikasi KursAI sangat mudah digunakan.",
  "Saya rasa saya membutuhkan bantuan dari orang teknis untuk menggunakan aplikasi KursAI.",
  "Saya merasa fitur-fitur dan fungsi aplikasi KursAI terintegrasi dengan sangat baik.",
  "Saya merasa aplikasi KursAI terlalu banyak hal yang tidak konsisten.",
  "Saya rasa banyak orang akan belajar cara menggunakan aplikasi KursAI ini dengan cepat.",
  "Saya merasa aplikasi KursAI sangat membingungkan / tidak praktis digunakan.",
  "Saya merasa sangat percaya diri menggunakan aplikasi KursAI.",
  "Saya butuh mempelajari banyak hal baru sebelum saya dapat menggunakan aplikasi KursAI."
];

export default function KuesionerPage() {
  const currentUser = useAuthStore((s) => s.user);
  const businessId = useAuthStore((s) => s.businessId);

  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [comments, setComments] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSelectAnswer = (qIndex: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all 10 questions are answered
    if (Object.keys(answers).length < 10) {
      setErrorMsg("Harap jawab semua 10 pernyataan usability di bawah sebelum mengirim!");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Calculate SUS Score
      // Untuk pertanyaan ganjil (1, 3, 5, 7, 9 -> index 0, 2, 4, 6, 8): skor = nilai_jawaban - 1
      // Untuk pertanyaan genap (2, 4, 6, 8, 10 -> index 1, 3, 5, 7, 9): skor = 5 - nilai_jawaban
      // Total skor dikali 2.5
      let totalScore = 0;
      for (let i = 0; i < 10; i++) {
        const ans = answers[i];
        if (i % 2 === 0) {
          totalScore += (ans - 1);
        } else {
          totalScore += (5 - ans);
        }
      }
      const finalSusScore = totalScore * 2.5;

      const payload = {
        user_id: currentUser?.id || null,
        business_id: businessId || null,
        email_respondent: email.trim() || "anonymous@kursai.com",
        sus_answers: answers,
        sus_score: finalSusScore,
        comments: comments.trim() || null,
        created_at: new Date().toISOString()
      };

      // Insert to public.feedbacks / database if table exists, otherwise fallback to localStorage
      let dbSuccess = false;
      try {
        const { error } = await supabase.from("feedbacks").insert(payload);
        if (!error) dbSuccess = true;
      } catch (err) {
        console.warn("Table feedbacks might not exist, saving to localStorage instead.");
      }

      if (!dbSuccess) {
        const storedFeedbacks = JSON.parse(localStorage.getItem("kursai_feedbacks") || "[]");
        storedFeedbacks.push(payload);
        localStorage.setItem("kursai_feedbacks", JSON.stringify(storedFeedbacks));
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal mengirim tanggapan kuesioner. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        {/* Google Forms Theme Header */}
        <div className="bg-[#EFF6FF] border-t-8 border-primary rounded-2xl p-8 text-center space-y-4 shadow-sm border border-[var(--border)]">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h1 className="text-2xl font-bold text-[var(--foreground)] font-serif">Tanggapan Anda Telah Direkam</h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Terima kasih banyak atas waktu, kesediaan, dan partisipasi Anda dalam mengevaluasi kegunaan (*usability*) aplikasi KursAI. Masukan Anda sangat berarti bagi pengembangan kualitas sistem kami di masa mendatang.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSuccess(false);
                setAnswers({});
                setComments("");
              }}
              className="btn-secondary text-xs px-5 py-2.5 rounded-xl font-bold"
            >
              Kirim Tanggapan Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 pb-24 select-none">
      {/* Title Card (Google Form Style Header) */}
      <div className="bg-[var(--card)] border-t-[10px] border-primary rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] font-serif tracking-tight leading-snug">
            Kuesioner Evaluasi Usability & Pengalaman Pengguna (User Experience) Aplikasi KursAI
          </h1>
          
          <div className="text-xs text-muted-foreground space-y-3 leading-relaxed border-t border-[var(--border)]/30 pt-4">
            <p className="font-semibold text-[var(--foreground)]">Yth. Bapak/Ibu/Saudara(i),</p>
            <p>
              Kami sedang melakukan evaluasi *usability* dan pengalaman pengguna terhadap aplikasi pembukuan digital **KursAI** (AI Business Assistant untuk UMKM). Kuesioner ini bertujuan untuk mengukur tingkat kemudahan penggunaan aplikasi KursAI berdasarkan persepsi pengguna menggunakan metode **System Usability Scale (SUS)**.
            </p>
            <p>
              Partisipasi Anda dalam pengisian kuesioner ini sangat berarti untuk memperoleh masukan berharga yang akan digunakan sebagai dasar pengembangan dan peningkatan layanan kami. Kuesioner ini hanya memerlukan waktu sekitar **3–5 menit** untuk diselesaikan. Seluruh data yang Anda berikan akan dijamin kerahasiaannya.
            </p>
            
            <div className="bg-[var(--muted)] p-3.5 rounded-xl space-y-1.5 border border-[var(--border)]/20 mt-2">
              <p className="font-bold text-[var(--foreground)]">Petunjuk Pengisian:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>Gunakan dan pelajari aplikasi KursAI terlebih dahulu sebelum mengisi kuesioner.</li>
                <li>Bacalah setiap pernyataan usability di bawah dengan seksama.</li>
                <li>Pilih nilai skala **1 s.d. 5** yang paling sesuai dengan pengalaman pribadi Anda.</li>
                <li>Tidak ada jawaban benar atau salah. Isilah sesuai pendapat jujur Anda.</li>
              </ol>
            </div>
            
            <p className="italic pt-1">Atas kesediaan dan partisipasi Anda, kami ucapkan terima kasih.</p>
          </div>
        </div>

        {/* Email Address Panel */}
        <div className="border-t border-[var(--border)]/40 p-5 bg-[var(--muted)]/30 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-[var(--foreground)]">{email || "anonymous@kursai.com"}</span>
            <span className="block text-[10px] text-muted-foreground">Akun responden saat ini</span>
          </div>
          <span className="text-[10px] font-bold text-rose-500">* Menunjukkan pertanyaan wajib</span>
        </div>
      </div>

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Questions Panel */}
        {susQuestions.map((question, index) => {
          const isAnswered = answers[index] !== undefined;
          return (
            <div 
              key={index} 
              className={cn(
                "card bg-[var(--card)] border rounded-2xl p-5 md:p-6 space-y-4 transition-all",
                isAnswered ? "border-[var(--border)]" : "border-amber-500/30"
              )}
            >
              <div className="flex gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">{index + 1}.</span>
                <p className="text-xs font-bold text-[var(--foreground)] leading-relaxed">
                  {question} <span className="text-rose-500 font-bold">*</span>
                </p>
              </div>

              {/* Likert Scale 1-5 Selection Row */}
              <div className="pt-2">
                {/* Desktop Version: Horizontal Matrix */}
                <div className="hidden sm:flex items-center justify-between bg-[var(--muted)]/50 p-4 rounded-xl border border-[var(--border)]/20">
                  <span className="text-[10px] text-muted-foreground font-semibold w-24 text-right pr-2">Sangat Tidak Setuju</span>
                  
                  <div className="flex items-center gap-6 justify-center flex-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <label key={val} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                        <span className="text-[10px] font-bold text-[var(--foreground)]">{val}</span>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          required
                          checked={answers[index] === val}
                          onChange={() => handleSelectAnswer(index, val)}
                          className="w-4 h-4 cursor-pointer accent-primary"
                        />
                      </label>
                    ))}
                  </div>

                  <span className="text-[10px] text-muted-foreground font-semibold w-24 text-left pl-2">Sangat Setuju</span>
                </div>

                {/* Mobile Version: Vertical Stack List */}
                <div className="flex sm:hidden flex-col gap-2">
                  <div className="flex justify-between text-[9px] text-muted-foreground px-1 pb-1">
                    <span>Sangat Tidak Setuju</span>
                    <span>Sangat Setuju</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectAnswer(index, val)}
                        className={cn(
                          "py-2.5 rounded-lg border font-bold text-xs transition-all",
                          answers[index] === val
                            ? "bg-primary text-[var(--primary-foreground)] border-primary"
                            : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 11. Comments / Textarea */}
        <div className="card bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 md:p-6 space-y-3">
          <label className="block text-xs font-bold text-[var(--foreground)]">
            Apakah Anda mempunyai masukan, ide pengembangan, atau saran tambahan untuk tim pengembang KursAI? (Opsional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            placeholder="Tuliskan masukan atau saran Anda di sini..."
            className="input-field py-3.5 px-4 text-xs h-28 resize-none"
          />
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submission Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground">Harap periksa kembali sebelum mengirim.</span>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-xs px-8 py-3 bg-primary hover:bg-primary-hover text-[var(--primary-foreground)] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <ClipboardCheck size={16} />
                Kirim Jawaban
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
