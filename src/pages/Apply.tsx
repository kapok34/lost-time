import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getQuestions, LANGUAGES, TOTAL_QUESTIONS, type QuestionnaireLang, QUESTIONNAIRE_LANGS, QUESTIONNAIRE_LANG_LABELS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";

const STORAGE_KEY = "salon.apply.draft.v1";

const accountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  display_name: z.string().trim().min(1).max(60),
  language: z.string().min(1),
  location: z.string().trim().min(2).max(120),
});

interface DraftAnswers { [id: number]: string }

const Apply = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [qLang, setQLang] = useState<QuestionnaireLang>("en");
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setEmail(d.email ?? "");
        setDisplayName(d.display_name ?? "");
        setLanguage(d.language ?? "");
        setLocation(d.location ?? "");
        setQLang((d.q_lang as QuestionnaireLang) ?? "en");
        setAnswers(d.answers ?? {});
      } catch {}
    }
  }, []);

  // Persist draft (without password)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, display_name: displayName, language, location, q_lang: qLang, answers }));
  }, [email, displayName, language, location, qLang, answers]);

  // If user is already signed in & has a profile, send them home
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.status === "approved" ? "/members" : "/pending");
    }
  }, [loading, user, profile, navigate]);

  const questions = useMemo(() => getQuestions(qLang), [qLang]);

  const filledCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length,
    [answers, questions]
  );
  const progress = Math.round((filledCount / TOTAL_QUESTIONS) * 100);

  const setAnswer = (id: number, val: string) => setAnswers((a) => ({ ...a, [id]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accountSchema.safeParse({ email, password, display_name: displayName, language, location });
    if (!acc.success) {
      toast.error(acc.error.errors[0].message);
      return;
    }
    if (filledCount < TOTAL_QUESTIONS) {
      toast.error(t("apply.error.allQuestions"));
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
        _display_name: displayName,
        _language: language,
        _location: location,
        _questionnaire_language: qLang,
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
        <h1 className="font-sans-ui text-4xl md:text-5xl text-center mb-3">{t("apply.title")}</h1>
        <p className="text-center text-muted-foreground mb-10">
          {t("apply.subtitle")}
        </p>

        <div className="sticky top-20 z-30 bg-background/90 backdrop-blur-sm border border-border rounded-md p-4 mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("apply.progress")}</span>
            <span className="text-sm font-medium">{filledCount} / {TOTAL_QUESTIONS} {t("apply.answered")}</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-2">{t("apply.draft")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-12">
          <section className="space-y-5">
            <h2 className="font-sans-ui text-2xl border-b border-border pb-2">{t("apply.account")}</h2>
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
              <Label htmlFor="display_name" className="font-sans-ui">{t("apply.displayName")}</Label>
              <Input id="display_name" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-white border-input" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-sans-ui">{t("apply.primaryLanguage")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-white border-input"><SelectValue placeholder="Choose a language" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location" className="font-sans-ui">{t("apply.location")}</Label>
                <Input id="location" placeholder="City, Country" required maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} className="bg-white border-input" />
              </div>
            </div>
            <div>
              <Label className="font-sans-ui">{t("apply.questionnaireLanguage")}</Label>
              <Select value={qLang} onValueChange={(v) => setQLang(v as QuestionnaireLang)}>
                <SelectTrigger className="bg-white border-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTIONNAIRE_LANGS.map((l) => (
                    <SelectItem key={l} value={l}>{QUESTIONNAIRE_LANG_LABELS[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="font-sans-ui text-2xl border-b border-border pb-2">{t("apply.questionnaire")}</h2>
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="font-sans-ui text-lg leading-snug">
                  <span className="text-primary mr-2">{q.id}.</span>{q.text}
                </Label>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="bg-white border-input"
                />
              </div>
            ))}
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-sm font-sans-ui bg-[hsl(207,65%,47%)] text-white px-4 py-2 rounded hover:bg-[hsl(207,65%,42%)] transition-colors disabled:opacity-50"
          >
            {submitting ? t("apply.submitting") : t("apply.submit")}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Apply;