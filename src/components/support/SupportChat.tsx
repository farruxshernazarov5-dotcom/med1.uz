import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

type Props = { conversationId?: string; operator?: boolean; className?: string };

const SupportChat = ({ conversationId: providedId, operator = false, className }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState(providedId ?? "");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let activeId = providedId;
    if (!activeId && !operator) {
      const { data, error } = await supabase.from("support_conversations").select("id").eq("user_id", user.id).maybeSingle();
      if (error) toast({ title: "Suhbat yuklanmadi", description: error.message, variant: "destructive" });
      activeId = data?.id;
    }
    setConversationId(activeId ?? "");
    if (activeId) {
      const { data, error } = await supabase.from("support_messages").select("*").eq("conversation_id", activeId).order("created_at");
      if (error) toast({ title: "Xabarlar yuklanmadi", description: error.message, variant: "destructive" });
      setMessages(data ?? []);
    } else setMessages([]);
    setLoading(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [operator, providedId, toast, user]);

  useEffect(() => { void loadConversation(); }, [loadConversation]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`support:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const incoming = payload.new as SupportMessage;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);

  const send = async ({ text }: { text: string }) => {
    const content = text.trim();
    if (!content || !user || sending) return;
    setSending(true);
    let activeId = conversationId;
    if (!activeId && !operator) {
      const { data, error } = await supabase.from("support_conversations").insert({ user_id: user.id }).select("id").single();
      if (error) {
        toast({ title: "Suhbat ochilmadi", description: error.message, variant: "destructive" });
        setSending(false);
        return;
      }
      activeId = data.id;
      setConversationId(activeId);
    }
    if (!activeId) { setSending(false); return; }
    const optimistic: SupportMessage = { id: crypto.randomUUID(), conversation_id: activeId, sender_id: user.id, sender_role: operator ? "admin" : "patient", content, read_at: null, created_at: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    const { data, error } = await supabase.from("support_messages").insert({ conversation_id: activeId, sender_id: user.id, sender_role: operator ? "admin" : "patient", content }).select("*").single();
    if (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      toast({ title: "Xabar yuborilmadi", description: error.message, variant: "destructive" });
    } else {
      setMessages((current) => current.map((item) => item.id === optimistic.id ? data : item));
    }
    setSending(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <section className={`flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-card ${className ?? ""}`}>
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Headphones className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><h2 className="font-bold text-foreground">Med1 operatori</h2><p className="text-xs text-muted-foreground">{operator ? "Bemor murojaatiga jonli javob" : "Savolingizni yozing — operator javobi shu yerda ko‘rinadi"}</p></div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary"><span className="h-2 w-2 rounded-full bg-secondary" /> Onlayn</span>
      </header>
      <Conversation className="min-h-0">
        <ConversationContent className="gap-4 p-4 md:p-5">
          {loading ? <Shimmer className="text-sm">Suhbat yuklanmoqda...</Shimmer> : messages.length === 0 ? (
            <ConversationEmptyState title="Suhbatni boshlang" description="To‘lov, xizmatlar yoki kabinetingiz bo‘yicha savol yuboring." icon={<Headphones className="h-9 w-9" />} />
          ) : messages.map((message) => {
            const fromUser = operator ? message.sender_role === "admin" : message.sender_role === "patient";
            return <Message key={message.id} from={fromUser ? "user" : "assistant"}><MessageContent className={fromUser ? "bg-primary text-primary-foreground" : ""}><p className="whitespace-pre-wrap leading-relaxed">{message.content}</p><time className={`text-[10px] ${fromUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></MessageContent></Message>;
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3 md:p-4">
        <PromptInput onSubmit={send} className="rounded-lg">
          <PromptInputTextarea ref={inputRef} placeholder={operator ? "Javob yozing..." : "Xabaringizni yozing..."} disabled={sending} className="min-h-20" />
          <PromptInputFooter className="justify-between">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Yozishmalar himoyalangan</span>
            <PromptInputSubmit disabled={sending} status={sending ? "submitted" : undefined} aria-label="Xabarni yuborish" />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
};

export default SupportChat;