import { Navigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";

const Pending = () => {
  const { t } = useI18n();
  const { profile, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/" replace />;
  if (profile.status === "approved" || isAdmin) return <Navigate to="/members" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-xl py-24 text-center">
        {profile.status === "pending" && (
          <>
            <h1 className="font-display text-4xl mb-6">{t("pending.title")}</h1>
            <p className="text-muted-foreground italic text-lg leading-relaxed">
              {t("pending.subtitle")}
            </p>
          </>
        )}
        {profile.status === "rejected" && (
          <>
            <h1 className="font-display text-4xl mb-6">{t("pending.title")}</h1>
            <p className="text-muted-foreground italic text-lg">
              {t("pending.subtitle")}
            </p>
            {profile && (profile as any).rejection_reason && (
              <p className="mt-6 italic">"{(profile as any).rejection_reason}"</p>
            )}
          </>
        )}
        {profile.status === "suspended" && (
          <>
            <h1 className="font-display text-4xl mb-6">{t("pending.title")}</h1>
            <p className="text-muted-foreground italic text-lg">
              {t("pending.status")}
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Pending;
