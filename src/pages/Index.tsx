import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { SeedButton } from "@/components/SeedButton";

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

        <div className="flex-[2]" />
      </div>

      <Footer />
    </main>
  );
};

export default Index;
