import { useI18n } from "@/i18n/context";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-6 font-sans-ui">
      <div className="container max-w-6xl relative flex items-center text-base text-muted-foreground">
        <span className="flex-1">{t("footer.copyright")}</span>
        <button
          onClick={() => window.location.href = "mailto:admin@lost-time.org"}
          className="absolute left-1/2 -translate-x-1/2 text-base font-sans-ui tracking-widest text-muted-foreground hover:text-[hsl(350,55%,35%)] transition-colors"
        >
          contact
        </button>
        <span className="flex-1 text-right">{t("footer.privacy")}</span>
      </div>
    </footer>
  );
};
