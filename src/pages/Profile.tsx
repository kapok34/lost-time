import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getQuestions, type QuestionnaireLang, QUESTIONNAIRE_LANG_LABELS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { localizeLocation } from "@/data/countries";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { QUESTIONNAIRE_LANGS } from "@/data/questions";

interface ProfileFull {
  id: string;
  avatar_url: string | null;
  member_number: number | null;
  location: string;
  questionnaire_language: QuestionnaireLang | null;
  questionnaire_languages: QuestionnaireLang[] | null;
  notify_new_members: boolean | null;
}

interface ConvWithProfile {
  id: string;
  member_a: string;
  member_b: string;
  status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
  ended_by: string | null;
}

type MessageState =
  | { type: "active"; convId: string }
  | { type: "canStart" }
  | { type: "canRestart" }
  | { type: "blocked"; reason: "hasActiveElsewhere" | "otherHasActiveElsewhere" | "endedAuto" | "endedByOther" | "wait34Days" };

const Profile = () => {
  const { memberNumber } = useParams<{ memberNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [viewLang, setViewLang] = useState<QuestionnaireLang>("en");
  const [messageState, setMessageState] = useState<MessageState | null>(null);
  const [starting, setStarting] = useState(false);
  const [notifyNewMembers, setNotifyNewMembers] = useState<boolean>(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLang, setEditLang] = useState<QuestionnaireLang>("en");
  const [editAnswers, setEditAnswers] = useState<Record<string, Record<number, string>>>({});
  const [sendingEdit, setSendingEdit] = useState(false);

  const editQuestions = useMemo(() => getQuestions(editLang), [editLang]);

  const hasPendingEdit = useMemo(() => {
    const availableLangs = (profile?.questionnaire_languages ?? []) as QuestionnaireLang[];
    return !availableLangs.includes(editLang);
  }, [profile?.questionnaire_languages, editLang]);

  useEffect(() => {
    if (!memberNumber) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, avatar_url, member_number, location, questionnaire_language, questionnaire_languages, notify_new_members")
        .eq("member_number", Number(memberNumber))
        .maybeSingle();
      const p = (prof as ProfileFull) ?? null;
      setProfile(p);
      setNotifyNewMembers(p?.notify_new_members ?? true);
      if (!p) return;
      const [{ data: ans }, { data: convs }] = await Promise.all([
        supabase.from("questionnaire_answers").select("question_id, answer, lang").eq("user_id", p.id),
        supabase.from("conversations").select("id, member_a, member_b, status, archived_at, ended_by"),
      ]);
      const map: Record<string, Record<number, string>> = {};
      (ans ?? []).forEach((a: any) => {
        if (!map[a.lang]) map[a.lang] = {};
        map[a.lang][a.question_id] = a.answer;
      });
      setAnswers(map);
      const available = (p.questionnaire_languages ?? []) as QuestionnaireLang[];
      if (available.length > 0) setViewLang(available[0]);

      const allConvs = (convs as ConvWithProfile[]) ?? [];
      const myActive = allConvs.find((c) => c.status === "active" && (c.member_a === user?.id || c.member_b === user?.id));
      const theirActive = allConvs.find((c) => c.status === "active" && (c.member_a === p.id || c.member_b === p.id));

      if (myActive) {
        const other = myActive.member_a === user?.id ? myActive.member_b : myActive.member_a;
        if (other === p.id) {
          setMessageState({ type: "active", convId: myActive.id });
        } else {
          setMessageState({ type: "blocked", reason: "hasActiveElsewhere" });
        }
        return;
      }

      if (theirActive) {
        const other = theirActive.member_a === p.id ? theirActive.member_b : theirActive.member_a;
        if (other !== user?.id) {
          setMessageState({ type: "blocked", reason: "otherHasActiveElsewhere" });
          return;
        }
      }

      // No active conversations: check prior history
      const pairConvs = allConvs
        .filter((c) =>
          (c.member_a === user?.id && c.member_b === p.id) ||
          (c.member_a === p.id && c.member_b === user?.id)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const prev = pairConvs[0];
      if (prev && prev.status === "archived") {
        if (!prev.ended_by) {
          setMessageState({ type: "blocked", reason: "endedAuto" });
        } else if (prev.ended_by !== user?.id) {
          setMessageState({ type: "blocked", reason: "endedByOther" });
        } else if (prev.archived_at && new Date(prev.archived_at) > new Date(Date.now() - 34 * 24 * 60 * 60 * 1000)) {
          setMessageState({ type: "blocked", reason: "wait34Days" });
        } else {
          setMessageState({ type: "canRestart" });
        }
        return;
      }

      setMessageState({ type: "canStart" });
    })();
  }, [memberNumber, user?.id]);

  const isMe = user?.id === profile?.id;

  const openEditDialog = () => {
    const availableLangs = (profile?.questionnaire_languages ?? []) as QuestionnaireLang[];
    const firstAvailable = availableLangs.length > 0 ? availableLangs[0] : "en";
    // Start with existing answers if editing an existing language, empty for new language
    setEditLang(firstAvailable);
    const initialAnswers: Record<string, Record<number, string>> = {};
    availableLangs.forEach((l) => {
      initialAnswers[l] = { ...(answers[l] ?? {}) };
    });
    setEditAnswers(initialAnswers);
    setShowEditDialog(true);
  };

  const sendEditRequest = async () => {
    const currentAnswers = editAnswers[editLang] ?? {};
    const isComplete = editQuestions.every((q) => {
      const val = (currentAnswers[q.id] ?? "").trim();
      return val.length >= 3 && val.length <= 200;
    });
    if (!isComplete) {
      toast.error("Please answer all questions (3–200 characters each)");
      return;
    }

    setSendingEdit(true);
    try {
      const answersJson: Record<string, string> = {};
      editQuestions.forEach((q) => {
        answersJson[q.id] = (currentAnswers[q.id] ?? "").trim();
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        setSendingEdit(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-questionnaire-edit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lang: editLang, answers: answersJson }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.error || "Failed to submit edit");
      } else {
        toast.success("Edit request sent for admin approval");
        setShowEditDialog(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit edit");
    } finally {
      setSendingEdit(false);
    }
  };

  const questions = useMemo(
    () => getQuestions(viewLang),
    [viewLang]
  );

  const availableLangs = useMemo(
    () => (profile?.questionnaire_languages ?? []) as QuestionnaireLang[],
    [profile?.questionnaire_languages]
  );

  const onToggleNotify = async (checked: boolean) => {
    if (!profile?.id) return;
    setNotifyNewMembers(checked);
    const { error } = await supabase
      .from("profiles")
      .update({ notify_new_members: checked })
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to update preference");
      setNotifyNewMembers(!checked);
    }
  };

  const onMessage = async () => {
    if (!profile?.id) return;
    if (messageState?.type === "active") {
      navigate(`/messages/${messageState.convId}`);
      return;
    }
    setStarting(true);
    const { data, error } = await supabase.rpc("start_conversation", { _other_user: profile.id });
    setStarting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/messages/${data}`);
  };


  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-16 text-center text-muted-foreground italic">
          {t("profile.notFound")}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-16">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="font-sans-ui text-7xl font-bold mb-2">{profile.member_number ?? "—"}</h1>
          <p className="text-xl text-muted-foreground italic mb-4">{localizeLocation(profile.location, lang)}</p>
          {availableLangs.length > 1 && (
            <div className="flex gap-2 mb-6">
              {availableLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => setViewLang(l)}
                  className={`text-xs tracking-wider px-2 py-1 rounded border transition-colors ${
                    viewLang === l
                      ? "bg-[hsl(350,55%,35%)] text-white border-[hsl(350,55%,35%)]"
                      : "border-border text-muted-foreground hover:border-[hsl(350,55%,35%)] hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-10">
          {questions.map((q) => (
            <div key={q.id}>
              <h3 className="font-cormorant text-xl font-bold mb-4">
                <span className="text-foreground mr-2">{q.id}.</span>{q.text}
              </h3>
              <p className="font-cormorant text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                {answers[viewLang]?.[q.id] ?? <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
              </p>
            </div>
          ))}
        </div>
        {!isMe && messageState && (
          (messageState.type === "active" || messageState.type === "canStart" || messageState.type === "canRestart") ? (
            <div className="flex justify-center mt-8">
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {messageState.type === "active" ? t("conversation") :
                  messageState.type === "canRestart" ? t("profile.restartCorrespondence") :
                  t("profile.beginCorrespondence")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center mt-8">
              <p className="text-sm font-sans-ui text-[hsl(350,55%,35%)] mb-2">
                {messageState.reason === "hasActiveElsewhere" || messageState.reason === "otherHasActiveElsewhere"
                  ? t("profile.oneConversationHint")
                  : messageState.reason === "endedAuto"
                  ? t("profile.endedAuto")
                  : messageState.reason === "endedByOther"
                  ? t("profile.endedByOther")
                  : t("profile.wait34Days")}
              </p>
              {(messageState.reason === "hasActiveElsewhere" || messageState.reason === "otherHasActiveElsewhere") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled className="bg-[hsl(350,55%,35%)] text-white opacity-50">{t("profile.beginCorrespondence")}</Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t("profile.endCurrent")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        )}

        {isMe && (
          <div className="flex flex-col items-center gap-4 mt-16 pt-8 border-t border-border">
            <Button
              variant="outline"
              className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white"
              onClick={openEditDialog}
            >
              {t("profile.edit") || "edit your answers"}
            </Button>
            <div className="flex items-center justify-center gap-3">
              <Switch
                id="notify-new-members"
                checked={notifyNewMembers}
                onCheckedChange={onToggleNotify}
                className="data-[state=checked]:bg-[hsl(350,55%,35%)]"
              />
              <label htmlFor="notify-new-members" className="text-base font-sans-ui text-muted-foreground cursor-pointer select-none">
                {t("profile.notifyNewMembers")}
              </label>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Edit Questionnaire Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans-ui text-2xl tracking-tight">
              {t("profile.edit") || "edit your answers"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground italic">
              {t("profile.editHint")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <Select value={editLang} onValueChange={(val) => setEditLang(val as QuestionnaireLang)}>
              <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-none font-sans-ui gap-1 px-1.5">
                <Globe size={20} className="text-muted-foreground" />
                <span className="text-muted-foreground">{editLang.toUpperCase()}</span>
              </SelectTrigger>
              <SelectContent>
                {QUESTIONNAIRE_LANGS.map((l) => (
                  <SelectItem key={l} value={l} className="font-sans-ui text-sm cursor-pointer">
                    {l.toUpperCase()}
                    {(profile?.questionnaire_languages ?? []).includes(l as QuestionnaireLang) ? " ✓" : " +"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!(profile?.questionnaire_languages ?? []).includes(editLang) && (
              <span className="text-xs text-[hsl(350,55%,35%)] font-sans-ui">new language</span>
            )}
          </div>

          <div className="space-y-8 font-sans-ui">
            <div className="border-b border-border pb-2">
              <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium">{t("apply.questionnaire") || "questionnaire"}</h2>
            </div>
            {editQuestions.map((q) => {
              const currentAnswers = editAnswers[editLang] ?? {};
              return (
                <div key={q.id} className="space-y-2">
                  <Label className="font-cormorant text-xl leading-snug">
                    <span className="text-foreground mr-2">{q.id}.</span>{q.text}
                  </Label>
                  <div className="relative">
                    <Textarea
                      rows={3}
                      minLength={3}
                      maxLength={200}
                      value={currentAnswers[q.id] ?? ""}
                      onChange={(e) => setEditAnswers((a) => ({
                        ...a,
                        [editLang]: { ...(a[editLang] ?? {}), [q.id]: e.target.value },
                      }))}
                      className="bg-white border-input pr-12"
                    />
                    <div className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground pointer-events-none">
                      {(currentAnswers[q.id] ?? "").length}/200
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              className="bg-[#800000] text-white hover:bg-[hsl(350,55%,30%)]"
              onClick={sendEditRequest}
              disabled={sendingEdit}
            >
              {sendingEdit ? t("profile.sendingEdit") || "sending…" : t("profile.sendForApproval")}
            </Button>
            <Button
              variant="outline"
              className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white"
              onClick={() => setShowEditDialog(false)}
            >
              cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
