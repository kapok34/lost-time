import { supabase } from "@/integrations/supabase/client";

const ANSWERS_EN = [
  "Honesty","Kindness and curiosity","Persistence","Their loyalty","Impatience",
  "Reading by the window","A quiet morning with coffee","Loud crowds",
  "A gardener in Provence","A small village by the sea","Deep blue","Autumn",
  "Early morning","The owl","Proust, Woolf, Borges","Kurosawa, Ozu",
  "Atticus Finch","Vermeer, Morandi","Bach, Satie","Miles Davis",
  "My grandmother","Rosa Parks","Dark chocolate","Fresh bread and red wine",
  "Sylvia, Julian","Rudeness","Tyrants","The moon landing",
  "Universal education","Perfect pitch","Quietly, among friends","Hopeful",
  "Selfishness","Stay curious"
];

const ANSWERS_FR = [
  "La gentillesse","L'empathie et l'humour","La rêverie","Leur écoute",
  "La procrastination","La marche en forêt","Un repas partagé","Le bruit constant",
  "Un libraire à Lisbonne","Une maison avec un jardin","Le vert mousse","Le printemps",
  "Le crépuscule","Le rossignol","Camus, Duras","Truffaut, Varda",
  "Elizabeth Bennet","Cézanne, Bonnard","Debussy, Fauré","Billie Holiday",
  "Mon professeur de piano","Marie Curie","Les madeleines","Le thé vert et les mochis",
  "Haru, Sora","L'indifférence","Les dictateurs","La liberation de Paris",
  "La semaine de quatre jours","La mémoire photographique","En paix, près de la mer",
  "Sereine","L'arrogance","Prends ton temps"
];

export async function seedTestMembers(onLog: (msg: string) => void) {
  const members = [
    { email: "member1@losttime.test", password: "LostTime-2026-Paris!", location: "Paris, France", lang: "en" as const, answers: ANSWERS_EN },
    { email: "member2@losttime.test", password: "LostTime-2026-Kyoto!", location: "Kyoto, Japan", lang: "fr" as const, answers: ANSWERS_FR },
  ];

  for (const m of members) {
    onLog(`Signing up ${m.email}…`);
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: m.email,
      password: m.password,
    });
    if (authErr) {
      onLog(`Signup error: ${authErr.message}`);
      continue;
    }
    const uid = authData.user?.id;
    if (!uid) {
      onLog("No user id returned");
      continue;
    }

    onLog("Signing in…");
    await supabase.auth.signInWithPassword({ email: m.email, password: m.password });

    const answersJson = Object.fromEntries(
      m.answers.map((a, i) => [String(i + 1), a])
    );

    onLog("Submitting application…");
    const { error: rpcErr } = await supabase.rpc("submit_application", {
      _email: m.email,
      _password: m.password,
      _display_name: m.email.split("@")[0],
      _language: m.lang,
      _location: m.location,
      _questionnaire_language: m.lang,
      _answers: answersJson,
    });

    if (rpcErr) {
      onLog(`submit_application error: ${rpcErr.message}`);
    } else {
      onLog("Application submitted");
    }

    onLog("Approving…");
    const { error: approveErr } = await supabase.rpc("approve_member", { _member_id: uid });
    if (approveErr) {
      onLog(`approve_member error: ${approveErr.message}`);
    } else {
      onLog(`Approved ${m.email}`);
    }
  }
  onLog("Done.");
}
