import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getQuestions, type QuestionnaireLang } from "@/data/questions";
import { useI18n } from "@/i18n/context";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  display_name: string;
  language: string;
  location: string;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
  questionnaire_language?: QuestionnaireLang | null;
}

const Admin = () => {
  const { t } = useI18n();
  const [pending, setPending] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, language, location, status, created_at, rejection_reason")
      .order("created_at", { ascending: false });
    const all = (data as Profile[]) ?? [];
    setPending(all.filter((p) => p.status === "pending"));
    setMembers(all.filter((p) => p.status === "approved" || p.status === "suspended"));
  };

  useEffect(() => { load(); }, []);

  const openApplicant = async (id: string) => {
    setOpenId(id);
    const { data } = await supabase.from("questionnaire_answers").select("question_id, answer").eq("user_id", id);
    const map: Record<number, string> = {};
    (data ?? []).forEach((a: any) => (map[a.question_id] = a.answer));
    setAnswers(map);
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Approved");
    setOpenId(null);
    load();
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ status: "rejected", rejection_reason: reason || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected");
    setReason("");
    setOpenId(null);
    load();
  };

  const suspend = async (id: string, suspend: boolean) => {
    const { error } = await supabase.from("profiles").update({ status: suspend ? "suspended" : "approved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(suspend ? "Suspended" : "Reinstated");
    load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-5xl py-12">
        <h1 className="font-display text-4xl mb-8">{t("admin.title")}</h1>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">{t("admin.pendingApplications")} ({pending.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-8">
            {pending.length === 0 ? (
              <p className="text-muted-foreground italic">{t("admin.noPending")}</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((p) => (
                  <li key={p.id} className="border border-border p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl">{p.display_name}</h3>
                      <p className="text-sm text-muted-foreground italic">
                        {p.location} · {p.language} · applied {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => openApplicant(p.id)}>Review</Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-8">
            <ul className="space-y-3">
              {members.map((p) => (
                <li key={p.id} className="border border-border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl">{p.display_name}</h3>
                    <p className="text-sm text-muted-foreground italic">
                      {p.location} · {p.language} · {p.status}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => suspend(p.id, p.status === "approved")}
                  >
                    {p.status === "approved" ? "Suspend" : "Reinstate"}
                  </Button>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>

        {openId && (
          <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto">
            <div className="container max-w-3xl py-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-3xl">
                  {pending.find((p) => p.id === openId)?.display_name}
                </h2>
                <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
              </div>

              <div className="space-y-8 mb-12">
                {getQuestions((pending.find((p) => p.id === openId)?.questionnaire_language) ?? "en").map((q) => (
                  <div key={q.id}>
                    <h3 className="font-display text-lg mb-1">
                      <span className="text-primary mr-2">{q.id}.</span>{q.text}
                    </h3>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {answers[q.id] || <span className="text-muted-foreground italic">{t("profile.noAnswer")}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sticky bottom-4 bg-background border border-border p-4">
                <Button className="flex-1" onClick={() => approve(openId)}>{t("admin.approve")}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">{t("admin.reject")}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject application?</AlertDialogTitle>
                      <AlertDialogDescription>Optionally include a short note.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => reject(openId)}>{t("admin.reject")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;