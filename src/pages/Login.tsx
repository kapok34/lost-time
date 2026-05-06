import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-md py-16">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="font-sans-ui">{t("login.email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="font-sans-ui bg-white border-input" />
          </div>
          <div>
            <Label htmlFor="password" className="font-sans-ui">{t("login.password")}</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="font-sans-ui bg-white border-input" />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="text-base font-sans-ui bg-[hsl(350,55%,35%)] text-white px-8 py-1.5 rounded hover:bg-[hsl(350,55%,30%)] transition-colors disabled:opacity-50"
            >
              {loading ? t("login.signingIn") : t("login.submit")}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={async () => {
              if (!email) {
                toast.error(t("login.forgotPasswordHint"));
                return;
              }
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
              });
              if (error) toast.error(error.message);
              else toast.success(t("login.resetSent"));
            }}
            className="text-base font-sans-ui text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("login.forgotPassword")}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
