"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Map, LayoutDashboard, Settings, Plus, Globe, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIdentity } from "@/lib/identity";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/trips", icon: Map, label: "Trips" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { user, signOut } = useIdentity();
  const displayName = user?.name?.trim() || "Guest";
  const initial = (displayName[0] ?? "G").toUpperCase();
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-stone-100 dark:border-stone-800">
        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
          <Globe className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-semibold text-stone-800 dark:text-stone-100 tracking-tight">TerraTrip</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                  : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-amber-600" : "text-stone-400 dark:text-stone-500")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-stone-100 dark:border-stone-800">
        <Link
          href="/trips/new"
          onClick={onNavigate}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors justify-center"
        >
          <Plus className="h-4 w-4" />
          New Trip
        </Link>
      </div>

      <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-stone-700 dark:text-stone-200">{displayName}</p>
            <p className="truncate text-xs text-stone-400 dark:text-stone-500">{user ? "On this device" : "Not signed in"}</p>
          </div>
          {user && (
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 tracking-tight">TerraTrip</span>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-stone-900 border-r border-stone-100 dark:border-stone-800 flex-col z-40">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-72 max-w-[80%] h-full bg-white dark:bg-stone-900 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
