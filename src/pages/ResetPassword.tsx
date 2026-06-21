import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    const verify = async () => {
      if (accessToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });
        if (error) {
          setError(error.message);
        } else {
          setError(null);
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError(t("resetPassword.invalidOrExpired"));
        }
      }
      setVerifying(false);
    };
    verify();
  }, [t]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("resetPassword.passwordsDoNotMatch"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("resetPassword.passwordTooShort"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("resetPassword.success"));
    navigate("/login");
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans-ui">
        <SiteHeader />
        <main className="flex-1 container max-w-md flex flex-col justify-center py-16 text-center">
          <p className="text-muted-foreground">{t("resetPassword.verifying")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans-ui">
        <SiteHeader />
        <main className="flex-1 container max-w-md flex flex-col justify-center py-16 text-center">
          <h1 className="font-display text-4xl mb-4">{t("resetPassword.errorTitle")}</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/login")}
              className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-8 py-1.5 rounded hover:bg-[hsl(350,55%,30%)] transition-colors"
            >
              {t("login.submit")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-md flex flex-col justify-center py-16">
        <h1 className="font-display text-4xl text-center mb-2">{t("resetPassword.title")}</h1>
        <p className="text-center text-muted-foreground mb-10">
          {t("resetPassword.subtitle")}
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="password" className="font-sans-ui">{t("resetPassword.newPassword")}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-sans-ui bg-white border-input"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="font-sans-ui">{t("resetPassword.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="font-sans-ui bg-white border-input"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-8 py-1.5 rounded hover:bg-[hsl(350,55%,30%)] transition-colors disabled:opacity-50"
            >
              {loading ? t("resetPassword.saving") : t("resetPassword.submit")}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
