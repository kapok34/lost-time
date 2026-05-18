import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { PageSEO } from "@/components/PageSEO";

const NotFound = () => {
  const location = useLocation();
  const { t, lang } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const seoTitle = lang === "fr" ? "page introuvable" : lang === "it" ? "pagina non trovata" : "page not found";
  const seoDescription =
    lang === "fr"
      ? "Ce que vous recherchez n'existe pas."
      : lang === "it"
      ? "Ciò che stai cercando non esiste."
      : "What you are looking for does not exist.";

  return (
    <>
      <PageSEO title={seoTitle} description={seoDescription} ogTitle={seoTitle} ogDescription={seoDescription} />
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="font-display text-6xl mb-4">404</h1>
        <p className="text-muted-foreground italic">{t("notFound.title")}</p>
      </main>
    </div>
    </>
  );
};

export default NotFound;
