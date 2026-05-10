export const COUNTRIES: Record<string, string[]> = {
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

// Build reverse lookup maps: localized name → English name
const buildReverseMap = () => {
  const frToEn: Record<string, string> = {};
  const itToEn: Record<string, string> = {};

  for (let i = 0; i < COUNTRIES.en.length; i++) {
    const en = COUNTRIES.en[i];
    const fr = COUNTRIES.fr[i];
    const it = COUNTRIES.it[i];
    if (fr && fr !== en) frToEn[fr] = en;
    if (it && it !== en) itToEn[it] = en;
  }

  return { frToEn, itToEn };
};

const { frToEn, itToEn } = buildReverseMap();

/** Convert any localized country name back to its English canonical form. */
export function toEnglishCountry(name: string): string {
  if (!name) return name;
  // Already English (case-insensitive check against known English names)
  if (COUNTRIES.en.some((c) => c.toLowerCase() === name.toLowerCase())) {
    return COUNTRIES.en.find((c) => c.toLowerCase() === name.toLowerCase())!;
  }
  // French
  const frMatch = Object.keys(frToEn).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (frMatch) return frToEn[frMatch];
  // Italian
  const itMatch = Object.keys(itToEn).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (itMatch) return itToEn[itMatch];
  return name;
}

/** Get the display name for an English country in the given UI language. */
export function getCountryDisplay(englishName: string, uiLang: string): string {
  const idx = COUNTRIES.en.findIndex(
    (c) => c.toLowerCase() === englishName.toLowerCase()
  );
  if (idx === -1) return englishName;
  return COUNTRIES[uiLang]?.[idx] ?? COUNTRIES.en[idx];
}

/** Parse a "City, Country" location and return { city, countryEn }. */
export function parseLocation(location: string): { city: string; countryEn: string } {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length > 1) {
    const countryPart = parts[parts.length - 1];
    const city = parts.slice(0, parts.length - 1).join(", ");
    return { city, countryEn: toEnglishCountry(countryPart) };
  }
  return { city: "", countryEn: toEnglishCountry(parts[0]) };
}

/** Rebuild location string with translated country name. */
export function localizeLocation(location: string, uiLang: string): string {
  const { city, countryEn } = parseLocation(location);
  const displayCountry = getCountryDisplay(countryEn, uiLang);
  if (city) return `${city}, ${displayCountry}`;
  return displayCountry;
}
