export type QuestionnaireLang = "en" | "fr";

export const QUESTIONNAIRE_LANGS: QuestionnaireLang[] = ["en", "fr"];

export const QUESTIONNAIRE_LANG_LABELS: Record<QuestionnaireLang, string> = {
  en: "English",
  fr: "Français",
};

interface QuestionDef {
  id: number;
  text: string;
}

const enQuestions: QuestionDef[] = [
  { id: 1, text: "Your favourite virtue." },
  { id: 2, text: "Your favourite qualities in a person." },
  { id: 3, text: "Your chief characteristic." },
  { id: 4, text: "What you appreciate the most in your friends." },
  { id: 5, text: "Your main flaw." },
  { id: 6, text: "Your favourite occupation." },
  { id: 7, text: "Your idea of happiness." },
  { id: 8, text: "Your idea of misery." },
  { id: 9, text: "If not yourself, who would you be?" },
  { id: 10, text: "Where would you like to live?" },
  { id: 11, text: "Your favourite colour." },
  { id: 12, text: "Your favourite season." },
  { id: 13, text: "Your favourite time of the day." },
  { id: 14, text: "Your favourite bird." },
  { id: 15, text: "Your favourite writers." },
  { id: 16, text: "Your favourite filmmakers." },
  { id: 17, text: "Your favourite heroes in fiction." },
  { id: 18, text: "Your favourite painters." },
  { id: 19, text: "Your favourite composers." },
  { id: 20, text: "Your favourite artist." },
  { id: 21, text: "Your heroes in real life." },
  { id: 22, text: "Your heroes in history." },
  { id: 23, text: "Your guilty pleasure." },
  { id: 24, text: "Your favourite food and drink." },
  { id: 25, text: "Your favourite names." },
  { id: 26, text: "What I hate the most." },
  { id: 27, text: "World history characters I hate the most." },
  { id: 28, text: "The historical event I admire the most." },
  { id: 29, text: "The reform I admire the most." },
  { id: 30, text: "The natural talent I'd like to be gifted with." },
  { id: 31, text: "How I wish to die." },
  { id: 32, text: "What is your present state of mind." },
  { id: 33, text: "For what fault have you most toleration?" },
  { id: 34, text: "Your favourite motto." },
];

const frQuestions: QuestionDef[] = [
  { id: 1, text: "Ma vertu préférée." },
  { id: 2, text: "Les qualités que j'estime le plus." },
  { id: 3, text: "Le principal trait de mon caractère." },
  { id: 4, text: "Ce que j'apprécie le plus chez mes amis." },
  { id: 5, text: "Mon principal défaut." },
  { id: 6, text: "Mon occupation préférée." },
  { id: 7, text: "Ma vision du bonheur." },
  { id: 8, text: "Ma vision du malheur." },
  { id: 9, text: "Sinon moi, qui je voudrais être." },
  { id: 10, text: "Le pays où je désirerais vivre." },
  { id: 11, text: "Ma couleur préférée." },
  { id: 12, text: "Ma saison préférée." },
  { id: 13, text: "Le moment que je préfère." },
  { id: 14, text: "L'oiseau que je préfère." },
  { id: 15, text: "Mes auteurs favoris." },
  { id: 16, text: "Mes cinéastes favoris." },
  { id: 17, text: "Mes héros dans la fiction." },
  { id: 18, text: "Mes peintres favoris." },
  { id: 19, text: "Mes compositeurs préférés." },
  { id: 20, text: "L'artiste que je chéris." },
  { id: 21, text: "Mes héros dans la vie réelle." },
  { id: 22, text: "Mes héros dans l'histoire." },
  { id: 23, text: "Mon péché mignon." },
  { id: 24, text: "Ma gourmandise favorite." },
  { id: 25, text: "Mes noms favoris." },
  { id: 26, text: "Ce que je déteste par-dessus tout." },
  { id: 27, text: "Les personnages historiques que je méprise le plus." },
  { id: 28, text: "Le fait historique que j'admire le plus." },
  { id: 29, text: "La réforme que j'estime le plus." },
  { id: 30, text: "Le don de la nature que je voudrais avoir." },
  { id: 31, text: "Comment j'aimerais mourir." },
  { id: 32, text: "Mon état d'esprit actuel." },
  { id: 33, text: "Les fautes qui m'inspirent le plus d'indulgence." },
  { id: 34, text: "Ma devise favorite." },
];

export const PROUST_QUESTIONS: Record<QuestionnaireLang, QuestionDef[]> = {
  en: enQuestions,
  fr: frQuestions,
};

export const TOTAL_QUESTIONS = 34;

export const getQuestions = (lang: QuestionnaireLang) => PROUST_QUESTIONS[lang] ?? PROUST_QUESTIONS["en"];

// Keep LANGUAGES for the UI "primary language" field (spoken/written language)
export const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Italian",
  "Portuguese",
  "German",
  "Dutch",
  "Greek",
  "Russian",
  "Polish",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Hindi",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Thai",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Romanian",
  "Hungarian",
  "Czech",
  "Other",
] as const;
