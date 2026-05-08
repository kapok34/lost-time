import { useI18n } from "@/i18n/context";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-6 font-sans-ui">
      <div className="container max-w-6xl flex flex-row items-center gap-0 text-xs sm:text-base text-muted-foreground">
        <span className="flex-1 text-left whitespace-pre-line sm:whitespace-normal">{t("footer.copyright")}</span>
        <button
          onClick={() => window.location.href = "mailto:admin@lost-time.org"}
          className="font-sans-ui tracking-widest text-muted-foreground hover:text-[hsl(350,55%,35%)] transition-colors"
        >
          contact
        </button>
        <span className="flex-1 text-right whitespace-pre-line sm:whitespace-normal">{t("footer.privacy")}</span>
      </div>
    </footer>
  );
};
