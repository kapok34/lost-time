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
            AN ASOCIAL NETWORK
          </p>
          <h1 className="font-display md:text-7xl leading-[1.05] mb-8 font-sans font-semibold text-8xl">lost time</h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">{"\n"}</p>

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
              <Button asChild size="lg"><Link to="/members">Enter lost time</Link></Button>
            )}
            {user && !approved && !isAdmin && (
              <Button asChild size="lg"><Link to="/pending">Your application</Link></Button>
            )}
          </div>
        </section>

        <section className="container max-w-4xl pb-24">
          <div className="text-center ornament mb-16">
            <span className="font-display italic text-5xl font-sans font-medium text-accent text-left">manifesto</span>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { n: "I.", title: "No juggling.", body: "Only members can browse." },
              { n: "II.", title: "Await", body: "​Lost time is genderless. You have to be open to connecting with anyone." },
              { n: "III.", title: "No swiping.", body: "Once admitted, you may browse other members and hold one private correspondence at a time." },
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
        <p className="italic">​</p>
      </footer>
    </div>
  );
};

export default Index;
