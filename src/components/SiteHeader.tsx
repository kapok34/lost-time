import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { Title } from "./Title";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `text-base tracking-wide uppercase transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

export const SiteHeader = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const approved = profile?.status === "approved";
  const onLanding = location.pathname === "/";

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="container max-w-6xl flex items-center justify-between py-5">
        <Link to="/">
          <Title />
        </Link>

        {!onLanding && (
          <nav className="hidden md:flex items-center gap-8">
            {approved && (
              <>
                <NavLink to="/members" className={linkCls}>{t("members")}</NavLink>
                <NavLink to="/messages" className={linkCls}>{t("messages")}</NavLink>
                <NavLink to="/settings" className={linkCls}>{t("profile")}</NavLink>
              </>
            )}
            {isAdmin && <NavLink to="/admin" className={linkCls}>{t("admin")}</NavLink>}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-foreground hover:text-background transition-colors"
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => navigate("/apply")}
                className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-4 py-1.5 rounded hover:bg-[hsl(350,55%,30%)] transition-colors"
              >
                {t("apply")}
              </button>
            </>
          )}
          {user && (
            <>
              <button
                onClick={() => navigate("/members")}
                className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-foreground hover:text-background transition-colors"
              >
                {t("profiles")}
              </button>
              <button
                onClick={() => navigate("/messages")}
                className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-foreground hover:text-background transition-colors"
              >
                {t("conversation")}
              </button>
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-foreground hover:text-background transition-colors"
              >
                {t("signOut")}
              </button>
            </>
          )}

          {/* EN/FR toggle */}
          <div className="flex items-center gap-1 text-base font-sans-ui tracking-widest text-muted-foreground ml-2">
            <button
              onClick={() => setLang("en")}
              className={`px-1 py-0.5 transition-colors ${lang === "en" ? "text-foreground font-medium" : "hover:text-foreground"}`}
              aria-label="English"
            >
              EN
            </button>
            <span>/</span>
            <button
              onClick={() => setLang("fr")}
              className={`px-1 py-0.5 transition-colors ${lang === "fr" ? "text-foreground font-medium" : "hover:text-foreground"}`}
              aria-label="Français"
            >
              FR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
