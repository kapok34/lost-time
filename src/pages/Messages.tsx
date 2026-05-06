import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  display_name: string;
  avatar_url: string | null;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<{ conv: ConvRow; other: OtherProfile } | null>(null);
  const [archived, setArchived] = useState<{ conv: ConvRow; other: OtherProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", otherIds);
        (profs ?? []).forEach((p: any) => (profMap[p.id] = p));
      }
      const enriched = list.map((c) => ({
        conv: c,
        other: profMap[c.member_a === user.id ? c.member_b : c.member_a] ?? { id: "", display_name: "Unknown", avatar_url: null },
      }));
      setActive(enriched.find((e) => e.conv.status === "active") ?? null);
      setArchived(enriched.filter((e) => e.conv.status !== "active"));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-12">
        <h1 className="font-display text-4xl mb-10">Correspondence</h1>

        <section className="mb-12">
          <h2 className="font-display text-xl text-muted-foreground mb-4">Active</h2>
          {loading ? (
            <p className="text-muted-foreground italic">Loading…</p>
          ) : !active ? (
            <div className="border border-dashed border-border p-8 text-center">
              <p className="italic text-muted-foreground mb-4">You have no active correspondence.</p>
              <Button asChild variant="outline"><Link to="/members">Browse members</Link></Button>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/messages/${active.conv.id}`)}
              className="w-full text-left border border-border bg-card p-5 flex items-center gap-4 hover:border-primary transition-colors"
            >
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={active.other.avatar_url ?? undefined} />
                <AvatarFallback>{active.other.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-display text-xl">{active.other.display_name}</h3>
                <p className="text-base text-muted-foreground italic">Open conversation →</p>
              </div>
            </button>
          )}
        </section>

        {archived.length > 0 && (
          <section>
            <h2 className="font-display text-xl text-muted-foreground mb-4">Past correspondences</h2>
            <ul className="space-y-2">
              {archived.map(({ conv, other }) => (
                <li key={conv.id}>
                  <Link to={`/messages/${conv.id}`} className="block border border-border p-4 hover:bg-secondary transition-colors">
                    <span className="font-display text-lg">{other.display_name}</span>
                    <span className="text-base text-muted-foreground italic ml-2">
                      ended {conv.archived_at ? new Date(conv.archived_at).toLocaleDateString() : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default Messages;