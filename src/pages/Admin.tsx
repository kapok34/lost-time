import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
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
      const rows = getQuestions(reviewLang).map((q) => ({
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
      const isComplete = getQuestions(reviewLang).every((q) => {
        const len = (langAnswers[q.id] ?? "").trim().length;
        return len >= 3 && len <= 200;
      });
      if (isComplete && !currentLangs.includes(reviewLang)) {
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
        <h1 className="font-display text-4xl mb-8">{t("admin.title")}</h1>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">{t("admin.pendingApplications")} ({pending.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="broadcast">{t("admin.broadcast") || "Broadcast"}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-8">
            {pending.length === 0 ? (
              <p className="text-muted-foreground italic">{t("admin.noPending")}</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((p) => (
                  <li key={p.id} className="border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="text-base text-muted-foreground italic">
                        {p.location} · {p.language} · applied {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => openApplicant(p.id)}>Review</Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-8">
            <ul className="space-y-3">
              {members.map((p) => (
                <li key={p.id} className="border border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl">Member #{p.member_number}</h3>
                    <p className="text-base text-muted-foreground italic">
                      {p.location} · {p.language} · {p.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openMember(p.id)}>
                      Edit questionnaire
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => suspend(p.id, p.status === "approved")}
                    >
                      {p.status === "approved" ? "Suspend" : "Reinstate"}
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
                  <Button className="w-full" disabled={sending || !broadcastSubject.trim() || !broadcastBody.trim()}>
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

        {openId && (
          <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto">
            <div className="container max-w-3xl py-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-3xl">
                  {[...pending, ...members].find((p) => p.id === openId)?.member_number ?? "—"}
                </h2>
                <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
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
                          <Globe size={16} className="text-muted-foreground" />
                          <Select value={reviewLang} onValueChange={(val) => setReviewLang(val as QuestionnaireLang)}>
                            <SelectTrigger className="w-auto min-w-[200px]">
                              {QUESTIONNAIRE_LANG_LABELS[reviewLang]} ({reviewLang.toUpperCase()})
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTIONNAIRE_LANGS.map((l) => (
                                <SelectItem key={l} value={l}>
                                  {QUESTIONNAIRE_LANG_LABELS[l]} ({l.toUpperCase()})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : langs.length > 1 ? (
                        <div className="flex gap-2 mb-4">
                          {langs.map((l) => (
                            <button
                              key={l}
                              onClick={() => setReviewLang(l)}
                              className={`text-xs tracking-wider px-2 py-1 rounded border transition-colors ${
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
                        <div className="space-y-6">
                          {qs.map((q) => (
                            <div key={q.id}>
                              <h3 className="font-display text-lg mb-1">
                                <span className="text-primary mr-2">{q.id}.</span>{q.text}
                              </h3>
                              <Textarea
                                rows={2}
                                value={answers[currentLang]?.[q.id] ?? ""}
                                onChange={(e) => setAnswers((a) => ({
                                  ...a,
                                  [currentLang]: { ...(a[currentLang] ?? {}), [q.id]: e.target.value },
                                }))}
                                className="bg-white border-input"
                              />
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
                  <Button className="flex-1" onClick={saveMemberAnswers} disabled={savingAnswers}>
                    {savingAnswers ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
                </div>
              ) : (
                <div className="flex gap-3 sticky bottom-4 bg-background border border-border p-4">
                  <Button className="flex-1" onClick={() => approve(openId)}>{t("admin.approve")}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">{t("admin.reject")}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject application?</AlertDialogTitle>
                        <AlertDialogDescription>Optionally include a short note.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="bg-white border-input" />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => reject(openId)}>{t("admin.reject")}</AlertDialogAction>
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