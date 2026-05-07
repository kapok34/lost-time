import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getQuestions, type QuestionnaireLang } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileFull {
  id: string;
  avatar_url: string | null;
  member_number: number | null;
  location: string;
  questionnaire_language: QuestionnaireLang | null;
  questionnaire_languages: QuestionnaireLang[] | null;
}

const Profile = () => {
  const { memberNumber } = useParams<{ memberNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [viewLang, setViewLang] = useState<QuestionnaireLang>("en");
  const [hasActive, setHasActive] = useState(false);
  const [activeWith, setActiveWith] = useState<string | null>(null);
  const [otherHasActive, setOtherHasActive] = useState(false);
  const [otherActiveWith, setOtherActiveWith] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!memberNumber) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, avatar_url, member_number, location, questionnaire_language, questionnaire_languages")
        .eq("member_number", Number(memberNumber))
        .maybeSingle();
      const p = (prof as ProfileFull) ?? null;
      setProfile(p);
      if (!p) return;
      const [{ data: ans }, { data: convs }] = await Promise.all([
        supabase.from("questionnaire_answers").select("question_id, answer, lang").eq("user_id", p.id),
        supabase.from("conversations").select("id, member_a, member_b").eq("status", "active"),
      ]);
      const map: Record<string, Record<number, string>> = {};
      (ans ?? []).forEach((a: any) => {
        if (!map[a.lang]) map[a.lang] = {};
        map[a.lang][a.question_id] = a.answer;
      });
      setAnswers(map);
      const available = (p.questionnaire_languages ?? []) as QuestionnaireLang[];
      if (available.length > 0) setViewLang(available[0]);

      const myActive = (convs ?? []).find((c: any) => c.member_a === user?.id || c.member_b === user?.id);
      setHasActive(!!myActive);
      if (myActive) {
        const other = myActive.member_a === user?.id ? myActive.member_b : myActive.member_a;
        setActiveWith(other);
      }

      const theirActive = (convs ?? []).find((c: any) => c.member_a === p.id || c.member_b === p.id);
      setOtherHasActive(!!theirActive);
      if (theirActive) {
        const other = theirActive.member_a === p.id ? theirActive.member_b : theirActive.member_a;
        setOtherActiveWith(other);
      }
    })();
  }, [memberNumber, user?.id]);

  const isMe = user?.id === profile?.id;
  const canMessage = !isMe && (!hasActive || activeWith === profile?.id) && (!otherHasActive || otherActiveWith === user?.id);

  const questions = useMemo(
    () => getQuestions(viewLang),
    [viewLang]
  );

  const availableLangs = useMemo(
    () => (profile?.questionnaire_languages ?? []) as QuestionnaireLang[],
    [profile?.questionnaire_languages]
  );


  const onMessage = async () => {
    if (!profile?.id) return;
    if (hasActive && activeWith === profile.id) {
      // Open existing conversation: find it
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("status", "active")
        .or(`and(member_a.eq.${user?.id},member_b.eq.${profile.id}),and(member_a.eq.${profile.id},member_b.eq.${user?.id})`)
        .maybeSingle();
      if (data) navigate(`/messages/${data.id}`);
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
          Loading…
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
          <p className="text-xl text-muted-foreground italic mb-4">{profile.location}</p>
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
          {!isMe && (
            canMessage ? (
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {hasActive && activeWith === profile?.id ? t("conversation") : t("profile.beginCorrespondence")}
              </Button>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-sm font-sans-ui text-[hsl(350,55%,35%)] mb-2">{t("profile.oneConversationHint")}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled className="bg-[hsl(350,55%,35%)] text-white opacity-50">{t("profile.beginCorrespondence")}</Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs" dangerouslySetInnerHTML={{
                      __html: t("profile.endCurrent").replace(/Messages/, '<Link to="/messages" class="underline">Messages</Link>')
                    }} />
                  </TooltipContent>
                </Tooltip>
              </div>
            )
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
        {!isMe && (
          canMessage ? (
            <div className="flex justify-center mt-8">
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {hasActive && activeWith === profile?.id ? t("conversation") : t("profile.connect")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center mt-8">
              <p className="text-sm font-sans-ui text-[hsl(350,55%,35%)] mb-2">{t("profile.oneConversationHint")}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button disabled className="bg-[hsl(350,55%,35%)] text-white opacity-50">{t("profile.connect")}</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs" dangerouslySetInnerHTML={{
                    __html: t("profile.endCurrent").replace(/Messages/, '<Link to="/messages" class="underline">Messages</Link>')
                  }} />
                </TooltipContent>
              </Tooltip>
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
