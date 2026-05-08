import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        setDeleting(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.error || "Could not delete account");
        setDeleting(false);
        return;
      }

      await signOut();
      toast.success("Your account has been deleted");
      navigate("/");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : "Could not delete account") ?? "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-xl py-16 flex flex-col items-center text-center">
        <h1 className="font-display text-4xl mb-6">{t("deleteAccount.title")}</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {t("deleteAccount.description")}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting} className="w-full max-w-xs">
              {deleting ? t("deleteAccount.deleting") : t("deleteAccount.button")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-sans-ui">{t("deleteAccount.confirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription className="font-sans-ui">
                {t("deleteAccount.confirmDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-sans-ui hover:!bg-[hsl(350,55%,35%)] hover:!text-white">
                {t("conversation.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="font-sans-ui bg-destructive text-white hover:bg-destructive"
              >
                {t("deleteAccount.button")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
};

export default DeleteAccount;
