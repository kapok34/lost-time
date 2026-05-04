import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { motion, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const Section = ({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section id={id} className="border-t border-foreground/15">
    <div className="mx-auto max-w-6xl px-6 md:px-10 py-24 md:py-36 grid grid-cols-12 gap-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15%" }}
        variants={fadeUp}
        className="col-span-12 md:col-span-4"
      >
        <div className="eyebrow mb-6">{index}</div>
        <h2 className="display text-5xl md:text-6xl leading-[0.95]">{title}</h2>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15%" }}
        variants={fadeUp}
        transition={{ delay: 0.15 }}
        className="col-span-12 md:col-span-7 md:col-start-6 space-y-6 text-lg leading-relaxed text-foreground/85 max-w-prose"
      >
        {children}
      </motion.div>
    </div>
  </section>
);

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 md:px-10 h-16 flex items-center justify-between">
          <a href="#" className="display text-xl tracking-tight">
            lost <span className="italic text-accent">time</span>
          </a>
          <nav className="flex items-center gap-6 md:gap-10 text-xs uppercase tracking-[0.28em]">
            <a href="#manifeste" className="link-underline hidden md:inline">
              Manifeste
            </a>
            <span className="inline-flex items-center gap-1">
              <Link to="/login" className="link-underline">
                Login
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/apply" className="link-underline">
                Apply
              </Link>
            </span>
          </nav>
        </div>
        <div className="hairline h-px w-full opacity-15" />
      </header>

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-24 md:pb-40">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="eyebrow mb-10"
          >
            un réseau asocial
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="display text-[14vw] md:text-[8.5vw] leading-[0.88] tracking-tight"
          >
            lost
            <br />
            <span className="italic text-accent">time</span>
          </motion.h1>

          <div className="mt-16 grid grid-cols-12 gap-8">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "left" }}
              className="col-span-12 md:col-span-5 hairline h-px self-center opacity-60"
            />
          </div>
        </div>
      </section>

      {/* Manifeste */}
      <Section
        id="manifeste"
        index="I — Manifeste"
        title="Lost Time"
      >
        <p>A social network designed for meaningful connection beyond the surface.</p>
        <p>We believe in time well spent and conversations that matter.</p>
      </Section>

      {/* Footer */}
      <footer className="border-t border-foreground/15">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          <span>© {new Date().getFullYear()} Lost Time</span>
        </div>
      </footer>
    </main>
  );
};

export default Index;