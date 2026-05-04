import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PROUST_QUESTIONS } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileFull {
  id: string;
  display_name: string;
  avatar_url: string | null;
  language: string;
  location: string;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hasActive, setHasActive] = useState(false);
  const [activeWith, setActiveWith] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: prof }, { data: ans }, { data: convs }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, language, location").eq("id", id).maybeSingle(),
        supabase.from("questionnaire_answers").select("question_id, answer").eq("user_id", id),
        supabase.from("conversations").select("id, member_a, member_b").eq("status", "active"),
      ]);
      setProfile((prof as ProfileFull) ?? null);
      const map: Record<number, string> = {};
      (ans ?? []).forEach((a: any) => (map[a.question_id] = a.answer));
      setAnswers(map);

      const myActive = (convs ?? []).find((c: any) => c.member_a === user?.id || c.member_b === user?.id);
      setHasActive(!!myActive);
      if (myActive) {
        const other = myActive.member_a === user?.id ? myActive.member_b : myActive.member_a;
        setActiveWith(other);
      }
    })();
  }, [id, user?.id]);

  const isMe = user?.id === id;
  const canMessage = !isMe && (!hasActive || activeWith === id);

  const onMessage = async () => {
    if (!id) return;
    if (hasActive && activeWith === id) {
      // Open existing conversation: find it
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("status", "active")
        .or(`and(member_a.eq.${user?.id},member_b.eq.${id}),and(member_a.eq.${id},member_b.eq.${user?.id})`)
        .maybeSingle();
      if (data) navigate(`/messages/${data.id}`);
      return;
    }
    setStarting(true);
    const { data, error } = await supabase.rpc("start_conversation", { _other_user: id });
    setStarting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/messages/${data}`);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-16 text-center text-muted-foreground italic">
          Loading…
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-16">
        <div className="flex flex-col items-center text-center mb-12">
          <Avatar className="h-24 w-24 border-2 border-border mb-5">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="font-display text-3xl">{profile.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="font-display text-5xl mb-2">{profile.display_name}</h1>
          <p className="text-muted-foreground italic mb-6">{profile.location} · {profile.language}</p>
          {!isMe && (
            canMessage ? (
              <Button onClick={onMessage} disabled={starting}>
                {hasActive && activeWith === id ? "Open conversation" : "Begin a correspondence"}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button disabled>Begin a correspondence</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">End your current conversation in <Link to="/messages" className="underline">Messages</Link> to write to someone new.</p>
                </TooltipContent>
              </Tooltip>
            )
          )}
          {isMe && (
            <Button asChild variant="outline"><Link to="/settings">Edit your answers</Link></Button>
          )}
        </div>

        <div className="ornament text-center mb-12">
          <span className="font-display italic text-xl">The Questionnaire</span>
        </div>

        <div className="space-y-10">
          {PROUST_QUESTIONS.map((q) => (
            <div key={q.id}>
              <h3 className="font-display text-xl mb-2">
                <span className="text-primary mr-2">{q.id}.</span>{q.text}
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                {answers[q.id] || <span className="text-muted-foreground italic">— no answer —</span>}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;