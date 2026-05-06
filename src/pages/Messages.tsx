import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  created_at: string;
}

interface OtherProfile {
  id: string;
  member_number: number | null;
}

const DEMO_ACTIVE = { conv: { id: "demo-conv", member_a: "demo-user", member_b: "demo-2", status: "active", archived_at: null, created_at: new Date().toISOString() } as ConvRow, other: { id: "demo-2", member_number: 2 } as OtherProfile };
const DEMO_ARCHIVED = [
  { conv: { id: "demo-arch-1", member_a: "demo-user", member_b: "demo-3", status: "archived", archived_at: new Date(Date.now() - 86400000 * 30).toISOString(), created_at: new Date(Date.now() - 86400000 * 60).toISOString() } as ConvRow, other: { id: "demo-3", member_number: 3 } as OtherProfile },
  { conv: { id: "demo-arch-2", member_a: "demo-user", member_b: "demo-5", status: "archived", archived_at: new Date(Date.now() - 86400000 * 10).toISOString(), created_at: new Date(Date.now() - 86400000 * 45).toISOString() } as ConvRow, other: { id: "demo-5", member_number: 5 } as OtherProfile },
];

const Messages = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = !user || location.pathname === "/messages-demo";
  const [active, setActive] = useState<{ conv: ConvRow; other: OtherProfile } | null>(null);
  const [archived, setArchived] = useState<{ conv: ConvRow; other: OtherProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setActive(DEMO_ACTIVE);
      setArchived(DEMO_ARCHIVED);
      setLoading(false);
      return;
    }
    if (!user) return;
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
  }, [user, isDemo]);

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
                className="flex items-center justify-center w-16 h-16 rounded-full border border-border bg-card transition-colors hover:border-foreground"
              >
                <span className="text-xl font-sans-ui">{active.other.member_number ?? "—"}</span>
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-sans-ui text-xl text-black font-normal mb-4">{t("messages.past")}</h2>
          <div className="border border-border p-6 opacity-50">
            {archived.length === 0 ? (
              <p className="text-muted-foreground italic text-center font-sans-ui">{t("messages.noArchive")}</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {archived.map(({ conv, other }) => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    className="flex items-center justify-center w-14 h-14 rounded-full border border-border bg-card transition-colors hover:border-foreground"
                  >
                    <span className="text-lg font-sans-ui">{other.member_number ?? "—"}</span>
                  </Link>
                ))}
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
