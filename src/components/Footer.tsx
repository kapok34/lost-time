import { useI18n } from "@/i18n/context";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-6 font-sans-ui">
      <div className="container max-w-6xl flex flex-col sm:flex-row items-center gap-3 sm:gap-0 text-base text-muted-foreground">
        <span className="sm:flex-1 order-2 sm:order-1 text-center sm:text-left">{t("footer.copyright")}</span>
        <button
          onClick={() => window.location.href = "mailto:admin@lost-time.org"}
          className="order-1 sm:order-2 text-base font-sans-ui tracking-widest text-muted-foreground hover:text-[hsl(350,55%,35%)] transition-colors"
        >
          contact
        </button>
        <span className="sm:flex-1 order-3 text-center sm:text-right">{t("footer.privacy")}</span>
      </div>
    </footer>
  );
};
