"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase.from("users").select("*").order("name");
    setUsers(data || []);
    setLoading(false);
  }

  function selectUser(userId: string) {
    localStorage.setItem("selectedUserId", userId);
    router.push(`/${userId}`);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-3xl font-bold tracking-tight">Siłownia</h1>
          <p className="text-muted-foreground">Wybierz użytkownika</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50 hover:border-primary/50"
                onClick={() => selectUser(user.id)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xl font-medium">{user.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}