import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Conv {
  id: string;
  member_a: string;
  member_b: string;
  status: "active" | "archived";
}

const Conversation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState<Conv | null>(null);
  const [other, setOther] = useState<{ id: string; display_name: string; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!c) { navigate("/messages"); return; }
      setConv(c as Conv);
      const otherId = c.member_a === user.id ? c.member_b : c.member_a;
      const { data: p } = await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", otherId).maybeSingle();
      setOther(p as any);
      const { data: ms } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages((ms as Message[]) ?? []);
    })();
  }, [id, user, navigate]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${id}` },
        (payload) => {
          setConv(payload.new as Conv);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onSend = async () => {
    if (!id || !user || !body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body: body.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
  };

  const onEnd = async () => {
    if (!id) return;
    const { error } = await supabase.rpc("archive_conversation", { _conv_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Conversation ended");
    navigate("/messages");
  };

  if (!conv || !other) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-16 text-center text-muted-foreground italic">Loading…</main>
      </div>
    );
  }

  const archived = conv.status === "archived";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-8 flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <Link to={`/members/${other.id}`} className="flex items-center gap-3 group font-sans">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={other.avatar_url ?? undefined} />
              <AvatarFallback>{other.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-display text-2xl group-hover:text-primary transition-colors">{other.display_name}</h2>
              {archived && <p className="text-xs text-muted-foreground italic">This correspondence has ended</p>}
            </div>
          </Link>
          {!archived && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">End conversation</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this correspondence?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The thread will be archived (still readable) and both of you will be free to begin new correspondences with other members. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onEnd}>End</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[40vh] max-h-[60vh]">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground italic mt-12">No messages yet. Say hello.</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`} style={{ borderRadius: "0.25rem" }}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className={`text-xs mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!archived && (
          <div className="border-t border-border pt-4 mt-4">
            <Textarea
              placeholder="Write a reply…"
              rows={3}
              value={body}
              maxLength={5000}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground italic">⌘/Ctrl + Enter to send</p>
              <Button onClick={onSend} disabled={sending || !body.trim()}>Send</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Conversation;