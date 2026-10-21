"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Workout } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { pl } from "date-fns/locale";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [userId, setUserId] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    if (userId) loadWorkouts();
  }, [userId, currentMonth]);

  async function loadWorkouts() {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });
    setWorkouts(data || []);
    setLoading(false);
  }

  const workoutDates = useMemo(() => {
    return new Set(workouts.map((w) => w.date));
  }, [workouts]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weekDays = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [workouts]);

  function goToWorkout(workoutId: string) {
    router.push(`/${userId}/trening/${workoutId}`);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kalendarz</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(currentMonth, "LLLL yyyy", { locale: pl })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-xs text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasWorkout = workoutDates.has(dateStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const dayWorkout = workouts.find((w) => w.date === dateStr);

          return (
            <button
              key={i}
              onClick={() => dayWorkout && goToWorkout(dayWorkout.id)}
              disabled={!dayWorkout}
              className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                !isCurrentMonth
                  ? "text-muted-foreground/30"
                  : isToday
                  ? "bg-primary text-primary-foreground font-bold"
                  : hasWorkout
                  ? "bg-primary/15 text-foreground font-medium hover:bg-primary/25"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {format(day, "d")}
              {hasWorkout && !isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ostatnie treningi</h2>
        {recentWorkouts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Brak treningów w tym miesiącu
          </p>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <Card
                key={w.id}
                className="cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border-border/50"
                onClick={() => goToWorkout(w.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {w.training_type}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Trening {w.training_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(w.date), "d MMMM yyyy", { locale: pl })}
                      </p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-muted-foreground">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => router.push(`/${userId}/nowy-trening`)}
        className="w-full h-14 text-lg font-semibold rounded-xl"
        size="lg"
      >
        + Nowy trening
      </Button>
    </div>
  );
}