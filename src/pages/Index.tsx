import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";

const Index = () => {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex flex-col items-center px-6">
        <div className="flex-[1]" />

        <p className="text-sm font-sans-ui tracking-[0.3em] uppercase text-muted-foreground mb-4">
          {t("subtitle")}
        </p>

        <h1 className="font-sans-ui text-[10vw] md:text-[5.5vw] leading-none tracking-tight text-center select-none text-foreground">
          lost time
        </h1>

        <div className="flex-[2]" />
      </div>

      <footer className="border-t border-border py-6 font-sans-ui">
        <div className="container max-w-6xl flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.privacy")}</span>
        </div>
      </footer>
    </main>
  );
};

export default Index;
