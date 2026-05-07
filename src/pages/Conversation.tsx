import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
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
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [conv, setConv] = useState<Conv | null>(null);
  const [other, setOther] = useState<{ id: string; member_number: number | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);


  const myCount = messages.filter((m) => m.sender_id === user?.id).length;
  const atLimit = myCount >= 10;
  const isInitialMessage = messages.length === 0;
  const minLength = isInitialMessage ? 34 : 5;
  const bodyValid = body.trim().length >= minLength;
  const remaining = 10 - myCount;

  useEffect(() => {
    if (!id || !user) { navigate("/login"); return; }
    (async () => {
      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!c) { navigate("/messages"); return; }
      setConv(c as Conv);
      const otherId = c.member_a === user.id ? c.member_b : c.member_a;
      const { data: p } = await supabase.from("profiles").select("id, member_number").eq("id", otherId).maybeSingle();
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
    if (!id || !user || !body.trim() || body.trim().length < minLength || atLimit) return;
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

  if (!user || !conv || !other) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-16 text-center text-muted-foreground italic">Loading…</main>
        <Footer />
      </div>
    );
  }

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const iAmLastSender = lastMessage?.sender_id === user?.id;
  const hoursSinceLastMessage = lastMessage ? (now - new Date(lastMessage.created_at).getTime()) / (1000 * 60 * 60) : null;
  const canEnd = iAmLastSender && hoursSinceLastMessage !== null && hoursSinceLastMessage > 34;

  const remainingMs = lastMessage ? Math.max(0, 34 * 60 * 60 * 1000 - (now - new Date(lastMessage.created_at).getTime())) : 0;
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  const archived = conv?.status === "archived";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-2xl py-8 flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <Link to={`/members/${other.member_number}`} className="font-sans-ui text-4xl font-bold hover:text-[hsl(350,55%,35%)] transition-colors">
            {other.member_number ?? "—"}
          </Link>
          {archived ? (
            <p className="text-base text-muted-foreground italic">{t("conversation.ended")}</p>
          ) : canEnd ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="hover:!bg-[hsl(350,55%,35%)] hover:!text-white">{t("conversation.end")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-sans-ui">{t("conversation.endConfirm")}</AlertDialogTitle>
                  <AlertDialogDescription className="font-sans-ui">
                    {t("conversation.endDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-sans-ui hover:!bg-[hsl(350,55%,35%)] hover:!text-white">{t("conversation.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={onEnd} className="font-sans-ui bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,35%)]">{t("conversation.end")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : messages.length > 0 && !iAmLastSender ? (
            <p className="text-base text-muted-foreground italic">{t("conversation.noGhosting")}</p>
          ) : messages.length > 0 && iAmLastSender ? (
            <p className="text-base text-muted-foreground italic">
              {t("conversation.waitForReply")} {remainingHours}h {remainingMinutes}m
            </p>
          ) : null}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[40vh] max-h-[60vh]">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground italic mt-12">{t("conversation.noMessages")}</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              const num = mine ? (profile?.member_number ?? "—") : (other.member_number ?? "—");
              return (
                <div key={m.id} className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <Link to={`/members/${other.member_number}`} className="flex-shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-base font-bold font-sans-ui hover:border-foreground transition-colors">
                      {num}
                    </Link>
                  )}
                  <div className={`max-w-[75%] px-4 py-3 ${mine ? "bg-[hsl(350,55%,35%)] text-white" : "bg-secondary text-secondary-foreground"}`} style={{ borderRadius: "0.25rem" }}>
                    <p className="text-lg whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className={`text-base mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>
{(() => { const d = new Date(m.created_at); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${p(d.getHours())}:${p(d.getMinutes())}`; })()}
                    </p>
                  </div>
                  {mine && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-base font-bold font-sans-ui">
                      {num}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!archived && (
          <div className="border-t border-border pt-4 mt-4">
            {atLimit ? (
              <p className="text-center text-muted-foreground italic py-4">{t("conversation.limitReached")}</p>
            ) : (
              <>
                <Textarea
                  placeholder={t("conversation.placeholder")}
                  rows={3}
                  value={body}
                  maxLength={5000}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
                  }}
                  className="bg-white border-input text-lg"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-base text-muted-foreground font-sans-ui">{remaining} {t("conversation.messagesLeft")}</span>
                  {!bodyValid && body.length > 0 && (
                    <span className="text-base text-destructive font-sans-ui">{messages.length === 0 ? t("conversation.initialMinLength") : t("conversation.minLength")}</span>
                  )}
                </div>
                <div className="flex justify-center mt-3">
                  <Button onClick={onSend} disabled={sending || !bodyValid || atLimit} className="bg-[hsl(350,55%,35%)] text-white hover:bg-[hsl(350,55%,30%)]">{t("conversation.send")}</Button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Conversation;