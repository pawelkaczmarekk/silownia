"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    params.then((p) => {
      setUserId(p.userId);
      loadUser(p.userId);
    });
  }, [params]);

  async function loadUser(id: string) {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    if (data) {
      setUser(data);
      localStorage.setItem("selectedUserId", id);
    } else {
      router.push("/");
    }
  }

  function logout() {
    localStorage.removeItem("selectedUserId");
    router.push("/");
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    {
      href: `/${userId}`,
      label: "Dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      href: `/${userId}/statystyki`,
      label: "Statystyki",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
  ];

  const isWorkoutPage = pathname.includes("/trening/") || pathname.includes("/nowy-trening");

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.push(`/${userId}`)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {isWorkoutPage && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            )}
            <span className="text-primary font-bold">{user.name}</span>
          </button>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {!isWorkoutPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}