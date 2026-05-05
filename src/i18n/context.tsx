import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UILang = "en" | "fr";

interface I18nContextValue {
  lang: UILang;
  setLang: (l: UILang) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = "lost-time.lang";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLang(): UILang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as UILang | null;
    if (stored === "en" || stored === "fr") return stored;
  } catch {}
  return "en";
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<UILang>(getInitialLang);

  const setLang = (l: UILang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  const t = (key: string) => {
    const val = translations[lang][key];
    return val ?? translations["en"][key] ?? key;
  };

  // Also expose on window for non-React consumers (e.g. Sonner messages)
  useEffect(() => {
    (window as any).__I18N_LANG__ = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

export const translations: Record<UILang, Record<string, string>> = {
  en: {
    "signIn": "Sign in",
    "apply": "Apply",
    "signOut": "Sign out",
    "members": "Members",
    "messages": "Messages",
    "profile": "Profile",
    "admin": "Admin",
    "subtitle": "an asocial network",
    "manifesto.1": "A space for those who believe that knowing someone begins with knowing what they truly value.",
    "manifesto.2": "No feeds. No likes. No noise. Just answers, read slowly, and conversations that matter.",
    "manifesto.3": "Private. Curated. Human.",
    "login.title": "Welcome back",
    "login.subtitle": "Sign in to continue your correspondence.",
    "login.google": "Continue with Google",
    "login.or": "or",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.signingIn": "Signing in…",
    "login.noAccount": "Not yet a member?",
    "login.applyLink": "Apply",
    "apply.title": "Apply for membership",
    "apply.subtitle": "Please answer in your own voice. There are no right answers — only true ones.",
    "apply.progress": "Progress",
    "apply.answered": "answered",
    "apply.draft": "Your draft saves automatically.",
    "apply.account": "Your account",
    "apply.displayName": "Display name",
    "apply.primaryLanguage": "Primary language",
    "apply.location": "Location",
    "apply.questionnaire": "The questionnaire",
    "apply.questionnaireLanguage": "Questionnaire language",
    "apply.submit": "Submit application",
    "apply.submitting": "Submitting…",
    "apply.error.allQuestions": "Please answer all questions before submitting.",
    "members.title": "Members",
    "members.subtitle": "A society of curious souls.",
    "members.allLanguages": "All languages",
    "members.filterLocation": "Filter by location…",
    "members.noMatch": "No members match your filters.",
    "profile.edit": "Edit your answers",
    "profile.openConversation": "Open conversation",
    "profile.beginCorrespondence": "Begin a correspondence",
    "profile.endCurrent": "End your current conversation in Messages to write to someone new.",
    "profile.questionnaire": "The Questionnaire",
    "profile.noAnswer": "— no answer —",
    "messages.title": "Correspondence",
    "messages.active": "Active",
    "messages.noActive": "You have no active correspondence.",
    "messages.browse": "Browse members",
    "messages.past": "Past correspondences",
    "messages.ended": "ended",
    "messages.open": "Open conversation",
    "conversation.end": "End conversation",
    "conversation.endConfirm": "End this correspondence?",
    "conversation.endDesc": "The thread will be archived (still readable) and both of you will be free to begin new correspondences with other members. This cannot be undone.",
    "conversation.cancel": "Cancel",
    "conversation.ended": "This correspondence has ended",
    "conversation.noMessages": "No messages yet. Say hello.",
    "conversation.placeholder": "Write a reply…",
    "conversation.sendHint": "⌘/Ctrl + Enter to send",
    "conversation.send": "Send",
    "conversation.sending": "Sending…",
    "pending.title": "Application pending",
    "pending.subtitle": "Thank you for applying. Your answers are being reviewed.",
    "pending.status": "You will receive an email when your application is approved.",
    "settings.title": "Settings",
    "notFound.title": "Page not found",
    "notFound.back": "Back home",
    "admin.title": "Admin",
    "admin.pendingApplications": "Pending applications",
    "admin.approve": "Approve",
    "admin.reject": "Reject",
    "admin.noPending": "No pending applications.",
    "footer.copyright": "© 2026 lost time",
    "footer.privacy": "we respect your privacy",
  },
  fr: {
    "signIn": "Connexion",
    "apply": "Postuler",
    "signOut": "Déconnexion",
    "members": "Membres",
    "messages": "Messages",
    "profile": "Profil",
    "admin": "Admin",
    "subtitle": "un réseau asocial",
    "manifesto.1": "Un espace pour ceux qui pensent que connaître quelqu'un commence par connaître ce qu'il valorise vraiment.",
    "manifesto.2": "Pas de fil d'actualité. Pas de j'aime. Pas de bruit. Juste des réponses, lues lentement, et des conversations qui comptent.",
    "manifesto.3": "Privé. Curaté. Humain.",
    "login.title": "Bon retour",
    "login.subtitle": "Connectez-vous pour reprendre votre correspondance.",
    "login.google": "Continuer avec Google",
    "login.or": "ou",
    "login.email": "E-mail",
    "login.password": "Mot de passe",
    "login.submit": "Se connecter",
    "login.signingIn": "Connexion…",
    "login.noAccount": "Pas encore membre ?",
    "login.applyLink": "Postuler",
    "apply.title": "Demande d'adhésion",
    "apply.subtitle": "Répondez de votre propre voix. Il n'y a pas de bonnes réponses — seulement des vraies.",
    "apply.progress": "Progression",
    "apply.answered": "répondues",
    "apply.draft": "Votre brouillon se sauvegarde automatiquement.",
    "apply.account": "Votre compte",
    "apply.displayName": "Nom d'affichage",
    "apply.primaryLanguage": "Langue principale",
    "apply.location": "Lieu",
    "apply.questionnaire": "Le questionnaire",
    "apply.questionnaireLanguage": "Langue du questionnaire",
    "apply.submit": "Envoyer la candidature",
    "apply.submitting": "Envoi en cours…",
    "apply.error.allQuestions": "Veuillez répondre à toutes les questions avant d'envoyer.",
    "members.title": "Membres",
    "members.subtitle": "Une société d'âmes curieuses.",
    "members.allLanguages": "Toutes les langues",
    "members.filterLocation": "Filtrer par lieu…",
    "members.noMatch": "Aucun membre ne correspond à vos filtres.",
    "profile.edit": "Modifier vos réponses",
    "profile.openConversation": "Ouvrir la conversation",
    "profile.beginCorrespondence": "Commencer une correspondance",
    "profile.endCurrent": "Terminez votre conversation actuelle dans Messages pour écrire à quelqu'un d'autre.",
    "profile.questionnaire": "Le questionnaire",
    "profile.noAnswer": "— pas de réponse —",
    "messages.title": "Correspondance",
    "messages.active": "Active",
    "messages.noActive": "Vous n'avez aucune correspondance active.",
    "messages.browse": "Parcourir les membres",
    "messages.past": "Correspondances passées",
    "messages.ended": "terminée",
    "messages.open": "Ouvrir la conversation",
    "conversation.end": "Terminer la conversation",
    "conversation.endConfirm": "Terminer cette correspondance ?",
    "conversation.endDesc": "Le fil sera archivé (toujours lisible) et vous pourrez tous deux commencer de nouvelles correspondances. Cette action est irréversible.",
    "conversation.cancel": "Annuler",
    "conversation.ended": "Cette correspondance est terminée",
    "conversation.noMessages": "Pas encore de messages. Dites bonjour.",
    "conversation.placeholder": "Écrire une réponse…",
    "conversation.sendHint": "⌘/Ctrl + Entrée pour envoyer",
    "conversation.send": "Envoyer",
    "conversation.sending": "Envoi…",
    "pending.title": "Candidature en attente",
    "pending.subtitle": "Merci d'avoir postulé. Vos réponses sont en cours d'examen.",
    "pending.status": "Vous recevrez un e-mail lorsque votre candidature sera approuvée.",
    "settings.title": "Paramètres",
    "notFound.title": "Page introuvable",
    "notFound.back": "Retour à l'accueil",
    "admin.title": "Admin",
    "admin.pendingApplications": "Candidatures en attente",
    "admin.approve": "Approuver",
    "admin.reject": "Refuser",
    "admin.noPending": "Aucune candidature en attente.",
    "footer.copyright": "© 2026 lost time",
    "footer.privacy": "nous respectons votre vie privée",
  },
};
