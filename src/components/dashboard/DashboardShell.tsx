import { useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LogOut, Menu, X, ChevronLeft, ChevronRight, Lock, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  group?: string;
  locked?: boolean;
  requiredTier?: string;
}

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  logoUrl?: string;
  sidebarItems: SidebarItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  headerActions?: ReactNode;
}

const DashboardShell = ({
  title,
  subtitle,
  icon: TitleIcon,
  iconColor = "text-secondary",
  logoUrl,
  sidebarItems,
  activeTab,
  onTabChange,
  children,
  headerActions,
}: DashboardShellProps) => {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group items
  const groups: { label: string; items: SidebarItem[] }[] = [];
  const ungrouped: SidebarItem[] = [];
  sidebarItems.forEach((item) => {
    if (item.group) {
      const existing = groups.find((g) => g.label === item.group);
      if (existing) existing.items.push(item);
      else groups.push({ label: item.group, items: [item] });
    } else {
      ungrouped.push(item);
    }
  });

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[hsl(214,84%,56%)] flex items-center justify-center">
              <TitleIcon className="w-5 h-5 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{title}</h2>
              {subtitle && <p className="text-[10px] text-white/40 truncate">{subtitle}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {ungrouped.length > 0 && ungrouped.map((item) => (
          <SidebarButton
            key={item.id}
            item={item}
            active={activeTab === item.id}
            collapsed={collapsed}
            onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
          />
        ))}
        {groups.map((group) => (
          <div key={group.label} className="mt-4">
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-3 mb-1.5">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                collapsed={collapsed}
                onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-white/5 transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(213,73%,15%)] via-[hsl(213,60%,18%)] to-[hsl(213,73%,15%)] flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-[hsl(213,73%,15%)]/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300 shrink-0",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {renderSidebarContent()}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-[hsl(213,73%,15%)] border border-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors z-10 hidden md:flex"
          style={{ position: "sticky", bottom: 60 }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[hsl(213,73%,15%)]/95 backdrop-blur-xl shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/10 bg-white/95 dark:bg-[hsl(213,60%,18%)]/95 backdrop-blur-xl flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden md:flex items-center gap-2">
            <TitleIcon className={cn("w-5 h-5", iconColor)} />
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex-1" />
          {headerActions}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
        <footer className="py-3 px-4 text-center text-[11px] text-white/40 border-t border-white/10 bg-[hsl(213,73%,15%)]/40">
          MED-ALL AI SYSTEM MCHJ © 2018–2026. Barcha huquqlar himoyalangan.
        </footer>
      </div>
    </div>
  );
};

const SidebarButton = ({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group relative",
      active
        ? "bg-[hsl(214,84%,56%)] text-white shadow-lg shadow-[hsl(214,84%,56%)]/20"
        : "text-white/60 hover:text-white hover:bg-white/5",
      collapsed && "justify-center px-2"
    )}
  >
    <item.icon className="w-4 h-4 shrink-0" />
    {!collapsed && (
      <span className="truncate">{item.label}</span>
    )}
    {!collapsed && item.badge !== undefined && item.badge > 0 && (
      <span className={cn(
        "flex items-center justify-center text-[9px] font-bold rounded-full bg-red-500 text-white",
        "ml-auto w-5 h-5"
      )}>
        {item.badge}
      </span>
    )}
  </button>
);

export default DashboardShell;
