"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Exercise, ExerciseSet } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressData {
  date: string;
  weight: number;
  displayDate: string;
}

export default function StatisticsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [userId, setUserId] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const { data } = await supabase.from("exercises").select("*").order("name");
    setExercises(data || []);
    if (data && data.length > 0) {
      setSelectedExerciseId(data[0].id);
    }
  }

  useEffect(() => {
    if (selectedExerciseId && userId) {
      loadProgress();
    }
  }, [selectedExerciseId, userId]);

  async function loadProgress() {
    setLoading(true);
    
    const { data: exercise } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", selectedExerciseId)
      .single();

    if (!exercise) {
      setLoading(false);
      return;
    }

    const { data: sets } = await supabase
      .from("exercise_sets")
      .select("*, workouts!inner(date, user_id)")
      .eq("exercise_id", selectedExerciseId)
      .eq("workouts.user_id", userId)
      .not("weight_kg", "is", null)
      .order("workouts.date", { ascending: true });

    if (sets) {
      const chartData = sets.map((s) => ({
        date: s.workouts.date,
        weight: Number(s.weight_kg),
        displayDate: format(parseISO(s.workouts.date), "d MMM", { locale: pl }),
      }));
      setProgressData(chartData);
    } else {
      setProgressData([]);
    }

    setLoading(false);
  }

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  const stats = useMemo(() => {
    if (progressData.length < 2) return null;
    const first = progressData[0].weight;
    const last = progressData[progressData.length - 1].weight;
    const diff = last - first;
    return {
      start: first,
      end: last,
      diff,
      percent: Math.round((diff / first) * 100),
    };
  }, [progressData]);

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Wybierz ćwiczenie</label>
        <Select value={selectedExerciseId} onValueChange={(v) => v && setSelectedExerciseId(v)}>
          <SelectTrigger className="h-12 rounded-xl border-border/50">
            <SelectValue placeholder="Wybierz ćwiczenie" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} ({e.training_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedExercise?.is_cardio ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Statystyki dostępne dla ćwiczeń siłowych</p>
          </CardContent>
        </Card>
      ) : progressData.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Brak danych dla tego ćwiczenia</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progres ciężaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="displayDate"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="text-xl font-bold mt-1">{stats.start} kg</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">Teraz</p>
                  <p className="text-xl font-bold mt-1">{stats.end} kg</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">Zmiana</p>
                  <p className={`text-xl font-bold mt-1 ${stats.diff > 0 ? "text-emerald-500" : stats.diff < 0 ? "text-red-500" : ""}`}>
                    {stats.diff > 0 ? "+" : ""}{stats.diff} kg
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...progressData].reverse().slice(0, 10).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{item.displayDate}</span>
                    <span className="font-semibold">{item.weight} kg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}