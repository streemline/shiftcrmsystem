import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  Clock,
  BarChart2,
  CalendarDays,
  CheckSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Wrench,
  Package,
  ClipboardList,
  FileText,
  MapPin,
  Sofa
} from "lucide-react";
import NotificationBell from "./components/shared/NotificationBell";

const NAV_ITEMS = [
  { label: "dashboard",   icon: LayoutDashboard, page: "Dashboard" },
  { label: "records",    icon: Clock,           page: "Records" },
  { label: "analytics",icon: BarChart2,        page: "Analytics" },
  { label: "calendar", icon: CalendarDays,    page: "Calendar" },
  { label: "tasks",    icon: CheckSquare,     page: "Tasks" },
  { label: "furniture",    icon: Sofa,            page: "Furniture" },
  { label: "profile",   icon: User,            page: "Profile" },
];

const ADMIN_ITEMS = [
  { label: "employees",   icon: Settings,       page: "AdminUsers" },
  { label: "schedule",       icon: CalendarDays,   page: "AdminSchedule" },
  { label: "tasks_admin",icon: ClipboardList,  page: "AdminTasks" },
  { label: "materials",   icon: Package,         page: "Materials" },
  { label: "reports",      icon: FileText,        page: "Reports" },
  { label: "work_sites",    icon: MapPin,          page: "AdminSites" },
  { label: "settings",   icon: Wrench,          page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  function handleLogout() {
    base44.auth.logout();
  }

  function isActivePage(pageName) {
    return currentPageName === pageName;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <style>{`
        :root {
          --bg-main: #0A0A0A;
          --bg-card: #1A1A1A;
          --bg-border: #2A2A2A;
          --accent-red: #D32F2F;
          --accent-green: #388E3C;
          --text-primary: #FFFFFF;
          --text-secondary: #9E9E9E;
        }
        * { box-sizing: border-box; }
        body { background: #0A0A0A; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1A1A1A; }
        ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
      `}</style>

      {/* Sidebar — только на десктопе */}
      <aside className="hidden md:flex flex-col w-60 bg-[#111111] border-r border-[#2A2A2A] min-h-screen fixed top-0 left-0 z-40">
        {/* Логотип */}
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#D32F2F] rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">WorkTime</span>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Основная навигация */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(function(item) {
            const Icon = item.icon;
            const active = isActivePage(item.page);
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[#D32F2F] text-white"
                    : "text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-white"
                }`}
              >
                <Icon size={18} />
                {t(item.label)}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs font-semibold text-[#555] uppercase tracking-widest">
                  {t("management")}
                </span>
              </div>
              {ADMIN_ITEMS.map(function(item) {
                const Icon = item.icon;
                const active = isActivePage(item.page);
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-[#D32F2F] text-white"
                        : "text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {t(item.label)}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Профиль внизу */}
        <div className="px-3 pb-4 border-t border-[#2A2A2A] pt-4">
          {user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-[#9E9E9E] truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-red-400 transition-all w-full"
          >
            <LogOut size={18} />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Мобильный хедер */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b border-[#2A2A2A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#D32F2F] rounded-lg flex items-center justify-center">
            <Clock size={14} className="text-white" />
          </div>
          <span className="font-bold text-base">WorkTime</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#9E9E9E] hover:text-white"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Мобильное меню (drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#111111] border-r border-[#2A2A2A] pt-16 overflow-y-auto"
            onClick={function(e) { e.stopPropagation(); }}
          >
            <nav className="px-3 py-4 space-y-1">
              {NAV_ITEMS.map(function(item) {
                const Icon = item.icon;
                const active = isActivePage(item.page);
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-[#D32F2F] text-white"
                        : "text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {t(item.label)}
                    {active && <ChevronRight size={16} className="ml-auto" />}
                  </Link>
                );
              })}

              {isAdmin && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-[#555] uppercase tracking-widest">
                      {t("management")}
                    </span>
                  </div>
                  {ADMIN_ITEMS.map(function(item) {
                    const Icon = item.icon;
                    const active = isActivePage(item.page);
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? "bg-[#D32F2F] text-white"
                            : "text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-white"
                        }`}
                      >
                        <Icon size={18} />
                        {t(item.label)}
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="pt-4 border-t border-[#2A2A2A]">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-red-400 transition-all w-full"
                >
                  <LogOut size={18} />
                  {t("logout")}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <main className="flex-1 md:ml-60 min-h-screen">
        <div className="pt-14 md:pt-0 min-h-screen">
          {children}
        </div>
      </main>

      {/* Мобильная нижняя навигация */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111111] border-t border-[#2A2A2A] flex">
        {NAV_ITEMS.slice(0, 5).map(function(item) {
          const Icon = item.icon;
          const active = isActivePage(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                active ? "text-[#D32F2F]" : "text-[#555]"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
