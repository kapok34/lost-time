import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const EnglishPreface = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-4 md:py-6 max-w-5xl mx-auto w-full flex flex-col justify-between">
      <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground text-left">
        an asocial network in remembrance of things past
      </p>

      <div>
        <span
          className="block text-left italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05, fontWeight: 300 }}
        >
          lost
        </span>
      </div>

      <div className="md:pl-36">
        <span
          className="block italic text-muted-foreground"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          time
        </span>
      </div>

      <div>
        <p
          className="text-muted-foreground md:pl-20"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Apply by filling out
        </p>
        <p
          className="text-muted-foreground md:pl-36"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          the Proust questionnaire.
        </p>
      </div>

      <div>
        <p
          className="text-right"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.4, fontWeight: 400 }}
        >
          Your answers
        </p>
        <p
          className="text-right italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          will form your portrait.
        </p>
      </div>

      <div className="md:pl-20">
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground">
          No name
        </p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-12">
          no photograph
        </p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-28">
          no age &nbsp; no gender &nbsp; no intentions
        </p>
      </div>

      <div>
        <p
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.4, fontWeight: 400 }}
        >
          Peruse other members'
        </p>
        <p
          className="italic md:pl-20"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          portraits.
        </p>
      </div>

      <div className="text-right">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Hold correspondences,
        </p>
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          but only one at a time.
        </p>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground tracking-[0.3em]">· · ·</span>
      </div>

      <div>
        <div className="md:pl-28">
          <span
            className="italic block text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
          >
            finding
          </span>
        </div>
        <div className="text-right">
          <span
            className="italic block"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05, fontWeight: 300 }}
          >
            the time again
          </span>
        </div>
      </div>
    </article>
  );
};

const FrenchPreface = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-4 md:py-6 max-w-5xl mx-auto w-full flex flex-col justify-between">
      <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground text-left">
        un réseau asocial à la recherche du temps perdu
      </p>

      <div>
        <span
          className="block text-left italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05, fontWeight: 300 }}
        >
          lost
        </span>
      </div>

      <div className="md:pl-36">
        <span
          className="block italic text-muted-foreground"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          time
        </span>
      </div>

      <div>
        <p
          className="text-muted-foreground md:pl-20"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Remplis le questionnaire de Proust
        </p>
        <p
          className="text-muted-foreground md:pl-36"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          pour postuler.
        </p>
      </div>

      <div>
        <p
          className="text-right"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.4, fontWeight: 400 }}
        >
          Tes réponses
        </p>
        <p
          className="text-right italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          formeront ton portrait.
        </p>
      </div>

      <div className="md:pl-20">
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground">
          Pas de nom
        </p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-12">
          pas de photo
        </p>
        <p className="text-xs font-sans-ui tracking-[0.18em] uppercase text-muted-foreground md:pl-28">
          pas d&apos;âge &nbsp;·&nbsp; pas de genre &nbsp;·&nbsp; pas d&apos;intentions
        </p>
      </div>

      <div>
        <p
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.4, fontWeight: 400 }}
        >
          Parcours les portraits
        </p>
        <p
          className="italic md:pl-20"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
        >
          des autres membres.
        </p>
      </div>

      <div className="text-right">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          Tiens correspondance,
        </p>
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.6, fontWeight: 400 }}
        >
          mais une seule à la fois.
        </p>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground tracking-[0.3em]">· · ·</span>
      </div>

      <div>
        <div className="md:pl-28">
          <span
            className="italic block text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)", lineHeight: 1.2, fontWeight: 300 }}
          >
            retrouver
          </span>
        </div>
        <div className="text-right">
          <span
            className="italic block"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05, fontWeight: 300 }}
          >
            le temps
          </span>
        </div>
      </div>
    </article>
  );
};

const ItalianPreface = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-4 md:py-6 max-w-5xl mx-auto w-full flex flex-col justify-between">
      <p
        className="italic"
        style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.8rem, 1.2vw, 1.1rem)", lineHeight: 1.5, fontWeight: 400 }}
      >
        lost time
      </p>
      <p className="md:pl-[8%] text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
        è una rete asociale alla ricerca del tempo perduto
      </p>

      <div className="md:pl-[8%]">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.5, fontWeight: 400 }}
        >
          Compila il questionario di Proust
        </p>
      </div>
      <div className="md:pl-[18%]">
        <p
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.1rem, 2vw, 1.6rem)", lineHeight: 1.25, fontWeight: 400 }}
        >
          per candidarti.
        </p>
      </div>

      <div className="text-right">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)", lineHeight: 1.1, fontWeight: 400 }}
        >
          Le tue risposte formeranno il tuo ritratto.
        </p>
      </div>

      <div>
        <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
          Nessun nome
        </p>
        <div className="md:pl-[8%]">
          <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
            nessuna foto
          </p>
        </div>
        <div className="md:pl-[18%]">
          <p className="text-xs font-sans-ui tracking-[0.22em] uppercase text-muted-foreground">
            nessuna età &nbsp;·&nbsp; nessun genere &nbsp;·&nbsp; nessuna intenzione
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(1.1rem, 2vw, 1.6rem)", lineHeight: 1.25, fontWeight: 400 }}
        >
          Sfoglia i ritratti
        </p>
      </div>
      <div className="md:pl-[44%]">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)", lineHeight: 1.1, fontWeight: 400 }}
        >
          degli altri soci.
        </p>
      </div>

      <div className="md:pl-[8%]">
        <p
          className="text-muted-foreground"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(0.9rem, 1.4vw, 1.2rem)", lineHeight: 1.5, fontWeight: 400 }}
        >
          Tieniti in corrispondenza,
        </p>
      </div>
      <div className="md:pl-[18%]">
        <p
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.1rem, 2vw, 1.6rem)", lineHeight: 1.25, fontWeight: 400 }}
        >
          ma una sola alla volta.
        </p>
      </div>

      <div className="text-right">
        <p
          className="italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.0, fontWeight: 400 }}
        >
          ritrovare il tempo
        </p>
      </div>
    </article>
  );
};

const Preface = () => {
  const { lang } = useI18n();
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      {lang === "fr" ? <FrenchPreface /> : lang === "it" ? <ItalianPreface /> : <EnglishPreface />}
      <Footer />
    </main>
  );
};

export default Preface;
