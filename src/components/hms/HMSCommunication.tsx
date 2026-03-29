import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Bell, MessageSquare, Send, X, Trash2, Inbox, Search,
  User, Phone, Mail, Clock, CheckCircle2, ChevronRight, Reply, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

interface Props { clinicId: string; }

const HMSCommunication = ({ clinicId }: Props) => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", priority: "normal", target_role: "all" });
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const [inboxSearch, setInboxSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [annRes, msgRes, contactRes] = await Promise.all([
      supabase.from("hms_announcements").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_messages").select("*").eq("clinic_id", clinicId).eq("channel", "general").order("created_at", { ascending: true }).limit(100),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setAnnouncements(annRes.data || []);
    setMessages(msgRes.data || []);
    setContactMessages(contactRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  useEffect(() => {
    const channel = supabase
      .channel('hms-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hms_messages', filter: `clinic_id=eq.${clinicId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleCreateAnnouncement = async () => {
    if (!annForm.title) { toast({ title: "Sarlavha majburiy!", variant: "destructive" }); return; }
    await supabase.from("hms_announcements").insert({ ...annForm, clinic_id: clinicId });
    toast({ title: "✅ E'lon yaratildi" });
    setShowAnnouncementForm(false);
    setAnnForm({ title: "", content: "", priority: "normal", target_role: "all" });
    fetchData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from("hms_announcements").delete().eq("id", id);
    toast({ title: "E'lon o'chirildi" }); fetchData();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from("hms_messages").insert({
      clinic_id: clinicId,
      sender_name: profile?.full_name || "Admin",
      message: newMessage.trim(),
      channel: "general",
    });
    setNewMessage("");
  };

  const handleUpdateContactStatus = async (id: string, status: string) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` });
    fetchData();
  };

  const priorityColors: Record<string, string> = {
    normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    important: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  };
  const priorityLabels: Record<string, string> = { normal: "Oddiy", important: "Muhim", urgent: "Shoshilinch" };

  const filteredContacts = useMemo(() =>
    contactMessages.filter(c =>
      c.full_name?.toLowerCase().includes(inboxSearch.toLowerCase()) ||
      c.subject?.toLowerCase().includes(inboxSearch.toLowerCase()) ||
      c.phone?.includes(inboxSearch)
    ), [contactMessages, inboxSearch]);

  const inboxStats = useMemo(() => ({
    total: contactMessages.length,
    new: contactMessages.filter(c => c.status === "new").length,
    inProgress: contactMessages.filter(c => c.status === "in_progress").length,
    resolved: contactMessages.filter(c => c.status === "resolved").length,
  }), [contactMessages]);

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">Aloqa markazi</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="inbox"><Inbox className="w-3.5 h-3.5 mr-1" />So'rovlar {inboxStats.new > 0 && <Badge className="ml-1 bg-red-500 text-white text-[9px] h-4 px-1">{inboxStats.new}</Badge>}</TabsTrigger>
          <TabsTrigger value="announcements"><Bell className="w-3.5 h-3.5 mr-1" />E'lonlar</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-3.5 h-3.5 mr-1" />Chat</TabsTrigger>
        </TabsList>

        {/* INBOX */}
        <TabsContent value="inbox">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Jami", value: inboxStats.total, color: "text-primary" },
              { label: "Yangi", value: inboxStats.new, color: "text-red-500" },
              { label: "Jarayonda", value: inboxStats.inProgress, color: "text-blue-500" },
              { label: "Yopilgan", value: inboxStats.resolved, color: "text-green-500" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3">
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Murojaat qidirish..." value={inboxSearch} onChange={e => setInboxSearch(e.target.value)} className="pl-9" />
          </div>

          {selectedContact ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="mb-3">← Orqaga</Button>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-foreground">{selectedContact.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedContact.full_name}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedContact.phone}</span>
                    {selectedContact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedContact.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {selectedContact.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => { handleUpdateContactStatus(selectedContact.id, "resolved"); setSelectedContact({ ...selectedContact, status: "resolved" }); }}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Yopish
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedContact.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(selectedContact.created_at).toLocaleString("uz")}</p>
              </div>
              {selectedContact.admin_notes && (
                <div className="bg-primary/5 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-primary mb-1">Admin izohi:</p>
                  <p className="text-sm text-foreground">{selectedContact.admin_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map(c => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { setSelectedContact(c); if (c.status === "new") handleUpdateContactStatus(c.id, "in_progress"); }}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", c.status === "new" ? "bg-red-500" : c.status === "in_progress" ? "bg-blue-500" : "bg-green-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{c.full_name} • {c.phone} • {new Date(c.created_at).toLocaleDateString("uz")}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.message_type}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
              {filteredContacts.length === 0 && <p className="text-center py-8 text-muted-foreground">Murojaatlar topilmadi</p>}
            </div>
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announcements">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">E'lonlar ({announcements.length})</h3>
            <Button size="sm" onClick={() => setShowAnnouncementForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi e'lon</Button>
          </div>

          {showAnnouncementForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Sarlavha *" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={annForm.priority} onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}>
                  <option value="normal">Oddiy</option>
                  <option value="important">Muhim</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
                <textarea placeholder="Mazmuni" value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} className="md:col-span-2 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={annForm.target_role} onChange={e => setAnnForm({ ...annForm, target_role: e.target.value })}>
                  <option value="all">Barcha xodimlar</option>
                  <option value="doctor">Shifokorlar</option>
                  <option value="nurse">Hamshiralar</option>
                  <option value="lab_tech">Laborantlar</option>
                  <option value="pharmacist">Farmatsevtlar</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreateAnnouncement}>E'lon berish</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAnnouncementForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {announcements.map(ann => (
              <div key={ann.id} className={cn("bg-card rounded-xl border p-4", ann.priority === "urgent" ? "border-red-200 dark:border-red-900/50" : "border-border")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{ann.title}</h4>
                      <Badge className={cn("text-[10px]", priorityColors[ann.priority])}>{priorityLabels[ann.priority]}</Badge>
                    </div>
                    {ann.content && <p className="text-xs text-muted-foreground">{ann.content}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(ann.created_at).toLocaleString("uz")}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAnnouncement(ann.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center py-8 text-muted-foreground">E'lonlar yo'q</p>}
          </div>
        </TabsContent>

        {/* CHAT */}
        <TabsContent value="chat">
          <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ height: "500px" }}>
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <h3 className="font-heading font-bold text-foreground text-sm">Umumiy chat</h3>
              <p className="text-xs text-muted-foreground">Barcha xodimlar uchun</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: "390px" }}>
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.sender_name === (profile?.full_name || "Admin") ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-xl px-3 py-2", msg.sender_name === (profile?.full_name || "Admin") ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">{msg.sender_name}</p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-[9px] opacity-50 mt-0.5">{new Date(msg.created_at).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
              {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">Xabarlar yo'q. Birinchi xabarni yozing!</p>}
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <Input placeholder="Xabar yozing..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }} className="flex-1" />
              <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSCommunication;
