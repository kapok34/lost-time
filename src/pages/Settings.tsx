import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQuestions, TOTAL_QUESTIONS, type QuestionnaireLang, QUESTIONNAIRE_LANGS, QUESTIONNAIRE_LANG_LABELS, LANGUAGES } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";
import { Globe } from "lucide-react";

type LangAnswers = Record<number, string>;
type DraftAnswers = Record<string, LangAnswers>;

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();

  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [activeLang, setActiveLang] = useState<QuestionnaireLang>("en");
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [completedLangs, setCompletedLangs] = useState<Set<QuestionnaireLang>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    setDisplayName(profile.display_name);
    setLanguage(profile.language);
    setLocation(profile.location);
    setAvatarUrl(profile.avatar_url ?? "");

    const existingLangs = (profile.questionnaire_languages ?? []) as QuestionnaireLang[];
    if (existingLangs.length > 0) setActiveLang(existingLangs[0]);

    supabase
      .from("questionnaire_answers")
      .select("question_id, answer, lang")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map: DraftAnswers = {};
        (data ?? []).forEach((a: any) => {
          if (!map[a.lang]) map[a.lang] = {};
          map[a.lang][a.question_id] = a.answer;
        });
        setAnswers(map);
      });
  }, [user, profile]);

  useEffect(() => {
    const next = new Set<QuestionnaireLang>();
    QUESTIONNAIRE_LANGS.forEach((l) => {
      const langAnswers = answers[l] ?? {};
      const qs = getQuestions(l);
      const isComplete = qs.every((q) => {
        const len = (langAnswers[q.id] ?? "").trim().length;
        return len >= 3 && len <= 200;
      });
      if (isComplete) next.add(l);
    });
    setCompletedLangs(next);
  }, [answers]);

  const questions = useMemo(() => getQuestions(activeLang), [activeLang]);

  const validCount = useMemo(() => {
    const langAnswers = answers[activeLang] ?? {};
    return questions.filter((q) => {
      const len = (langAnswers[q.id] ?? "").trim().length;
      return len >= 3 && len <= 200;
    }).length;
  }, [answers, activeLang, questions]);

  const setAnswer = (id: number, val: string) => {
    setAnswers((a) => ({
      ...a,
      [activeLang]: { ...(a[activeLang] ?? {}), [id]: val },
    }));
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName, language, location, avatar_url: avatarUrl || null })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const langAnswers = answers[activeLang] ?? {};
      const rows = questions.map((q) => ({
        user_id: user.id,
        question_id: q.id,
        answer: (langAnswers[q.id] ?? "").trim(),
        lang: activeLang,
      }));

      const { error: aErr } = await supabase
        .from("questionnaire_answers")
        .upsert(rows, { onConflict: "user_id,question_id,lang" });
      if (aErr) throw aErr;

      const isComplete = questions.every((q) => {
        const len = (langAnswers[q.id] ?? "").trim().length;
        return len >= 3 && len <= 200;
      });

      const currentLangs = (profile?.questionnaire_languages ?? []) as QuestionnaireLang[];
      if (isComplete && !currentLangs.includes(activeLang)) {
        const { error: qlErr } = await supabase
          .from("profiles")
          .update({ questionnaire_languages: [...currentLangs, activeLang] })
          .eq("id", user.id);
        if (qlErr) throw qlErr;
      }

      await refreshProfile();
      toast.success("Saved");
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-12">
        <h1 className="font-display text-4xl mb-10">{t("settings.title")}</h1>

        <section className="space-y-5 mb-12">
          <div>
            <Label>{t("apply.displayName")}</Label>
            <Input value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} className="bg-white border-input" />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input value={avatarUrl} placeholder="https://…" onChange={(e) => setAvatarUrl(e.target.value)} className="bg-white border-input" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t("apply.primaryLanguage")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("apply.location")}</Label>
              <Input value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} className="bg-white border-input" />
            </div>
          </div>
        </section>

        <div className="border-b border-border pb-2 flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{t("profile.questionnaire")}</h2>
          <Select value={activeLang} onValueChange={(val) => setActiveLang(val as QuestionnaireLang)}>
            <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-none font-sans-ui gap-1 px-1.5" aria-label="Questionnaire language">
              <Globe size={20} className="text-muted-foreground" />
              <span className="text-muted-foreground">{activeLang.toUpperCase()}</span>
            </SelectTrigger>
            <SelectContent align="end" side="bottom" sideOffset={4} position="popper" className="min-w-[160px]">
              {QUESTIONNAIRE_LANGS.map((l) => (
                <SelectItem key={l} value={l} className="font-sans-ui text-sm cursor-pointer">
                  {QUESTIONNAIRE_LANG_LABELS[l]} ({l.toUpperCase()}){completedLangs.has(l) ? " ✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground italic mb-6">
          {validCount} / {TOTAL_QUESTIONS} {t("apply.answered")}
          {completedLangs.has(activeLang) ? " — complete" : ""}
        </p>

        <div className="space-y-8 mb-10">
          {questions.map((q) => (
            <div key={q.id}>
              <Label className="font-display text-lg">
                <span className="text-primary mr-2">{q.id}.</span>{q.text}
              </Label>
              <Textarea
                rows={3}
                maxLength={2000}
                value={answers[activeLang]?.[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="bg-white border-input"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {(answers[activeLang]?.[q.id] ?? "").length} / 200
              </p>
            </div>
          ))}
        </div>

        <Button onClick={onSave} disabled={saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save"}
        </Button>
      </main>
    </div>
  );
};

export default Settings;
