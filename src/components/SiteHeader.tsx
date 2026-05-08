import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { Title } from "./Title";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          {!user && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[#800000] hover:text-white transition-colors"
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => navigate("/apply")}
                className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-4 py-1.5 rounded hover:bg-[#800000] transition-colors"
              >
                {t("apply")}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Language"
                  >
                    <Globe size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[80px]">
                  <DropdownMenuItem
                    onClick={() => setLang("en")}
                    className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "en" ? "text-foreground font-medium" : ""}`}
                  >
                    EN
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLang("fr")}
                    className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "fr" ? "text-foreground font-medium" : ""}`}
                  >
                    FR
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLang("it")}
                    className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "it" ? "text-foreground font-medium" : ""}`}
                  >
                    IT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {user && (
            <>
              <div className="flex items-center gap-3 sm:contents">
                <button
                  onClick={() => navigate("/members")}
                  className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[#800000] hover:text-white transition-colors sm:order-1"
                >
                  {t("profiles")}
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[#800000] hover:text-white transition-colors sm:order-2"
                >
                  {t("conversation")}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors sm:order-6"
                      aria-label="Language"
                    >
                      <Globe size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[80px]">
                    <DropdownMenuItem
                      onClick={() => setLang("en")}
                      className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "en" ? "text-foreground font-medium" : ""}`}
                    >
                      EN
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLang("fr")}
                      className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "fr" ? "text-foreground font-medium" : ""}`}
                    >
                      FR
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLang("it")}
                      className={`font-sans-ui text-sm cursor-pointer hover:bg-[#800000] hover:text-white transition-colors ${lang === "it" ? "text-foreground font-medium" : ""}`}
                    >
                      IT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3 sm:contents">
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[#800000] hover:text-white transition-colors sm:order-3"
                  >
                    admin
                  </button>
                )}
                <button
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[#800000] hover:text-white transition-colors sm:order-4"
                >
                  {t("signOut")}
                </button>
                <button
                  onClick={() => navigate(`/members/${profile?.member_number}`)}
                  className="p-0 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary sm:order-5"
                  aria-label={t("profile")}
                >
                  <Avatar className="h-10 w-10 border border-border rounded-full">
                    <AvatarFallback className="bg-white text-black text-base font-bold font-sans-ui">
                      {profile?.member_number ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
