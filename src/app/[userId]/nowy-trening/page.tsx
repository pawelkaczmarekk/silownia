"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function NewWorkoutPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [userId, setUserId] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const { data } = await supabase.from("exercises").select("*").order("training_type").order("order_index");
    setExercises(data || []);
  }

  const trainingAExercises = exercises.filter((e) => e.training_type === "A");
  const trainingBExercises = exercises.filter((e) => e.training_type === "B");

  async function createWorkout(trainingType: "A" | "B") {
    setSaving(true);
    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        date: selectedDate,
        training_type: trainingType,
      })
      .select()
      .single();

    if (data) {
      router.push(`/${userId}/trening/${data.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Data treningu</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full h-12 rounded-xl border border-border/50 bg-card px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Wybierz typ treningu</h2>

        <Card
          className="cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border-border/50 hover:border-primary/50"
          onClick={() => !saving && createWorkout("A")}
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl font-bold text-emerald-500">
                A
              </div>
              <div>
                <p className="font-semibold text-lg">Trening A</p>
                <p className="text-xs text-muted-foreground">Full Body</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trainingAExercises.map((e) => (
                <span
                  key={e.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {e.category}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border-border/50 hover:border-primary/50"
          onClick={() => !saving && createWorkout("B")}
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl font-bold text-blue-500">
                B
              </div>
              <div>
                <p className="font-semibold text-lg">Trening B</p>
                <p className="text-xs text-muted-foreground">Full Body</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trainingBExercises.map((e) => (
                <span
                  key={e.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {e.category}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {saving && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}