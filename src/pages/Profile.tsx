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
  display_name: string;
  avatar_url: string | null;
  member_number: number | null;
  location: string;
  questionnaire_language: QuestionnaireLang | null;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hasActive, setHasActive] = useState(false);
  const [activeWith, setActiveWith] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: prof }, { data: ans }, { data: convs }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, member_number, location, questionnaire_language").eq("id", id).maybeSingle(),
        supabase.from("questionnaire_answers").select("question_id, answer").eq("user_id", id),
        supabase.from("conversations").select("id, member_a, member_b").eq("status", "active"),
      ]);
      setProfile((prof as ProfileFull) ?? null);
      const map: Record<number, string> = {};
      (ans ?? []).forEach((a: any) => (map[a.question_id] = a.answer));
      setAnswers(map);

      const myActive = (convs ?? []).find((c: any) => c.member_a === user?.id || c.member_b === user?.id);
      setHasActive(!!myActive);
      if (myActive) {
        const other = myActive.member_a === user?.id ? myActive.member_b : myActive.member_a;
        setActiveWith(other);
      }
    })();
  }, [id, user?.id]);

  const isMe = user?.id === id;
  const canMessage = !isMe && (!hasActive || activeWith === id);

  const questions = useMemo(
    () => getQuestions(profile?.questionnaire_language ?? "en"),
    [profile?.questionnaire_language]
  );

  const onMessage = async () => {
    if (!id) return;
    if (hasActive && activeWith === id) {
      // Open existing conversation: find it
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("status", "active")
        .or(`and(member_a.eq.${user?.id},member_b.eq.${id}),and(member_a.eq.${id},member_b.eq.${user?.id})`)
        .maybeSingle();
      if (data) navigate(`/messages/${data.id}`);
      return;
    }
    setStarting(true);
    const { data, error } = await supabase.rpc("start_conversation", { _other_user: id });
    setStarting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/messages/${data}`);
  };

  const DEMO_PROFILES: Record<string, ProfileFull> = {
    "demo-1": {
      id: "demo-1",
      display_name: "Member One",
      avatar_url: null,
      member_number: 1,
      location: "Paris, France",
      questionnaire_language: "en",
    },
    "demo-2": {
      id: "demo-2",
      display_name: "Member Two",
      avatar_url: null,
      member_number: 2,
      location: "Kyoto, Japan",
      questionnaire_language: "fr",
    },
  };

  const DEMO_ANSWERS: Record<string, Record<number, string>> = {
    "demo-1": {
      1: "Honesty", 2: "Kindness and curiosity", 3: "Persistence",
      4: "Their loyalty", 5: "Impatience", 6: "Reading by the window",
      7: "A quiet morning with coffee", 8: "Loud crowds",
      9: "A gardener in Provence", 10: "A small village by the sea",
      11: "Deep blue", 12: "Autumn", 13: "Early morning", 14: "The owl",
      15: "Proust, Woolf, Borges", 16: "Kurosawa, Ozu",
      17: "Atticus Finch", 18: "Vermeer, Morandi",
      19: "Bach, Satie", 20: "Miles Davis",
      21: "My grandmother", 22: "Rosa Parks",
      23: "Dark chocolate", 24: "Fresh bread and red wine",
      25: "Sylvia, Julian", 26: "Rudeness", 27: "Tyrants",
      28: "The moon landing", 29: "Universal education",
      30: "Perfect pitch", 31: "Quietly, among friends",
      32: "Hopeful", 33: "Selfishness", 34: "Stay curious",
    },
    "demo-2": {
      1: "La gentillesse", 2: "L'empathie et l'humour", 3: "La rêverie",
      4: "Leur écoute", 5: "La procrastination", 6: "La marche en forêt",
      7: "Un repas partagé", 8: "Le bruit constant",
      9: "Un libraire à Lisbonne", 10: "Une maison avec un jardin",
      11: "Le vert mousse", 12: "Le printemps", 13: "Le crépuscule",
      14: "Le rossignol", 15: "Camus, Duras", 16: "Truffaut, Varda",
      17: "Elizabeth Bennet", 18: "Cézanne, Bonnard",
      19: "Debussy, Fauré", 20: "Billie Holiday",
      21: "Mon professeur de piano", 22: "Marie Curie",
      23: "Les madeleines", 24: "Le thé vert et les mochis",
      25: "Haru, Sora", 26: "L'indifférence", 27: "Les dictateurs",
      28: "La liberation de Paris", 29: "La semaine de quatre jours",
      30: "La mémoire photographique", 31: "En paix, près de la mer",
      32: "Sereine", 33: "L'arrogance", 34: "Prends ton temps",
    },
  };

  if (!profile) {
    const demo = DEMO_PROFILES[id ?? ""];
    if (demo) {
      return (
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1 container max-w-3xl py-16">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="font-sans-ui text-7xl font-bold mb-2">{demo.member_number}</h1>
              <p className="text-xl text-muted-foreground italic mb-6">{demo.location}</p>
            </div>
            <div className="space-y-10">
              {getQuestions(demo.questionnaire_language ?? "en").map((q) => (
                <div key={q.id}>
                  <h3 className="font-cormorant text-xl font-bold mb-4">
                    <span className="text-foreground mr-2">{q.id}.</span>{q.text}
                  </h3>
                  <p className="font-cormorant text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {DEMO_ANSWERS[demo.id]?.[q.id] ?? <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
                  </p>
                </div>
              ))}
            </div>
            {!isMe && (
              canMessage ? (
                <div className="flex justify-center mt-16">
                  <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                    {hasActive && activeWith === id ? t("profile.openConversation") : t("profile.connect")}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center mt-16">
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
        </div>
      );
    }
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
          <p className="text-xl text-muted-foreground italic mb-6">{profile.location}</p>
          {!isMe && (
            canMessage ? (
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {hasActive && activeWith === id ? t("profile.openConversation") : t("profile.beginCorrespondence")}
              </Button>
            ) : (
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
            )
          )}
          {isMe && (
            <Button asChild variant="outline"><Link to="/settings">{t("profile.edit")}</Link></Button>
          )}
        </div>

        <div className="space-y-10">
          {questions.map((q) => (
            <div key={q.id}>
              <h3 className="font-cormorant text-xl font-bold mb-4">
                <span className="text-foreground mr-2">{q.id}.</span>{q.text}
              </h3>
              <p className="font-cormorant text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                {answers[q.id] || <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
              </p>
            </div>
          ))}
        </div>
        {!isMe && (
          canMessage ? (
            <div className="flex justify-center mt-16">
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {hasActive && activeWith === id ? t("profile.openConversation") : t("profile.connect")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center mt-16">
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
