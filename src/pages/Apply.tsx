import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PROUST_QUESTIONS, LANGUAGES, TOTAL_QUESTIONS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("");
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
        setDisplayName(d.display_name ?? "");
        setLanguage(d.language ?? "");
        setLocation(d.location ?? "");
        setAnswers(d.answers ?? {});
      } catch {}
    }
  }, []);

  // Persist draft (without password)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, display_name: displayName, language, location, answers }));
  }, [email, displayName, language, location, answers]);

  // If user is already signed in & has a profile, send them home
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.status === "approved" ? "/members" : "/pending");
    }
  }, [loading, user, profile, navigate]);

  const filledCount = useMemo(
    () => PROUST_QUESTIONS.filter((q) => (answers[q.id] ?? "").trim().length > 0).length,
    [answers]
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
      toast.error(`Please answer all ${TOTAL_QUESTIONS} questions before submitting.`);
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

      const { error: profErr } = await supabase.from("profiles").insert({
        id: uid,
        display_name: displayName,
        language,
        location,
        status: "pending",
      });
      if (profErr) throw profErr;

      const rows = PROUST_QUESTIONS.map((q) => ({
        user_id: uid,
        question_id: q.id,
        answer: (answers[q.id] ?? "").trim(),
      }));
      const { error: ansErr } = await supabase.from("questionnaire_answers").insert(rows);
      if (ansErr) throw ansErr;

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Application submitted");
      navigate("/pending");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-16">
        <h1 className="font-display text-4xl md:text-5xl text-center mb-3">Apply for membership</h1>
        <p className="text-center text-muted-foreground italic mb-10">
          Please answer in your own voice. There are no right answers — only true ones.
        </p>

        <div className="sticky top-20 z-30 bg-background/90 backdrop-blur-sm border border-border rounded-md p-4 mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{filledCount} / {TOTAL_QUESTIONS} answered</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-2 italic">Your draft saves automatically.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-12">
          <section className="space-y-5">
            <h2 className="font-display text-2xl border-b border-border pb-2">Your account</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Primary language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Choose a language" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, Country" required maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="font-display text-2xl border-b border-border pb-2">The questionnaire</h2>
            {PROUST_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="font-display text-lg leading-snug">
                  <span className="text-primary mr-2">{q.id}.</span>{q.text}
                </Label>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="font-serif"
                />
              </div>
            ))}
          </section>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Apply;