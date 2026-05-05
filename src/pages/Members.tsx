import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface Member {
  id: string;
  display_name: string;
  avatar_url: string | null;
  language: string;
  location: string;
  created_at: string;
}

const Members = () => {
  const { profile } = useAuth();
  const approved = profile?.status === "approved";
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    by_language: { language: string; count: number }[];
    by_location: { location: string; count: number }[];
  } | null>(null);
  const [language, setLanguage] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: statsData } = await supabase.rpc("get_member_stats");
      if (statsData) setStats(statsData as any);

      if (approved) {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, language, location, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        setMembers((data as Member[]) ?? []);
      }
      setLoading(false);
    })();
  }, [approved]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (language !== "all" && m.language !== language) return false;
      if (locationFilter !== "all" && m.location !== locationFilter) return false;
      return true;
    });
  }, [members, language, locationFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl mb-3">Members</h1>
          <p className="text-muted-foreground italic font-sans">
            A society of {stats?.total ?? "…"} curious souls.
          </p>
        </div>

        {stats && (
          <div className="grid md:grid-cols-2 gap-10 mb-12 font-sans">
            <div className="border border-border p-6">
              <h2 className="font-display text-2xl mb-4">By language</h2>
              <ul className="space-y-2">
                {stats.by_language.map((row) => (
                  <li key={row.language} className="flex justify-between text-sm">
                    <span>{row.language}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border p-6">
              <h2 className="font-display text-2xl mb-4">By location</h2>
              <ul className="space-y-2">
                {stats.by_location.map((row) => (
                  <li key={row.location} className="flex justify-between text-sm">
                    <span>{row.location}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!approved ? (
          <p className="text-center text-muted-foreground italic font-sans">
            Sign in as an approved member to browse profiles.
          </p>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-10 font-sans">
              <div className="w-full md:w-64">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    {stats?.by_language.map((l) => (
                      <SelectItem key={l.language} value={l.language}>{l.language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-64">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {stats?.by_location.map((l) => (
                      <SelectItem key={l.location} value={l.location}>{l.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground italic">No members match your filters.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <Link
                to={`/members/${m.id}`}
                key={m.id}
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border border-border">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback className="font-display text-lg">
                      {m.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl truncate group-hover:text-primary transition-colors">
                      {m.display_name}
                    </h3>
                    <p className="text-sm text-muted-foreground italic truncate">
                      {m.location} · {m.language}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Members;