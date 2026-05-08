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
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface Member {
  id: string;
  member_number: number | null;
  location: string;
  questionnaire_languages: string[] | null;
}

const Members = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [searchNumber, setSearchNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, member_number, location, questionnaire_languages")
        .order("member_number", { ascending: true });
      if (error) {
        console.warn("Members fetch error:", error.message);
      }
      const fetched = (data as Member[]) ?? [];
      setMembers(fetched);
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

  const { countries, citiesByCountry, languages } = useMemo(() => {
    const otherMembers = members.filter((m) => !(user && m.id === user.id));
    const parsed = otherMembers.map((m) => {
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
    const languageSet = new Set<string>();
    otherMembers.forEach((m) => {
      if (m.questionnaire_languages) {
        m.questionnaire_languages.forEach((l) => languageSet.add(l));
      }
    });
    const languages = Array.from(languageSet).sort();
    return { countries, citiesByCountry, languages, parsed };
  }, [members, user]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (user && m.id === user.id) return false;
      const parts = m.location.split(",").map((s) => s.trim());
      const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const city = parts.length > 1 ? parts.slice(0, parts.length - 1).join(", ") : "";
      if (countryFilter !== "all" && country !== countryFilter) return false;
      if (cityFilter !== "all" && city !== cityFilter) return false;
      if (languageFilter !== "all" && (!m.questionnaire_languages || !m.questionnaire_languages.includes(languageFilter))) return false;
      return true;
    });
  }, [members, countryFilter, cityFilter, languageFilter, user]);

  return (
    <div className="min-h-screen flex flex-col font-sans-ui">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-12">
        <div className="flex flex-wrap justify-end gap-3 mb-8">
          <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setCityFilter("all"); }}>
            <SelectTrigger className="w-40 bg-white border-input font-sans-ui">
              <SelectValue placeholder={t("members.filterCountry")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-sans-ui">{t("members.allCountries")}</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c} className="font-sans-ui">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-40 bg-white border-input font-sans-ui">
              <SelectValue placeholder={t("members.filterCity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-sans-ui">{t("members.allCities")}</SelectItem>
              {(citiesByCountry[countryFilter] ?? []).map((c) => (
                <SelectItem key={c} value={c} className="font-sans-ui">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-40 bg-white border-input font-sans-ui">
              <SelectValue placeholder={t("members.filterLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-sans-ui">{t("members.allLanguages")}</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l} value={l} className="font-sans-ui">{l.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={t("members.searchByNumber")}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const num = searchNumber.trim();
                if (num) navigate(`/members/${num}`);
              }
            }}
            className="w-44 bg-white border-input font-sans-ui"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground italic">{t("members.noMatch")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((m) => {
              const contacted = contactedIds.has(m.id);
              return (
                <Link
                  to={`/members/${m.member_number}`}
                  key={m.id}
                  className={`flex flex-col items-center justify-center aspect-square border border-border bg-card transition-colors hover:border-[hsl(350,55%,35%)] ${contacted ? "opacity-40" : ""}`}
                >
                  <span className="text-4xl font-bold font-sans-ui">{m.member_number ?? "—"}</span>
                  <span className="text-base text-muted-foreground mt-1">{m.location}</span>
                  {m.questionnaire_languages && m.questionnaire_languages.length > 0 && (
                    <span className="text-xs text-muted-foreground mt-1 tracking-wider">
                      {m.questionnaire_languages.map((l) => l.toUpperCase()).join(" / ")}
                    </span>
                  )}
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
