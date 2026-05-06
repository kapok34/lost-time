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
  questionnaire_languages: QuestionnaireLang[] | null;
}

const DEMO_PROFILES: Record<string, ProfileFull> = {
  "demo-1": {
    id: "demo-1",
    display_name: "Member One",
    avatar_url: null,
    member_number: 1,
    location: "Paris, France",
    questionnaire_language: "en",
    questionnaire_languages: ["en", "fr", "it"],
  },
  "demo-2": {
    id: "demo-2",
    display_name: "Member Two",
    avatar_url: null,
    member_number: 2,
    location: "Kyoto, Japan",
    questionnaire_language: "fr",
    questionnaire_languages: ["fr", "it"],
  },
  "demo-3": {
    id: "demo-3",
    display_name: "Member Three",
    avatar_url: null,
    member_number: 3,
    location: "Rome, Italy",
    questionnaire_language: "it",
    questionnaire_languages: ["it"],
  },
};

const DEMO_ANSWERS: Record<string, Record<string, Record<number, string>>> = {
  "demo-1": {
    en: {
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
    fr: {
      1: "L'honnêteté", 2: "La gentillesse et la curiosité", 3: "La persévérance",
      4: "Leur loyauté", 5: "L'impatience", 6: "Lire à la fenêtre",
      7: "Un matin tranquille avec du café", 8: "Les foules bruyantes",
      9: "Un jardinier en Provence", 10: "Un petit village au bord de la mer",
      11: "Bleu profond", 12: "L'automne", 13: "Le matin", 14: "La chouette",
      15: "Proust, Woolf, Borges", 16: "Kurosawa, Ozu",
      17: "Atticus Finch", 18: "Vermeer, Morandi",
      19: "Bach, Satie", 20: "Miles Davis",
      21: "Ma grand-mère", 22: "Rosa Parks",
      23: "Le chocolat noir", 24: "Le pain frais et le vin rouge",
      25: "Sylvia, Julian", 26: "L'impolitesse", 27: "Les tyrans",
      28: "L'alunissage", 29: "L'éducation universelle",
      30: "L'oreille absolue", 31: "En paix, entre amis",
      32: "Optimiste", 33: "L'égoïsme", 34: "Reste curieux",
    },
    it: {
      1: "L'onestà", 2: "La gentilezza e la curiosità", 3: "La perseveranza",
      4: "La loro lealtà", 5: "L'impazienza", 6: "Leggere alla finestra",
      7: "Una mattina tranquilla con il caffè", 8: "Le folle rumorose",
      9: "Un giardiniere in Provenza", 10: "Un piccolo villaggio sul mare",
      11: "Blu profondo", 12: "L'autunno", 13: "Il mattino", 14: "Il gufo",
      15: "Proust, Woolf, Borges", 16: "Kurosawa, Ozu",
      17: "Atticus Finch", 18: "Vermeer, Morandi",
      19: "Bach, Satie", 20: "Miles Davis",
      21: "Mia nonna", 22: "Rosa Parks",
      23: "Il cioccolato fondente", 24: "Il pane fresco e il vino rosso",
      25: "Sylvia, Julian", 26: "La maleducazione", 27: "I tiranni",
      28: "L'allunaggio", 29: "L'istruzione universale",
      30: "L'orecchio assoluto", 31: "In pace, tra amici",
      32: "Speranzoso", 33: "L'egoismo", 34: "Rimani curioso",
    },
  },
  "demo-2": {
    fr: {
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
    it: {
      1: "La gentilezza", 2: "L'empatia e l'umorismo", 3: "La fantasia",
      4: "La loro capacità di ascolto", 5: "La procrastinazione", 6: "Camminare nel bosco",
      7: "Un pasto condiviso", 8: "Il rumore costante",
      9: "Un libraio a Lisbona", 10: "Una casa con un giardino",
      11: "Il verde muschio", 12: "La primavera", 13: "Il crepuscolo",
      14: "L'usignolo", 15: "Camus, Duras", 16: "Truffaut, Varda",
      17: "Elizabeth Bennet", 18: "Cézanne, Bonnard",
      19: "Debussy, Fauré", 20: "Billie Holiday",
      21: "Il mio insegnante di pianoforte", 22: "Marie Curie",
      23: "Le madeleine", 24: "Il tè verde e i mochi",
      25: "Haru, Sora", 26: "L'indifferenza", 27: "I dittatori",
      28: "La liberazione di Parigi", 29: "La settimana di quattro giorni",
      30: "La memoria fotografica", 31: "In pace, vicino al mare",
      32: "Serena", 33: "L'arroganza", 34: "Prenditi il tuo tempo",
    },
  },
  "demo-3": {
    it: {
      1: "La pazienza", 2: "L'onestà e la calma", 3: "La riflessione",
      4: "La loro discrezione", 5: "La testardaggine", 6: "Passeggiare all'alba",
      7: "Un caffè in silenzio", 8: "Le persone che parlano troppo",
      9: "Uno scrittore a Stoccolma", 10: "Un appartamento con una libreria grande",
      11: "Il verde bosco", 12: "L'inverno", 13: "La sera",
      14: "Il pettirosso", 15: "Leopardi, Calvino, Morante",
      16: "Fellini, Sorrentino",
      17: "Don Chisciotte", 18: "Leonardo, Caravaggio",
      19: "Vivaldi, Morricone", 20: "Paolo Conte",
      21: "Mio padre", 22: "Leonardo da Vinci",
      23: "Il gelato al pistacchio", 24: "La pasta fatta in casa e il vino bianco",
      25: "Aurora, Matteo", 26: "La superficialità", 27: "Gli oppressori",
      28: "La caduta del muro di Berlino", 29: "La libertà di stampa",
      30: "La memoria perfetta", 31: "Tra le persone che amo",
      32: "Grata", 33: "La mancanza di empatia", 34: "Vivi lentamente",
    },
  },
};

const Profile = () => {
  const { id } = useParams<{ id: string }>();
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
    if (!id) return;
    (async () => {
      const [{ data: prof }, { data: ans }, { data: convs }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, member_number, location, questionnaire_language, questionnaire_languages").eq("id", id).maybeSingle(),
        supabase.from("questionnaire_answers").select("question_id, answer, lang").eq("user_id", id),
        supabase.from("conversations").select("id, member_a, member_b").eq("status", "active"),
      ]);
      setProfile((prof as ProfileFull) ?? null);
      const map: Record<string, Record<number, string>> = {};
      (ans ?? []).forEach((a: any) => {
        if (!map[a.lang]) map[a.lang] = {};
        map[a.lang][a.question_id] = a.answer;
      });
      setAnswers(map);
      const available = ((prof as ProfileFull)?.questionnaire_languages ?? []) as QuestionnaireLang[];
      if (available.length > 0) setViewLang(available[0]);

      const myActive = (convs ?? []).find((c: any) => c.member_a === user?.id || c.member_b === user?.id);
      setHasActive(!!myActive);
      if (myActive) {
        const other = myActive.member_a === user?.id ? myActive.member_b : myActive.member_a;
        setActiveWith(other);
      }

      const theirActive = (convs ?? []).find((c: any) => c.member_a === id || c.member_b === id);
      setOtherHasActive(!!theirActive);
      if (theirActive) {
        const other = theirActive.member_a === id ? theirActive.member_b : theirActive.member_a;
        setOtherActiveWith(other);
      }
    })();
  }, [id, user?.id]);

  const isMe = user?.id === id;
  const canMessage = !isMe && id !== "demo-3" && (!hasActive || activeWith === id) && (!otherHasActive || otherActiveWith === user?.id);

  const questions = useMemo(
    () => getQuestions(viewLang),
    [viewLang]
  );

  const availableLangs = useMemo(
    () => (profile?.questionnaire_languages ?? []) as QuestionnaireLang[],
    [profile?.questionnaire_languages]
  );

  // Initialise viewLang for demo profiles when profile is still loading/null
  const demo = DEMO_PROFILES[id ?? ""];
  const demoAvailableLangs = useMemo(
    () => (demo?.questionnaire_languages ?? []) as QuestionnaireLang[],
    [demo]
  );
  useEffect(() => {
    if (!profile && demoAvailableLangs.length > 0) {
      setViewLang(demoAvailableLangs[0]);
    }
  }, [profile, demoAvailableLangs]);

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


  if (!profile) {
    if (demo) {
      return (
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1 container max-w-3xl py-16">
          <div className="flex flex-col items-center text-center mb-12">
              <h1 className="font-sans-ui text-7xl font-bold mb-2">{demo.member_number}</h1>
              <p className="text-xl text-muted-foreground italic mb-4">{demo.location}</p>
              {demoAvailableLangs.length > 1 && (
                <div className="flex gap-2 mb-6">
                  {demoAvailableLangs.map((l) => (
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
                {getQuestions(viewLang).map((q) => (
                  <div key={q.id}>
                    <h3 className="font-cormorant text-xl font-bold mb-4">
                      <span className="text-foreground mr-2">{q.id}.</span>{q.text}
                    </h3>
                    <p className="font-cormorant text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {answers[viewLang]?.[q.id] ?? (DEMO_ANSWERS[demo.id]?.[viewLang]?.[q.id] ?? <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>)}
                    </p>
                  </div>
                ))}
            </div>
            {!isMe && (
              canMessage ? (
                <div className="flex justify-center mt-8">
                  <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                    {hasActive && activeWith === id ? t("conversation") : t("profile.connect")}
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
                {hasActive && activeWith === id ? t("conversation") : t("profile.beginCorrespondence")}
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
                {answers[viewLang]?.[q.id] ?? <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
              </p>
            </div>
          ))}
        </div>
        {!isMe && (
          canMessage ? (
            <div className="flex justify-center mt-8">
              <Button onClick={onMessage} disabled={starting} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">
                {hasActive && activeWith === id ? t("conversation") : t("profile.connect")}
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
