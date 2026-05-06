import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";

interface Member {
  id: string;
  display_name: string;
  member_number: number | null;
  location: string;
}

const DEMO_MEMBERS: Member[] = [
  { id: "demo-1", display_name: "Member One", member_number: 1, location: "Paris, France" },
  { id: "demo-2", display_name: "Member Two", member_number: 2, location: "Kyoto, Japan" },
];

const Members = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, member_number, location")
        .order("member_number", { ascending: true });
      if (error) {
        console.warn("Members fetch error:", error.message);
      }
      const fetched = (data as Member[]) ?? [];
      // Fallback to demo members when database is empty or unreachable
      setMembers(fetched.length > 0 ? fetched : DEMO_MEMBERS);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("member_a, member_b")
        .or(`member_a.eq.${user.id},member_b.eq.${user.id}`);
      const ids = new Set<string>();
      (data ?? []).forEach((c: any) => {
        ids.add(c.member_a === user.id ? c.member_b : c.member_a);
      });
      setContactedIds(ids);
    })();
  }, [user]);

  const { countries, citiesByCountry } = useMemo(() => {
    const parsed = members.map((m) => {
      const parts = m.location.split(",").map((s) => s.trim());
      const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const city = parts.length > 1 ? parts.slice(0, parts.length - 1).join(", ") : "";
      return { ...m, city, country };
    });
    const countries = Array.from(new Set(parsed.map((m) => m.country).filter(Boolean))).sort();
    const citiesByCountry: Record<string, string[]> = {};
    parsed.forEach((m) => {
      if (!citiesByCountry[m.country]) citiesByCountry[m.country] = [];
      if (m.city && !citiesByCountry[m.country].includes(m.city)) {
        citiesByCountry[m.country].push(m.city);
      }
    });
    Object.keys(citiesByCountry).forEach((c) => citiesByCountry[c].sort());
    return { countries, citiesByCountry, parsed };
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const parts = m.location.split(",").map((s) => s.trim());
      const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const city = parts.length > 1 ? parts.slice(0, parts.length - 1).join(", ") : "";
      if (countryFilter !== "all" && country !== countryFilter) return false;
      if (cityFilter !== "all" && city !== cityFilter) return false;
      return true;
    });
  }, [members, countryFilter, cityFilter]);

  return (
    <div className="min-h-screen flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-12">
        <div className="flex justify-end gap-3 mb-8">
          <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setCityFilter("all"); }}>
            <SelectTrigger className="w-40 bg-white border-input">
              <SelectValue placeholder="country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-40 bg-white border-input">
              <SelectValue placeholder="city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all cities</SelectItem>
              {(citiesByCountry[countryFilter] ?? []).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground italic">{t("members.noMatch")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((m) => {
              const contacted = contactedIds.has(m.id);
              return (
                <Link
                  to={`/members/${m.id}`}
                  key={m.id}
                  className={`flex flex-col items-center justify-center aspect-square border border-border bg-card transition-colors hover:border-foreground ${contacted ? "opacity-40" : ""}`}
                >
                  <span className="text-4xl font-bold font-sans-ui">{m.member_number ?? m.display_name}</span>
                  <span className="text-base text-muted-foreground mt-2">{m.location}</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Members;
