import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getQuestions, type QuestionnaireLang, QUESTIONNAIRE_LANGS, QUESTIONNAIRE_LANG_LABELS } from "@/data/questions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  member_number: number | null;
  language: string;
  location: string;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
  questionnaire_language?: QuestionnaireLang | null;
  questionnaire_languages?: QuestionnaireLang[] | null;
}

const Admin = () => {
  const { t } = useI18n();
  const [pending, setPending] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [reviewLang, setReviewLang] = useState<QuestionnaireLang>("en");
  const [reason, setReason] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, member_number, language, location, status, created_at, rejection_reason, questionnaire_languages")
      .order("created_at", { ascending: false });
    const all = (data as Profile[]) ?? [];
    setPending(all.filter((p) => p.status === "pending"));
    setMembers(all.filter((p) => p.status === "approved" || p.status === "suspended"));
  };

  useEffect(() => { load(); }, []);

  const openApplicant = async (id: string) => {
    setOpenId(id);
    setEditMode(false);
    setReviewLang("en");
    const { data } = await supabase.from("questionnaire_answers").select("question_id, answer, lang").eq("user_id", id);
    const map: Record<string, Record<number, string>> = {};
    (data ?? []).forEach((a: any) => {
      if (!map[a.lang]) map[a.lang] = {};
      map[a.lang][a.question_id] = a.answer;
    });
    setAnswers(map);
  };

  const openMember = async (id: string) => {
    setOpenId(id);
    setEditMode(true);
    setReviewLang("en");
    const { data } = await supabase.from("questionnaire_answers").select("question_id, answer, lang").eq("user_id", id);
    const map: Record<string, Record<number, string>> = {};
    (data ?? []).forEach((a: any) => {
      if (!map[a.lang]) map[a.lang] = {};
      map[a.lang][a.question_id] = a.answer;
    });
    setAnswers(map);
  };

  const saveMemberAnswers = async () => {
    if (!openId) return;
    setSavingAnswers(true);
    try {
      const langAnswers = answers[reviewLang] ?? {};
      const qs = getQuestions(reviewLang);
      const isComplete = qs.every((q) => {
        const len = (langAnswers[q.id] ?? "").trim().length;
        return len >= 3 && len <= 200;
      });
      if (!isComplete) {
        toast.error("please complete the questionnaire: each answer must be at least 3 characters");
        setSavingAnswers(false);
        return;
      }
      const rows = qs.map((q) => ({
        user_id: openId,
        question_id: q.id,
        answer: (langAnswers[q.id] ?? "").trim(),
        lang: reviewLang,
      }));
      const { error } = await supabase.from("questionnaire_answers").upsert(rows, { onConflict: "user_id,question_id,lang" });
      if (error) throw error;

      const allProfiles = [...pending, ...members];
      const profile = allProfiles.find((p) => p.id === openId);
      const currentLangs = (profile?.questionnaire_languages ?? []) as QuestionnaireLang[];
      if (!currentLangs.includes(reviewLang)) {
        await supabase.from("profiles").update({ questionnaire_languages: [...currentLangs, reviewLang] }).eq("id", openId);
        load();
      }
      toast.success("Saved");
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSavingAnswers(false);
    }
  };

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_member", { _member_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Approved");
    setOpenId(null);
    load();
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ status: "rejected", rejection_reason: reason || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected");
    setReason("");
    setOpenId(null);
    load();
  };

  const openLocationEdit = (id: string) => {
    setEditingLocationId(id);
    const p = members.find((m) => m.id === id);
    if (p) {
      const parts = p.location.split(",").map((s) => s.trim());
      if (parts.length > 1) {
        setEditCity(parts.slice(0, parts.length - 1).join(", "));
        setEditCountry(parts[parts.length - 1]);
      } else {
        setEditCity(parts[0] || "");
        setEditCountry("");
      }
    }
  };

  const saveLocation = async () => {
    if (!editingLocationId) return;
    setSavingLocation(true);
    const newLocation = `${editCity.trim()}, ${editCountry.trim()}`;
    const { error } = await supabase.from("profiles").update({ location: newLocation }).eq("id", editingLocationId);
    setSavingLocation(false);
    if (error) { toast.error(error.message); return; }
    toast.success("location updated");
    setEditingLocationId(null);
    load();
  };

  const deleteQuestionnaire = async () => {
    if (!openId) return;
    const allProfiles = [...pending, ...members];
    const profile = allProfiles.find((p) => p.id === openId);
    const currentLangs = (profile?.questionnaire_languages ?? []) as QuestionnaireLang[];
    if (currentLangs.length <= 1) {
      toast.error("cannot delete: at least one questionnaire must remain");
      return;
    }
    const { error: delErr } = await supabase.from("questionnaire_answers").delete().eq("user_id", openId).eq("lang", reviewLang);
    if (delErr) { toast.error(delErr.message); return; }
    const { error: updErr } = await supabase.from("profiles").update({ questionnaire_languages: currentLangs.filter((l) => l !== reviewLang) }).eq("id", openId);
    if (updErr) { toast.error(updErr.message); return; }
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[reviewLang];
      return next;
    });
    const remaining = currentLangs.filter((l) => l !== reviewLang);
    setReviewLang(remaining[0]);
    toast.success("questionnaire deleted");
    load();
  };

  const suspend = async (id: string, suspend: boolean) => {
    const { error } = await supabase.from("profiles").update({ status: suspend ? "suspended" : "approved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(suspend ? "Suspended" : "Reinstated");
    load();
  };

  const approvedCount = members.filter((p) => p.status === "approved").length;

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      toast.error(t("admin.broadcastEmpty") || "Please enter a subject and message.");
      return;
    }
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        setSending(false);
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: broadcastSubject.trim(),
          body: broadcastBody.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to send broadcast");
      } else {
        toast.success(`Sent ${result.sent} of ${result.total} emails`);
        setBroadcastSubject("");
        setBroadcastBody("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-5xl py-12">
        <Tabs defaultValue="pending">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending" className="font-sans-ui">{t("admin.pendingApplications")} ({pending.length})</TabsTrigger>
            <TabsTrigger value="members" className="font-sans-ui">{t("admin.members") || "Members"} ({members.length})</TabsTrigger>
            <TabsTrigger value="broadcast" className="font-sans-ui">{t("admin.broadcast") || "Broadcast"}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-8">
            {pending.length === 0 ? (
              <p className="text-muted-foreground italic">{t("admin.noPending")}</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((p) => (
                  <li key={p.id} className="border border-border p-4 flex items-center justify-between hover:border-[#800000] transition-colors cursor-pointer" onClick={() => openApplicant(p.id)}>
                    <div>
                      <p className="text-base text-muted-foreground italic">
                        {p.location} · {p.language} · applied {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={(e) => { e.stopPropagation(); openApplicant(p.id); }}>review</Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-8">
            <ul className="space-y-3">
              {members.map((p) => (
                <li key={p.id} className="border border-border p-4 flex items-center justify-between hover:border-[#800000] transition-colors">
                  <div>
                    <h3 className="font-display text-xl">Member #{p.member_number}</h3>
                    <p className="text-base text-muted-foreground italic">
                      {p.location} · {p.language} · {p.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={() => openMember(p.id)}>
                      {t("admin.editQuestionnaire") || "edit questionnaire"}
                    </Button>
                    <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={() => openLocationEdit(p.id)}>
                      {t("admin.editLocation") || "edit location"}
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white"
                      onClick={() => suspend(p.id, p.status === "approved")}
                    >
                      {p.status === "approved" ? (t("admin.suspend") || "suspend") : (t("admin.reinstate") || "reinstate")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-8 max-w-2xl">
            <div className="space-y-4">
              <p className="text-base text-muted-foreground italic">
                {(t("admin.broadcastRecipients") || "Recipients").replace("{{count}}", String(approvedCount))}
              </p>
              <div>
                <label className="block text-base mb-1">{t("admin.broadcastSubject") || "Subject"}</label>
                <Input
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Subject"
                  className="bg-white border-input"
                />
              </div>
              <div>
                <label className="block text-base mb-1">{t("admin.broadcastBody") || "Message"}</label>
                <Textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Message"
                  rows={10}
                  className="bg-white border-input"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full bg-[hsl(350,55%,35%)] text-white hover:bg-[#800000]" disabled={sending || !broadcastSubject.trim() || !broadcastBody.trim()}>
                    {sending ? (t("conversation.sending") || "sending…") : (t("admin.broadcastSend") || "Send")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin.broadcastConfirm") || "Send broadcast?"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will email {approvedCount} approved member{approvedCount === 1 ? "" : "s"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("conversation.cancel") || "cancel"}</AlertDialogCancel>
                    <AlertDialogAction onClick={sendBroadcast}>
                      {t("admin.broadcastSend") || "Send"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>

        {editingLocationId && (
          <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
            <div className="bg-background border border-border p-6 w-full max-w-md space-y-4">
              <h3 className="font-sans-ui text-xl tracking-tight text-black font-medium">edit location</h3>
              <div>
                <Label className="font-sans-ui">city</Label>
                <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="bg-white border-input" />
              </div>
              <div>
                <Label className="font-sans-ui">country</Label>
                <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="bg-white border-input" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-[#800000] text-white hover:bg-[hsl(350,55%,30%)]" onClick={saveLocation} disabled={savingLocation}>
                  {savingLocation ? "saving…" : "save"}
                </Button>
                <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={() => setEditingLocationId(null)}>
                  cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {openId && (
          <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto">
            <div className="container max-w-3xl py-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-3xl">
                  {[...pending, ...members].find((p) => p.id === openId)?.member_number ?? "—"}
                </h2>
                <Button variant="ghost" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={() => setOpenId(null)}>close</Button>
              </div>

              <div className="space-y-8 mb-12">
                {(() => {
                  const profile = [...pending, ...members].find((p) => p.id === openId);
                  const langs = (profile?.questionnaire_languages ?? [profile?.questionnaire_language ?? "en"]) as QuestionnaireLang[];
                  const currentLang = editMode ? reviewLang : (langs.includes(reviewLang) ? reviewLang : langs[0]);
                  const qs = getQuestions(currentLang);
                  return (
                    <>
                      {editMode ? (
                        <div className="flex items-center gap-2 mb-4">
                          <Select value={reviewLang} onValueChange={(val) => setReviewLang(val as QuestionnaireLang)}>
                            <SelectTrigger className="w-auto min-w-[80px] bg-transparent border-none font-sans-ui gap-1 px-1.5">
                              <Globe size={20} className="text-muted-foreground" />
                              <span className="text-muted-foreground">{reviewLang.toUpperCase()}</span>
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTIONNAIRE_LANGS.map((l) => (
                                <SelectItem key={l} value={l} className="font-sans-ui text-sm cursor-pointer">
                                  {l.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="text-xs hover:!bg-destructive hover:!text-white" disabled={langs.length <= 1}>
                                {t("admin.deleteQuestionnaire") || "delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-sans-ui">Delete questionnaire?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove all {reviewLang.toUpperCase()} answers. At least one questionnaire must remain.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white">cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={deleteQuestionnaire} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                                  {t("admin.delete") || "delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : langs.length > 1 ? (
                        <div className="flex gap-2 mb-4">
                          {langs.map((l) => (
                            <button
                              key={l}
                              onClick={() => setReviewLang(l)}
                              className={`text-xs tracking-wider px-2 py-1 rounded border transition-colors font-sans-ui ${
                                currentLang === l
                                  ? "bg-[hsl(350,55%,35%)] text-white border-[hsl(350,55%,35%)]"
                                  : "border-border text-muted-foreground hover:border-[hsl(350,55%,35%)] hover:text-foreground"
                              }`}
                            >
                              {l.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {editMode ? (
                        <div className="space-y-8 font-sans-ui">
                          <div className="border-b border-border pb-2">
                            <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium">{t("apply.questionnaire")}</h2>
                          </div>
                          {qs.map((q) => (
                            <div key={q.id} className="space-y-2">
                              <Label className="font-cormorant text-xl leading-snug">
                                <span className="text-foreground mr-2">{q.id}.</span>{q.text}
                              </Label>
                              <div className="relative">
                                <Textarea
                                  rows={3}
                                  minLength={3}
                                  maxLength={200}
                                  value={answers[currentLang]?.[q.id] ?? ""}
                                  onChange={(e) => setAnswers((a) => ({
                                    ...a,
                                    [currentLang]: { ...(a[currentLang] ?? {}), [q.id]: e.target.value },
                                  }))}
                                  className="bg-white border-input pr-12"
                                />
                                <div className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground pointer-events-none">
                                  {(answers[currentLang]?.[q.id] ?? "").length}/200
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        qs.map((q) => (
                          <div key={q.id}>
                            <h3 className="font-display text-lg mb-1">
                              <span className="text-primary mr-2">{q.id}.</span>{q.text}
                            </h3>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {answers[currentLang]?.[q.id] || <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
                            </p>
                          </div>
                        ))
                      )}
                    </>
                  );
                })()}
              </div>

              {editMode ? (
                <div className="flex gap-3 sticky bottom-4 bg-background border border-border p-4">
                  <Button className="flex-1 bg-[#800000] text-white hover:bg-[hsl(350,55%,30%)]" onClick={saveMemberAnswers} disabled={savingAnswers}>
                    {savingAnswers ? "saving…" : "save"}
                  </Button>
                  <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white" onClick={() => setOpenId(null)}>close</Button>
                </div>
              ) : (
                <div className="flex gap-3 sticky bottom-4 bg-background border border-border p-4">
                  <Button className="flex-1 bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]" onClick={() => approve(openId)}>{t("admin.approve")}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1 hover:!bg-destructive hover:!text-white">{t("admin.reject")}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>reject application?</AlertDialogTitle>
                        <AlertDialogDescription>optionally include a short note.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="bg-white border-input" />
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white">cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => reject(openId)} className="hover:!bg-destructive hover:!text-white">{t("admin.reject")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;