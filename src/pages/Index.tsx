import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { SeedButton } from "@/components/SeedButton";
import { Link } from "react-router-dom";

const Index = () => {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex flex-col items-center px-6">
        <div className="flex-[1]" />

        <p className="text-base font-sans-ui tracking-[0.3em] text-muted-foreground mb-4">
          {t("subtitle")}
        </p>

        <h1 className="font-sans-ui text-[10vw] md:text-[5.5vw] leading-none tracking-tight text-center select-none text-foreground">
          lost time
        </h1>

        <div className="flex-[1]" />

        <Link
          to="/preface"
          className="text-xl tracking-widest text-foreground hover:text-[hsl(350,55%,35%)] transition-colors underline underline-offset-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontVariant: "small-caps" }}
        >
          {t("prefaceLink")}
        </Link>

        <div className="flex-[1]" />
      </div>

      <Footer />
    </main>
  );
};

export default Index;
