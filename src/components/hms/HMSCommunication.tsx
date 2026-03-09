import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Bell, MessageSquare, Send, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

interface Props { clinicId: string; }

const HMSCommunication = ({ clinicId }: Props) => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", priority: "normal", target_role: "all" });
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [annRes, msgRes] = await Promise.all([
      supabase.from("hms_announcements").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_messages").select("*").eq("clinic_id", clinicId).eq("channel", "general").order("created_at", { ascending: true }).limit(100),
    ]);
    setAnnouncements(annRes.data || []);
    setMessages(msgRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  // Realtime chat subscription
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

  const priorityColors: Record<string, string> = { normal: "bg-blue-100 text-blue-800", important: "bg-yellow-100 text-yellow-800", urgent: "bg-red-100 text-red-800" };
  const priorityLabels: Record<string, string> = { normal: "Oddiy", important: "Muhim", urgent: "Shoshilinch" };

  return (
    <div>
      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6">
          <TabsTrigger value="announcements"><Bell className="w-4 h-4 mr-1" /> E'lonlar</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-1" /> Chat</TabsTrigger>
        </TabsList>

        {/* Announcements */}
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
              <div key={ann.id} className={cn("bg-card rounded-xl border p-4", ann.priority === "urgent" ? "border-red-200" : "border-border")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{ann.title}</h4>
                      <Badge className={cn("text-[10px]", priorityColors[ann.priority])}>{priorityLabels[ann.priority]}</Badge>
                    </div>
                    {ann.content && <p className="text-xs text-muted-foreground">{ann.content}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(ann.created_at).toLocaleString("uz")}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAnnouncement(ann.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center py-8 text-muted-foreground">E'lonlar yo'q</p>}
          </div>
        </TabsContent>

        {/* Chat */}
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
