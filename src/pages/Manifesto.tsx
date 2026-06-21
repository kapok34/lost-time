import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PageSEO } from "@/components/PageSEO";

const EnglishManifesto = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-12 md:py-16 max-w-2xl mx-auto w-full font-sans-ui">
      <h1 className="text-center mb-12 text-2xl md:text-3xl tracking-widest">
        manifesto
      </h1>

      <ul className="space-y-8 text-sm md:text-base leading-relaxed text-muted-foreground">
        <li>
          <span className="font-bold text-foreground">No juggling</span>.{" "}
          <br />
          Each member can hold only one active correspondence at a time.
        </li>
        <li>
          <span className="font-bold text-foreground">No </span><i className="font-bold text-foreground">hey you</i>.{" "}
          <br />
          Your first message to another member must contain at least 34 characters.
        </li>
        <li>
          <span className="font-bold text-foreground">No ghosting</span>.{" "}
          <br />
          You can end a correspondence only after you have responded, or if your correspondent has not responded for over 34 hours.
        </li>
        <li>
          <span className="font-bold text-foreground">No boomerang</span>.{" "}
          <br />
          If you end a correspondence, you have to wait 34 days before you can restart it.
        </li>
        <li>
          <span className="font-bold text-foreground">No pen pals (here)</span>.{" "}
          <br />
          You get 10 messages each before the correspondence ends automatically. Move the conversation elsewhere if you click.
        </li>
      </ul>
    </article>
  );
};

const FrenchManifesto = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-12 md:py-16 max-w-2xl mx-auto w-full font-sans-ui">
      <h1 className="text-center mb-12 text-2xl md:text-3xl tracking-widest">
        manifeste
      </h1>

      <ul className="space-y-8 text-sm md:text-base leading-relaxed text-muted-foreground">
        <li>
          <span className="font-bold text-foreground">Pas de jonglage</span>.{" "}
          <br />
          Chaque membre ne peut entretenir qu'une seule correspondance à la fois.
        </li>
        <li>
          <span className="font-bold text-foreground">Pas de <i className="font-bold text-foreground">salut toi</i></span>.{" "}
          <br />
          Ton premier message à un autre membre doit contenir au moins 34 caractères.
        </li>
        <li>
          <span className="font-bold text-foreground">Pas de fantômisation</span>.{" "}
          <br />
          Tu ne peux mettre fin à une correspondance qu'après avoir répondu, ou si ton correspondant n'a pas répondu depuis plus de 34 heures.
        </li>
        <li>
          <span className="font-bold text-foreground">Pas de boomerang</span>.{" "}
          <br />
          Si tu mets fin à une correspondance, tu dois attendre 34 jours avant de la reprendre.
        </li>
        <li>
          <span className="font-bold text-foreground">Pas d'éternels correspondants (ici)</span>.{" "}
          <br />
          Vous avez droit à 10 messages chacun avant que la correspondance ne se termine automatiquement. Poursuivez la conversation ailleurs si vous vous entendez bien.
        </li>
      </ul>
    </article>
  );
};

const ItalianManifesto = () => {
  return (
    <article className="flex-1 px-6 md:px-12 py-12 md:py-16 max-w-2xl mx-auto w-full font-sans-ui">
      <h1 className="text-center mb-12 text-2xl md:text-3xl tracking-widest">
        manifesto
      </h1>

      <ul className="space-y-8 text-sm md:text-base leading-relaxed text-muted-foreground">
        <li>
          <span className="font-bold text-foreground">Niente giocoleria</span>.{" "}
          <br />
          Ogni socio può mantenere una sola corrispondenza attiva alla volta.
        </li>
        <li>
          <span className="font-bold text-foreground">Niente <i className="font-bold text-foreground">ciao, come va?</i></span>{" "}
          <br />
          Il tuo primo messaggio ad un altro socio deve contenere almeno 34 caratteri.
        </li>
        <li>
          <span className="font-bold text-foreground">Niente ghosting</span>.{" "}
          <br />
          Puoi terminare una corrispondenza solo dopo aver risposto, o se il tuo corrispondente non ha risposto per più di 34 ore.
        </li>
        <li>
          <span className="font-bold text-foreground">Niente boomerang</span>.{" "}
          <br />
          Se termini una corrispondenza, devi aspettare 34 giorni prima di poterla riprendere.
        </li>
        <li>
          <span className="font-bold text-foreground">Niente pen friends (qui)</span>.{" "}
          <br />
          Avete 10 messaggi ciascuno prima che la corrispondenza finisca automaticamente. Sposta la conversazione altrove se c'è feeling.
        </li>
      </ul>
    </article>
  );
};

const Manifesto = () => {
  const { lang } = useI18n();

  const title = lang === "fr" ? "manifeste" : lang === "it" ? "manifesto" : "manifesto";
  const description =
    lang === "fr"
      ? "Les règles de lost time : pas de jonglage, pas de salut toi, pas de fantômisation, pas de boomerang, pas d'éternels correspondants."
      : lang === "it"
      ? "Le regole di lost time: niente giocoleria, niente ciao come va, niente ghosting, niente boomerang, niente pen friends."
      : "The rules of lost time: no juggling, no hey you, no ghosting, no boomerang, no pen pals (here).";

  return (
    <>
      <PageSEO title={title} description={description} path="/manifesto" ogTitle={title} ogDescription={description} />
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        <SiteHeader />
        {lang === "fr" ? <FrenchManifesto /> : lang === "it" ? <ItalianManifesto /> : <EnglishManifesto />}
        <Footer />
      </main>
    </>
  );
};

export default Manifesto;
