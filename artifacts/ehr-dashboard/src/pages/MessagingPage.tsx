import { useMemo, useRef, useState, useEffect } from "react";
import { Search, Send, MessageSquareText, Circle } from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import { STAFF_DIRECTORY, type StaffContact, type StaffRole } from "@/data/messagingSeed";
import { useMessaging } from "@/hooks/useMessaging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

const ROLE_FILTERS: (StaffRole | "All")[] = ["All", "Doctor", "Nurse", "Front Desk", "Lab", "Admin"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  if (isSameDay) return "Today";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MessagingPage() {
  const { messages, sendMessage } = useMessaging();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "All">("All");
  const [activeId, setActiveId] = useState<string>(STAFF_DIRECTORY[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastMessageByContact = useMemo(() => {
    const map = new Map<string, { text: string; timestamp: string }>();
    for (const m of messages) {
      const existing = map.get(m.contactId);
      if (!existing || new Date(m.timestamp) > new Date(existing.timestamp)) {
        map.set(m.contactId, { text: m.text, timestamp: m.timestamp });
      }
    }
    return map;
  }, [messages]);

  const filteredContacts = useMemo(() => {
    return STAFF_DIRECTORY.filter(c => {
      if (roleFilter !== "All" && c.role !== roleFilter) return false;
      if (search.trim() && !c.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const aLast = lastMessageByContact.get(a.id)?.timestamp ?? "";
      const bLast = lastMessageByContact.get(b.id)?.timestamp ?? "";
      return bLast.localeCompare(aLast);
    });
  }, [search, roleFilter, lastMessageByContact]);

  const activeContact: StaffContact | undefined = STAFF_DIRECTORY.find(c => c.id === activeId);

  const activeMessages = useMemo(
    () => messages.filter(m => m.contactId === activeId).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages, activeId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, activeId]);

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeId) return;
    sendMessage(activeId, text);
    setDraft("");
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <QueueAppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Contacts sidebar ─────────────────────────────────────────── */}
        <aside className="flex w-80 flex-none flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ACCENT}1A` }}>
                <MessageSquareText className="h-4 w-4" style={{ color: ACCENT }} />
              </div>
              <h1 className="text-lg font-semibold text-slate-800">Messaging</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm focus-visible:ring-[#4982CF]"
                data-testid="input-search-staff"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ROLE_FILTERS.map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  data-testid={`filter-role-${role.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    roleFilter === role
                      ? "bg-[#4982CF] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 && (
              <p className="p-4 text-center text-sm text-slate-400">No staff found.</p>
            )}
            {filteredContacts.map(contact => {
              const last = lastMessageByContact.get(contact.id);
              const isActive = contact.id === activeId;
              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveId(contact.id)}
                  data-testid={`button-contact-${contact.id}`}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-[#4982CF]/8" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="relative flex-none">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: contact.color }}
                    >
                      {contact.initials}
                    </div>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        contact.online ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm font-medium ${isActive ? "text-[#4982CF]" : "text-slate-800"}`}>
                        {contact.name}
                      </p>
                      {last && <span className="flex-none text-xs text-slate-400">{formatTime(last.timestamp)}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-slate-500">{last ? last.text : contact.department}</p>
                      <Badge
                        variant="outline"
                        className="flex-none border-slate-200 px-1.5 py-0 text-[10px] font-normal text-slate-500"
                      >
                        {contact.role}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ─── Chat panel ───────────────────────────────────────────────── */}
        <section className="flex flex-1 flex-col">
          {activeContact ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: activeContact.color }}
                >
                  {activeContact.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{activeContact.name}</p>
                  <p className="text-xs text-slate-500">
                    {activeContact.department} &middot; {activeContact.online ? (
                      <span className="text-emerald-600">Online</span>
                    ) : (
                      <span className="text-slate-400">Offline</span>
                    )}
                  </p>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {activeMessages.length === 0 && (
                  <p className="mt-10 text-center text-sm text-slate-400">
                    No messages yet. Say hello to {activeContact.name.split(" ")[0]}.
                  </p>
                )}
                {activeMessages.map((m, idx) => {
                  const showDay = idx === 0 || formatDay(activeMessages[idx - 1].timestamp) !== formatDay(m.timestamp);
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">
                            {formatDay(m.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            m.sender === "me"
                              ? "rounded-br-sm bg-[#4982CF] text-white"
                              : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <p>{m.text}</p>
                          <p className={`mt-1 text-right text-[10px] ${m.sender === "me" ? "text-white/70" : "text-slate-400"}`}>
                            {formatTime(m.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-6 py-4">
                <Input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activeContact.name.split(" ")[0]}...`}
                  className="h-10 flex-1 border-slate-200 bg-slate-50 text-sm focus-visible:ring-[#4982CF]"
                  data-testid="input-message-draft"
                />
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="h-10 gap-1.5 bg-[#4982CF] hover:bg-[#3d6fb3]"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Select a staff member to start messaging.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
