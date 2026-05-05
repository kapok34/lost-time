import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  display_name: string;
  avatar_url: string | null;
  language: string;
  location: string;
  created_at: string;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [language, setLanguage] = useState("all");
  const [locationQuery, setLocationQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, location, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setMembers((data as Member[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const languages = useMemo(
    () => Array.from(new Set(members.map((m) => m.language))).sort(),
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (language !== "all" && m.language !== language) return false;
      if (locationQuery && !m.location.toLowerCase().includes(locationQuery.toLowerCase())) return false;
      return true;
    });
  }, [members, language, locationQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl mb-3">Members</h1>
          <p className="text-muted-foreground italic">A society of {members.length} curious souls.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1">
            <Input
              placeholder="Filter by location…"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="bg-white border-input"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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
      </main>
    </div>
  );
};

export default Members;