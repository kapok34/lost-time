import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, PROUST_QUESTIONS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    setDisplayName(profile.display_name);
    setLanguage(profile.language);
    setLocation(profile.location);
    setAvatarUrl(profile.avatar_url ?? "");
    supabase.from("questionnaire_answers").select("question_id, answer").eq("user_id", user.id).then(({ data }) => {
      const map: Record<number, string> = {};
      (data ?? []).forEach((a: any) => (map[a.question_id] = a.answer));
      setAnswers(map);
    });
  }, [user, profile]);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName, language, location, avatar_url: avatarUrl || null })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const rows = PROUST_QUESTIONS.map((q) => ({
        user_id: user.id,
        question_id: q.id,
        answer: (answers[q.id] ?? "").trim(),
      }));
      const { error: aErr } = await supabase
        .from("questionnaire_answers")
        .upsert(rows, { onConflict: "user_id,question_id" });
      if (aErr) throw aErr;

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
        <h1 className="font-display text-4xl mb-10">Your profile</h1>

        <section className="space-y-5 mb-12">
          <div>
            <Label>Display name</Label>
            <Input value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input value={avatarUrl} placeholder="https://…" onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </section>

        <h2 className="font-display text-2xl mb-6 border-b border-border pb-2">Your answers</h2>
        <div className="space-y-8 mb-10">
          {PROUST_QUESTIONS.map((q) => (
            <div key={q.id}>
              <Label className="font-display text-lg">
                <span className="text-primary mr-2">{q.id}.</span>{q.text}
              </Label>
              <Textarea
                rows={3}
                maxLength={2000}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <Button onClick={onSave} disabled={saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </main>
    </div>
  );
};

export default Settings;