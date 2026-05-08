import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";

interface ConvRow {
  id: string;
  member_a: string;
  member_b: string;
  status: string;
  archived_at: string | null;
  ended_by: string | null;
  created_at: string;
}

interface OtherProfile {
  id: string;
  member_number: number | null;
}


const Messages = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [active, setActive] = useState<{ conv: ConvRow; other: OtherProfile } | null>(null);
  const [archived, setArchived] = useState<{ conv: ConvRow; other: OtherProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`member_a.eq.${user.id},member_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const list = (convs as ConvRow[]) ?? [];
      const otherIds = Array.from(new Set(list.map((c) => (c.member_a === user.id ? c.member_b : c.member_a))));
      let profMap: Record<string, OtherProfile> = {};
      if (otherIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, member_number").in("id", otherIds);
        (profs ?? []).forEach((p: any) => (profMap[p.id] = p));
      }
      const enriched = list.map((c) => ({
        conv: c,
        other: profMap[c.member_a === user.id ? c.member_b : c.member_a] ?? { id: "", member_number: null },
      }));
      setActive(enriched.find((e) => e.conv.status === "active") ?? null);
      setArchived(enriched.filter((e) => e.conv.status !== "active"));
      setLoading(false);
    })();
  }, [user]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    const date = new Date(d);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl flex flex-col justify-center py-12">
        <section className="mb-12">
          <h2 className="font-sans-ui text-xl text-[hsl(350,55%,35%)] font-normal mb-4">{t("messages.active")}</h2>
          <div className="border border-border p-8">
            {loading ? (
              <p className="text-muted-foreground italic text-center">Loading…</p>
            ) : !active ? (
              <div className="text-center">
                <p className="italic text-muted-foreground mb-4 font-sans-ui">{t("messages.noActive")}</p>
                <Link
                  to="/members"
                  className="inline-block text-base font-sans-ui border border-foreground text-foreground px-4 py-1 rounded hover:bg-[hsl(350,55%,35%)] hover:text-white transition-colors"
                >
                  {t("messages.browse")}
                </Link>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/messages/${active.conv.id}`)}
                className="flex items-center justify-center w-16 h-16 rounded-full border border-[hsl(350,55%,35%)] bg-card transition-colors hover:border-foreground"
              >
                <span className="text-xl font-sans-ui">{active.other.member_number ?? "—"}</span>
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-sans-ui text-xl text-black font-normal mb-4">{t("messages.past")}</h2>
          <div className="border border-border p-6">
            {archived.length === 0 ? (
              <p className="text-muted-foreground italic text-center font-sans-ui">{t("messages.noArchive")}</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {archived.map(({ conv, other }) => {
                  const canRestart = (() => {
                    if (conv.status === "active") return false;
                    if (!conv.ended_by) return false;
                    if (conv.ended_by !== user?.id) return false;
                    if (conv.archived_at && new Date(conv.archived_at) > new Date(Date.now() - 34 * 24 * 60 * 60 * 1000)) return false;
                    return true;
                  })();
                  const classes = canRestart
                    ? "flex items-center justify-center w-14 h-14 rounded-full border border-muted-foreground bg-card transition-colors hover:border-[hsl(350,55%,35%)]"
                    : "flex items-center justify-center w-14 h-14 rounded-full border border-border bg-card transition-colors hover:border-foreground opacity-40";
                  return (
                    <Link
                      key={conv.id}
                      to={`/messages/${conv.id}`}
                      className={classes}
                    >
                      <span className="text-lg font-sans-ui">{other.member_number ?? "—"}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
