import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

const EnglishPreface = () => {
  const { t } = useI18n();
  return (
    <article className="flex-1 px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto w-full">
      <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground">
        born in remembrance of things past
      </p>

      <div className="mt-24 md:mt-32">
        <span
          className="block text-left italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(3rem, 8vw, 5.5rem)", lineHeight: 1.05, fontWeight: 400 }}
        >
          lost
        </span>
      </div>

      <div className="mt-4 md:pl-24">
        <span
          className="block italic text-muted-foreground"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2, fontWeight: 400 }}
        >
          time
        </span>
      </div>

      <div className="mt-32 md:mt-48 md:pl-16">
        <p className="text-base md:text-lg leading-relaxed" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Apply by filling out
        </p>
        <p className="text-base md:text-lg leading-relaxed md:pl-12" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          the Proust questionnaire.
        </p>
      </div>

      <div className="mt-16 md:mt-24 text-right">
        <p className="text-lg md:text-xl leading-relaxed" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Your answers
        </p>
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2, fontWeight: 400 }}
        >
          will form your portrait.
        </p>
      </div>

      <div className="mt-24 md:mt-36 md:pl-16">
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground">No name</p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-16">no photograph</p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-32">no age &nbsp; no gender &nbsp; no intentions</p>
      </div>

      <div className="mt-24 md:mt-36">
        <p className="text-base md:text-lg leading-relaxed" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Peruse other members'
        </p>
        <p
          className="italic md:pl-24"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2, fontWeight: 400 }}
        >
          portraits.
        </p>
      </div>

      <div className="mt-16 md:mt-24 text-right">
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Hold correspondences,
        </p>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          but only one at a time.
        </p>
      </div>

      <div className="mt-32 md:mt-48 text-center">
        <span className="text-xs text-muted-foreground tracking-[0.3em]">· · ·</span>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="md:pl-32">
          <span
            className="italic block text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2, fontWeight: 400 }}
          >
            finding
          </span>
        </div>
        <div className="text-right mt-2">
          <span
            className="italic block"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(3rem, 8vw, 5.5rem)", lineHeight: 1.05, fontWeight: 400 }}
          >
            the time again
          </span>
        </div>
      </div>

      <div className="mt-32 md:mt-48 flex flex-col items-center gap-6">
        <div className="w-16 h-px bg-border" />
        <Link
          to="/apply"
          className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-6 py-2.5 rounded hover:bg-[#800000] transition-colors"
        >
          {t("apply")}
        </Link>
        <p className="text-sm text-muted-foreground font-sans-ui">lost-time.org</p>
      </div>
    </article>
  );
};

const FrenchPreface = () => {
  const { t } = useI18n();
  return (
    <article className="flex-1 flex flex-col items-center px-4 py-12">
      <svg
        viewBox="0 0 900 900"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[900px]"
        style={{ maxHeight: "90vh" }}
      >
        <defs>
          <style>
            {`
              text { font-family: 'Cormorant Garamond', Georgia, serif; fill: hsl(var(--foreground)); }
              .it { font-style: italic; }
              .dim { fill: hsl(var(--muted-foreground)); }
              .mid { fill: hsl(var(--foreground)); fill-opacity: 0.85; }
              .drk { fill: hsl(var(--foreground)); }
            `}
          </style>
          <path id="s1" d="M 450,450 m -60,0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
          <path id="s2" d="M 450,450 m -110,0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0" />
          <path id="s3" d="M 450,450 m -165,0 a 165,165 0 1,1 330,0 a 165,165 0 1,1 -330,0" />
          <path id="s4" d="M 450,450 m -220,0 a 220,220 0 1,1 440,0 a 220,220 0 1,1 -440,0" />
          <path id="s5" d="M 450,450 m -280,0 a 280,280 0 1,1 560,0 a 280,280 0 1,1 -560,0" />
          <path id="s6" d="M 450,450 m -340,0 a 340,340 0 1,1 680,0 a 340,340 0 1,1 -680,0" />
          <path id="spoke-top" d="M 450,100 L 450,385" />
          <path id="spoke-bot" d="M 450,515 L 450,800" />
        </defs>

        <text x="450" y="443" textAnchor="middle" fontSize="11" className="it drk" letterSpacing="2">le temps perdu</text>
        <text x="450" y="460" textAnchor="middle" fontSize="7" letterSpacing="4" className="dim">· · ·</text>

        <text fontSize="9.5" letterSpacing="2.5" className="dim">
          <textPath href="#s1" startOffset="0%">lost time · lost time · lost time · lost time · lost time ·</textPath>
        </text>

        <text fontSize="11" letterSpacing="1.8" className="mid">
          <textPath href="#s2" startOffset="3%">Remplis le questionnaire de Proust pour postuler.</textPath>
        </text>

        <text fontSize="12" letterSpacing="1.5" className="mid">
          <textPath href="#s3" startOffset="2%">Tes réponses formeront ton portrait. · Pas de nom, pas de photo, pas d'âge.</textPath>
        </text>

        <text fontSize="12.5" letterSpacing="1.5" className="mid">
          <textPath href="#s4" startOffset="1%">Pas de genre, pas d'intentions. · Parcours les portraits d'autres membres.</textPath>
        </text>

        <text fontSize="13" letterSpacing="1.6" className="mid">
          <textPath href="#s5" startOffset="0%">Tiens correspondance, mais une seule à la fois. · Tiens correspondance, mais une seule à la fois. ·</textPath>
        </text>

        <text fontSize="11" letterSpacing="2.2" className="it dim">
          <textPath href="#s6" startOffset="0%">lost time est à la recherche du temps perdu · lost time est à la recherche du temps perdu · lost time est à la recherche ·</textPath>
        </text>

        <text fontSize="10" letterSpacing="3" className="it dim">
          <textPath href="#spoke-top" startOffset="0%">retrouver le temps</textPath>
        </text>

        <text fontSize="13" letterSpacing="3.5" className="it drk">
          <textPath href="#spoke-bot" startOffset="5%">retrouver le temps</textPath>
        </text>
      </svg>
      <div className="mt-16 flex flex-col items-center gap-6">
        <div className="w-16 h-px bg-border" />
        <Link
          to="/apply"
          className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-6 py-2.5 rounded hover:bg-[#800000] transition-colors"
        >
          {t("apply")}
        </Link>
        <p className="text-sm text-muted-foreground font-sans-ui">lost-time.org</p>
      </div>
    </article>
  );
};

const ItalianPreface = () => {
  const { t } = useI18n();
  return (
    <article className="flex-1 px-6 md:px-12 py-16 md:py-24 max-w-5xl mx-auto w-full">
      {/* 1. lost time è alla ricerca del tempo perduto */}
      <p
        className="italic"
        style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.875rem, 1.5vw, 1.25rem)", lineHeight: 1.6, fontWeight: 400 }}
      >
        lost time
      </p>
      <p className="mt-2 md:pl-[10%] text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
        è alla ricerca del tempo perduto
      </p>

      <div className="mt-[17vh]" />

      {/* 2. Compila il questionario di Proust per candidarti. */}
      <div className="md:pl-[10%]">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.875rem, 1.5vw, 1.25rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Compila il questionario di Proust
        </p>
      </div>
      <div className="mt-[2.5vh] md:pl-[24%]">
        <p
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 2rem)", lineHeight: 1.3, fontWeight: 400 }}
        >
          per candidarti.
        </p>
      </div>

      <div className="mt-[11vh]" />

      {/* 3. Le tue risposte formeranno il tuo ritratto. */}
      <div className="text-right">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.75rem, 3.5vw, 3.5rem)", lineHeight: 1.1, fontWeight: 400 }}
        >
          Le tue risposte formeranno il tuo ritratto.
        </p>
      </div>

      <div className="mt-[17vh]" />

      {/* 4. Nessun nome, nessuna foto, nessuna età, nessun genere, nessuna intenzione. */}
      <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
        Nessun nome
      </p>
      <div className="mt-[2.5vh] md:pl-[10%]">
        <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
          nessuna foto
        </p>
      </div>
      <div className="mt-[2.5vh] md:pl-[24%]">
        <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
          nessuna età &nbsp;·&nbsp; nessun genere &nbsp;·&nbsp; nessuna intenzione.
        </p>
      </div>

      <div className="mt-[17vh]" />

      {/* 5. Sfoglia i ritratti degli altri soci. */}
      <div className="text-right">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 2rem)", lineHeight: 1.3, fontWeight: 400 }}
        >
          Sfoglia i ritratti
        </p>
      </div>
      <div className="mt-[2.5vh] md:pl-[56%]">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.75rem, 3.5vw, 3.5rem)", lineHeight: 1.1, fontWeight: 400 }}
        >
          degli altri soci.
        </p>
      </div>

      <div className="mt-[11vh]" />

      {/* 6. Tieniti in corrispondenza, ma una sola alla volta. */}
      <div className="md:pl-[10%]">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.875rem, 1.5vw, 1.25rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Tieniti in corrispondenza,
        </p>
      </div>
      <div className="mt-[2.5vh] md:pl-[24%]">
        <p
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.25rem, 2.5vw, 2rem)", lineHeight: 1.3, fontWeight: 400 }}
        >
          ma una sola alla volta.
        </p>
      </div>

      <div className="mt-[17vh]" />

      {/* 7. ritrovare il tempo */}
      <div className="text-right">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 1.0, fontWeight: 400 }}
        >
          ritrovare il tempo
        </p>
      </div>

      {/* CTA */}
      <div className="mt-[11vh] flex flex-col items-center gap-6">
        <div className="w-16 h-px bg-border" />
        <Link
          to="/apply"
          className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-6 py-2.5 rounded hover:bg-[#800000] transition-colors"
        >
          {t("apply")}
        </Link>
        <p className="text-sm text-muted-foreground font-sans-ui">lost-time.org</p>
      </div>
    </article>
  );
};

const Preface = () => {
  const { lang, t } = useI18n();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      {lang === "fr" ? <FrenchPreface /> : lang === "it" ? <ItalianPreface /> : <EnglishPreface />}
      <Footer />
    </main>
  );
};

export default Preface;
