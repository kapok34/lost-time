import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="font-display text-6xl mb-4">404</h1>
        <p className="text-muted-foreground italic mb-8">{t("notFound.title")}</p>
        <Link to="/" className="text-primary underline-offset-4 hover:underline">
          {t("notFound.back")}
        </Link>
      </main>
    </div>
  );
};

export default NotFound;
