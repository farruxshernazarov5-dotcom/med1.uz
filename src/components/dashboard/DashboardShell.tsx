import { useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LogOut, Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  group?: string;
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
      <div className="p-4 border-b border-sidebar-border/30">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-sidebar-border/40" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <TitleIcon className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-sidebar-foreground truncate">{title}</h2>
              {subtitle && <p className="text-[10px] text-sidebar-foreground/50 truncate">{subtitle}</p>}
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
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/30 font-semibold px-3 mb-1.5">
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
      <div className="p-3 border-t border-sidebar-border/30">
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all",
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
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar-background border-r border-sidebar-border/20 transition-all duration-300 shrink-0",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {renderSidebarContent()}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-sidebar-background border border-sidebar-border/30 flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors z-10 hidden md:flex"
          style={{ position: "sticky", bottom: 60 }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-sidebar-background shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
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
      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
      active
        ? "bg-gradient-to-r from-secondary/20 to-accent/10 text-white shadow-sm"
        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5",
      collapsed && "justify-center px-2"
    )}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-secondary rounded-r-full" />
    )}
    <item.icon className={cn("w-4 h-4 shrink-0", active && "text-secondary")} />
    {!collapsed && (
      <span className="truncate">{item.label}</span>
    )}
    {!collapsed && item.badge !== undefined && item.badge > 0 && (
      <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
        {item.badge}
      </span>
    )}
  </button>
);

export default DashboardShell;
