import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getQuestions, TOTAL_QUESTIONS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";

const STORAGE_KEY = "salon.apply.draft.v1";

const accountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  location: z.string().trim().min(2).max(120),
});

interface DraftAnswers { [id: number]: string }

const Apply = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t, lang } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setEmail(d.email ?? "");
        setLocation(d.location ?? "");
        setAnswers(d.answers ?? {});
      } catch {}
    }
  }, []);

  // Persist draft (without password)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, location, answers }));
  }, [email, location, answers]);

  // If user is already signed in & has a profile, send them home
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.status === "approved" ? "/members" : "/pending");
    }
  }, [loading, user, profile, navigate]);

  const questions = useMemo(() => getQuestions(lang), [lang]);

  const validCount = useMemo(
    () => questions.filter((q) => {
      const len = (answers[q.id] ?? "").trim().length;
      return len >= 3 && len <= 200;
    }).length,
    [answers, questions]
  );

  const setAnswer = (id: number, val: string) => setAnswers((a) => ({ ...a, [id]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accountSchema.safeParse({ email, password, location });
    if (!acc.success) {
      toast.error(acc.error.errors[0].message);
      return;
    }
    // Disabled button should prevent reaching here; safety guard only
    if (validCount < TOTAL_QUESTIONS) {
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (authErr) throw authErr;
      const uid = authData.user?.id;
      if (!uid) throw new Error("Could not create account");

      // If session not auto-created, sign in
      if (!authData.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
      }

      const answersJson = Object.fromEntries(
        questions.map((q) => [String(q.id), answers[q.id] ?? ""])
      );

      const { data: submitData, error: submitErr } = await supabase.rpc("submit_application", {
        _email: email,
        _password: password,
        _display_name: email.split("@")[0] || "member",
        _language: lang,
        _location: location,
        _questionnaire_language: lang,
        _answers: answersJson,
      });
      if (submitErr) throw submitErr;

      localStorage.removeItem(STORAGE_KEY);
      toast.success(t("apply.submit"));
      navigate("/pending");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-16">
        <form onSubmit={onSubmit} className="space-y-12">
          <section className="space-y-5">
            <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium border-b border-border pb-2">{t("apply.account")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="font-sans-ui">{t("login.email")}</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white border-input" />
              </div>
              <div>
                <Label htmlFor="password" className="font-sans-ui">{t("login.password")}</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white border-input" />
              </div>
            </div>
            <div>
              <Label htmlFor="location" className="font-sans-ui">{t("apply.location")}</Label>
              <Input id="location" placeholder={t("apply.locationPlaceholder")} required maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} className="bg-white border-input" />
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium border-b border-border pb-2">{t("apply.questionnaire")}</h2>
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="font-cormorant text-lg leading-snug">
                  <span className="text-foreground mr-2">{q.id}.</span>{q.text}
                </Label>
                <div className="relative">
                  <Textarea
                    rows={3}
                    minLength={3}
                    maxLength={200}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="bg-white border-input pr-12"
                  />
                  <div className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground pointer-events-none">
                    {(answers[q.id] ?? "").length}/200
                  </div>
                </div>
              </div>
            ))}
          </section>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting || validCount < TOTAL_QUESTIONS || !accountSchema.safeParse({ email, password, location }).success}
              className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-6 py-2 rounded hover:bg-[hsl(350,55%,30%)] transition-colors disabled:opacity-50"
            >
              {submitting ? t("apply.submitting") : t("apply.submit")}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;