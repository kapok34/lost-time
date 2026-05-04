import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, isAdmin } = useAuth();
  const approved = profile?.status === "approved";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container max-w-3xl py-24 md:py-32 text-center">
          <p className="font-sans-ui text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
            A private society · est. 2026
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-8">
            Acquaintance, by way of <em className="text-primary">questions</em>.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
            The Salon is a members-only circle for people who would rather know
            a stranger's idea of happiness than their job title. Joining begins
            with the Proust Questionnaire — thirty-five questions, in your own hand.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            {!user && (
              <>
                <Button asChild size="lg">
                  <Link to="/apply">Apply for membership</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
            {user && approved && (
              <Button asChild size="lg"><Link to="/members">Enter the salon</Link></Button>
            )}
            {user && !approved && !isAdmin && (
              <Button asChild size="lg"><Link to="/pending">Your application</Link></Button>
            )}
          </div>
        </section>

        <section className="container max-w-4xl pb-24">
          <div className="text-center ornament mb-16">
            <span className="font-display italic text-2xl">How it works</span>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { n: "I.", title: "Answer", body: "Fill out all thirty-five questions in your own voice. Take your time — autosaved as you write." },
              { n: "II.", title: "Await", body: "Each application is read by hand. You will hear back by email when a decision is made." },
              { n: "III.", title: "Converse", body: "Once admitted, you may browse other members and hold one private correspondence at a time." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-display text-3xl text-primary mb-3">{s.n}</div>
                <h3 className="font-display text-2xl mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p className="italic">"Style is a question of vision." — Proust</p>
      </footer>
    </div>
  );
};

export default Index;
