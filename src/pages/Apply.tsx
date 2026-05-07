import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getQuestions, TOTAL_QUESTIONS, QUESTIONNAIRE_LANGS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";
import { Globe } from "lucide-react";

const STORAGE_KEY = "salon.apply.draft.v2";

const COUNTRIES: Record<string, string[]> = {
  en: [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
    "Bosnia and Herzegovina","Botswana","Brazil","Bulgaria","Burkina Faso","Burundi",
    "Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
    "Denmark","Djibouti","Dominican Republic",
    "Ecuador","Egypt","El Salvador","Estonia","Ethiopia",
    "Fiji","Finland","France",
    "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Guatemala","Guinea",
    "Haiti","Honduras","Hungary",
    "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Liberia","Libya","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
    "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
    "Oman",
    "Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
    "Qatar",
    "Romania","Russia","Rwanda",
    "Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
    "Tajikistan","Tanzania","Thailand","Togo","Tunisia","Turkey","Turkmenistan",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe",
  ],
  fr: [
    "Afghanistan","Albanie","Algérie","Andorre","Angola","Argentine","Arménie","Australie","Autriche","Azerbaïdjan",
    "Bahamas","Bahreïn","Bangladesh","Barbade","Biélorussie","Belgique","Belize","Bénin","Bhoutan","Bolivie",
    "Bosnie-Herzégovine","Botswana","Brésil","Bulgarie","Burkina Faso","Burundi",
    "Cambodge","Cameroun","Canada","Tchad","Chili","Chine","Colombie","Costa Rica","Croatie","Cuba","Chypre","République tchèque",
    "Danemark","Djibouti","République dominicaine",
    "Équateur","Égypte","Salvador","Estonie","Éthiopie",
    "Fidji","Finlande","France",
    "Gabon","Gambie","Géorgie","Allemagne","Ghana","Grèce","Guatemala","Guinée",
    "Haïti","Honduras","Hongrie",
    "Islande","Inde","Indonésie","Iran","Irak","Irlande","Israël","Italie","Côte d'Ivoire",
    "Jamaïque","Japon","Jordanie",
    "Kazakhstan","Kenya","Koweït","Kirghizistan",
    "Laos","Lettonie","Liban","Libéria","Libye","Lituanie","Luxembourg",
    "Madagascar","Malawi","Malaisie","Maldives","Mali","Malte","Mauritanie","Maurice","Mexique","Moldavie","Monaco","Mongolie","Monténégro","Maroc","Mozambique","Myanmar",
    "Namibie","Népal","Pays-Bas","Nouvelle-Zélande","Nicaragua","Niger","Nigeria","Corée du Nord","Macédoine du Nord","Norvège",
    "Oman",
    "Pakistan","Panama","Paraguay","Pérou","Philippines","Pologne","Portugal",
    "Qatar",
    "Roumanie","Russie","Rwanda",
    "Arabie saoudite","Sénégal","Serbie","Sierra Leone","Singapour","Slovaquie","Slovénie","Somalie","Afrique du Sud","Corée du Sud","Soudan du Sud","Espagne","Sri Lanka","Soudan","Suriname","Suède","Suisse","Syrie",
    "Tadjikistan","Tanzanie","Thaïlande","Togo","Tunisie","Turquie","Turkménistan",
    "Ouganda","Ukraine","Émirats arabes unis","Royaume-Uni","États-Unis","Uruguay","Ouzbékistan",
    "Venezuela","Viêt Nam",
    "Yémen",
    "Zambie","Zimbabwe",
  ],
  it: [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaigian",
    "Bahamas","Bahrein","Bangladesh","Barbados","Bielorussia","Belgio","Belize","Benin","Bhutan","Bolivia",
    "Bosnia ed Erzegovina","Botswana","Brasile","Bulgaria","Burkina Faso","Burundi",
    "Cambogia","Camerun","Canada","Ciad","Cile","Cina","Colombia","Costa Rica","Croazia","Cuba","Cipro","Repubblica Ceca",
    "Danimarca","Gibuti","Repubblica Dominicana",
    "Ecuador","Egitto","El Salvador","Estonia","Etiopia",
    "Figi","Finlandia","Francia",
    "Gabon","Gambia","Georgia","Germania","Ghana","Grecia","Guatemala","Guinea",
    "Haiti","Honduras","Ungheria",
    "Islanda","India","Indonesia","Iran","Iraq","Irlanda","Israele","Italia","Costa d'Avorio",
    "Giamaica","Giappone","Giordania",
    "Kazakistan","Kenya","Kuwait","Kirghizistan",
    "Laos","Lettonia","Libano","Liberia","Libia","Lituania","Lussemburgo",
    "Madagascar","Malawi","Malesia","Maldive","Mali","Malta","Mauritania","Mauritius","Messico","Moldavia","Monaco","Mongolia","Montenegro","Marocco","Mozambico","Myanmar",
    "Namibia","Nepal","Paesi Bassi","Nuova Zelanda","Nicaragua","Niger","Nigeria","Corea del Nord","Macedonia del Nord","Norvegia",
    "Oman",
    "Pakistan","Panama","Paraguay","Perù","Filippine","Polonia","Portogallo",
    "Qatar",
    "Romania","Russia","Ruanda",
    "Arabia Saudita","Senegal","Serbia","Sierra Leone","Singapore","Slovacchia","Slovenia","Somalia","Sudafrica","Corea del Sud","Sud Sudan","Spagna","Sri Lanka","Sudan","Suriname","Svezia","Svizzera","Siria",
    "Tagikistan","Tanzania","Thailandia","Togo","Tunisia","Turchia","Turkmenistan",
    "Uganda","Ucraina","Emirati Arabi Uniti","Regno Unito","Stati Uniti","Uruguay","Uzbekistan",
    "Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe",
  ],
};

const accountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  city: z.string().trim().min(1).max(60),
  country: z.string().trim().min(1).max(60),
});

type QuestionnaireLang = "en" | "fr" | "it" | "bg" | "hr" | "cs" | "da" | "nl" | "et" | "fi" | "de" | "el" | "hu" | "ga" | "lv" | "lt" | "mt" | "pl" | "pt" | "ro" | "sk" | "sl" | "es" | "sv";
interface LangAnswers { [id: number]: string }
interface DraftAnswers { [lang: string]: LangAnswers }

const Apply = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t, lang } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const UI_DEFAULT_LANG: Record<"en" | "fr" | "it", QuestionnaireLang> = {
    en: "en",
    fr: "fr",
    it: "it",
  };

  const [activeLang, setActiveLang] = useState<QuestionnaireLang>(
    UI_DEFAULT_LANG[lang as "en" | "fr" | "it"] ?? "en"
  );
  const [completedLangs, setCompletedLangs] = useState<Set<QuestionnaireLang>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const location = city && country ? `${city}, ${country}` : city || country || "";

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setEmail(d.email ?? "");
        setCity(d.city ?? "");
        setCountry(d.country ?? "");
        const loadedAnswers = d.answers ?? {};
        // Migrate from old single-language format if needed
        if (loadedAnswers["1"] !== undefined || loadedAnswers[1] !== undefined) {
          setAnswers({ [d.activeLang ?? "en"]: loadedAnswers });
        } else {
          setAnswers(loadedAnswers);
          if (d.completedLangs) setCompletedLangs(new Set(d.completedLangs));
        }
      } catch {}
    }
  }, []);

  // Persist draft (without password)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      email, city, country, answers, activeLang, completedLangs: Array.from(completedLangs)
    }));
  }, [email, city, country, answers, activeLang, completedLangs]);

  // If user is already signed in & has a profile, send them home
  useEffect(() => {
    if (submitted) return;
    if (!loading && user && profile) {
      navigate(profile.status === "approved" ? "/members" : "/pending");
    }
  }, [loading, user, profile, submitted, navigate]);

  const questions = useMemo(() => getQuestions(activeLang), [activeLang]);

  const validCount = useMemo(
    () => questions.filter((q) => {
      const langAnswers = answers[activeLang] ?? {};
      const len = (langAnswers[q.id] ?? "").trim().length;
      return len >= 3 && len <= 200;
    }).length,
    [answers, activeLang, questions]
  );

  const isLangComplete = (lang: QuestionnaireLang) => {
    const qs = getQuestions(lang);
    const langAnswers = answers[lang] ?? {};
    return qs.every((q) => {
      const len = (langAnswers[q.id] ?? "").trim().length;
      return len >= 3 && len <= 200;
    });
  };

  useEffect(() => {
    const next = new Set<QuestionnaireLang>();
    QUESTIONNAIRE_LANGS.forEach((l) => { if (isLangComplete(l as QuestionnaireLang)) next.add(l as QuestionnaireLang); });
    setCompletedLangs(next);
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = (id: number, val: string) => setAnswers((a) => ({
    ...a,
    [activeLang]: { ...(a[activeLang] ?? {}), [id]: val },
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accountSchema.safeParse({ email, password, city, country });
    if (!acc.success) {
      toast.error(acc.error.errors[0].message);
      return;
    }
    // At least one language must be fully answered
    if (completedLangs.size === 0) {
      return;
    }

    setSubmitting(true);
    try {
      let authData = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      // If user already exists, sign in instead and continue
      if (authData.error && authData.error.message.toLowerCase().includes('already registered')) {
        const signInData = await supabase.auth.signInWithPassword({ email, password });
        if (signInData.error) throw signInData.error;
        authData = { data: { user: signInData.data.user, session: signInData.data.session }, error: null };
      } else if (authData.error) {
        throw authData.error;
      }
      const uid = authData.data.user?.id;
      if (!uid) throw new Error("Could not create account");

      // If session not auto-created, sign in
      if (!authData.data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
      }

      // Build answers keyed by language
      const answersJson: Record<string, Record<string, string>> = {};
      (Array.from(completedLangs) as QuestionnaireLang[]).forEach((l) => {
        const qs = getQuestions(l);
        answersJson[l] = Object.fromEntries(
          qs.map((q) => [String(q.id), (answers[l]?.[q.id] ?? "").trim()])
        );
      });

      const { data: submitData, error: submitErr } = await supabase.rpc("submit_application", {
        _email: email,
        _password: password,
        _display_name: null,
        _language: lang,
        _location: location,
        _questionnaire_languages: Array.from(completedLangs),
        _answers: answersJson,
      });
      if (submitErr) throw submitErr;

      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
      toast.success(t("apply.submitted"));
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans-ui">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl flex flex-col justify-center py-16 text-center">
          <h1 className="font-sans-ui text-3xl tracking-tight text-black font-medium mb-6">
            {t("pending.title")}
          </h1>
          <p className="text-muted-foreground italic text-lg leading-relaxed mb-4">
            {t("pending.subtitle")}
          </p>
          <p className="text-muted-foreground italic">
            {t("pending.status")}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-16">
        <form onSubmit={onSubmit} className="space-y-12">
          <section className="space-y-5">
            <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium border-b border-border pb-2">{t("apply.account")}</h2>
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country" className="font-sans-ui">{t("apply.country")}</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full bg-white border-input font-sans-ui">
                    <SelectValue placeholder={t("apply.country")} />
                  </SelectTrigger>
              <SelectContent>
                    {COUNTRIES[lang].map((c) => (
                      <SelectItem key={c} value={c} className="font-sans-ui">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city" className="font-sans-ui">{t("apply.city")}</Label>
                <Input id="city" placeholder={t("apply.city")} required maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} className="bg-white border-input" />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h2 className="font-sans-ui text-2xl tracking-tight text-black font-medium">{t("apply.questionnaire")}</h2>
              <Select value={activeLang} onValueChange={(val) => setActiveLang(val as QuestionnaireLang)}>
                <SelectTrigger className="w-auto min-w-[80px] bg-transparent border-none font-sans-ui gap-1 px-1.5" aria-label="Questionnaire language">
                  <Globe size={20} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{activeLang.toUpperCase()}</span>
                </SelectTrigger>
                <SelectContent align="end" side="bottom" sideOffset={4} position="popper" className="min-w-[80px]">
                  {QUESTIONNAIRE_LANGS.map((l) => (
                    <SelectItem key={l} value={l} className="font-sans-ui text-sm cursor-pointer">
                      {l.toUpperCase()}{completedLangs.has(l) ? ' ✓' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground italic">
              {completedLangs.size === 0
                ? t("apply.questionnairePrompt.zero")
                : completedLangs.size === 1
                ? (() => {
                    const completed = Array.from(completedLangs)[0];
                    const others = QUESTIONNAIRE_LANGS
                      .filter((l) => l !== completed)
                      .map((l) => l.toUpperCase())
                      .join(" / ");
                    return t("apply.questionnairePrompt.one")
                      .replace("{lang}", completed.toUpperCase())
                      .replace("{other}", others);
                  })()
                : `Completed in ${Array.from(completedLangs).map((l) => l.toUpperCase()).join(", ")}.`}
            </p>
            {questions.map((q) => {
              const langAnswers = answers[activeLang] ?? {};
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
                      value={langAnswers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="bg-white border-input pr-12"
                    />
                    <div className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground pointer-events-none">
                      {(langAnswers[q.id] ?? "").length}/200
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting || completedLangs.size === 0 || !accountSchema.safeParse({ email, password, city, country }).success}
              className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-6 py-2 rounded hover:bg-[hsl(350,55%,30%)] transition-colors disabled:opacity-50"
            >
              {submitting ? t("apply.submitting") : t("apply.submit")}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;