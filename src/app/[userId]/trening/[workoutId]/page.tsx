"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Exercise, Workout, ExerciseSet, ExerciseWithResults } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import ExerciseFormDialog from "@/components/exercise-form-dialog";

export default function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ userId: string; workoutId: string }>;
}) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithResults | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ userId: string; workoutId: string } | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams) loadWorkout();
  }, [resolvedParams]);

  async function loadWorkout() {
    if (!resolvedParams) return;
    
    const { data: workoutData } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", resolvedParams.workoutId)
      .single();
    
    if (!workoutData) {
      router.push(`/${resolvedParams.userId}`);
      return;
    }
    setWorkout(workoutData);

    const { data: exercisesData } = await supabase
      .from("exercises")
      .select("*")
      .eq("training_type", workoutData.training_type)
      .order("order_index");

    if (!exercisesData) {
      setLoading(false);
      return;
    }

    const { data: setsData } = await supabase
      .from("exercise_sets")
      .select("*")
      .eq("workout_id", resolvedParams.workoutId);

    const { data: lastResultsData } = await supabase
      .from("exercise_sets")
      .select("*, workouts!inner(date)")
      .in("exercise_id", exercisesData.map((e) => e.id))
      .eq("workouts.user_id", resolvedParams.userId);

    const exercisesWithResults: ExerciseWithResults[] = exercisesData.map((exercise) => {
      const exerciseSet = setsData?.find((s) => s.exercise_id === exercise.id);
      const lastResult = lastResultsData
        ?.filter((lr) => lr.exercise_id === exercise.id && lr.workout_id !== resolvedParams.workoutId)
        .sort((a, b) => b.workouts.date.localeCompare(a.workouts.date))[0];

      return {
        ...exercise,
        exercise_set: exerciseSet || null,
        last_result: lastResult ? { ...lastResult, workout_date: lastResult.workouts.date } : null,
      };
    });

    setExercises(exercisesWithResults);
    setLoading(false);
  }

  function openExerciseForm(exercise: ExerciseWithResults) {
    setSelectedExercise(exercise);
    setDialogOpen(true);
  }

  async function saveExerciseResult(data: {
    sets?: number;
    reps?: string;
    weight_kg?: number;
    time_min?: number;
    speed?: number;
    incline?: number;
    notes?: string;
  }) {
    if (!selectedExercise || !resolvedParams) return;
    
    setSaving(true);
    
    const existingSet = selectedExercise.exercise_set;
    
    if (existingSet) {
      await supabase
        .from("exercise_sets")
        .update(data)
        .eq("id", existingSet.id);
    } else {
      await supabase.from("exercise_sets").insert({
        workout_id: resolvedParams.workoutId,
        exercise_id: selectedExercise.id,
        ...data,
      });
    }

    await loadWorkout();
    setDialogOpen(false);
    setSelectedExercise(null);
    setSaving(false);
  }

  const completedCount = exercises.filter((e) => e.exercise_set).length;
  const progress = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trening {workout.training_type}</h1>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(workout.date), "d MMMM yyyy", { locale: pl })}
          </p>
        </div>
        <Badge variant={progress === 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
          {completedCount}/{exercises.length}
        </Badge>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {exercises.map((exercise) => {
          const hasResult = !!exercise.exercise_set;
          const lastResult = exercise.last_result;

          return (
            <Card
              key={exercise.id}
              className={`cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                hasResult ? "border-primary/30 bg-primary/5" : "border-border/50"
              }`}
              onClick={() => openExerciseForm(exercise)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {exercise.category}
                      </span>
                      {hasResult && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="font-medium text-sm mt-0.5">{exercise.name}</p>
                    
                    {exercise.exercise_set && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {exercise.is_cardio ? (
                          <span>
                            {exercise.exercise_set.time_min} min, {exercise.exercise_set.speed} km/h
                            {exercise.exercise_set.incline && `, nachylenie ${exercise.exercise_set.incline}%`}
                          </span>
                        ) : (
                          <span>
                            {exercise.exercise_set.sets} serie, {exercise.exercise_set.reps} powt.
                            {exercise.exercise_set.weight_kg && `, ${exercise.exercise_set.weight_kg} kg`}
                          </span>
                        )}
                      </div>
                    )}

                    {!exercise.exercise_set && lastResult && (
                      <div className="mt-2 text-xs text-muted-foreground/60">
                        Ostatnio ({format(parseISO(lastResult.workout_date), "d MMM")}):{" "}
                        {exercise.is_cardio ? (
                          <span>
                            {lastResult.time_min} min, {lastResult.speed} km/h
                          </span>
                        ) : (
                          <span>
                            {lastResult.sets}x{lastResult.reps} {lastResult.weight_kg}kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {progress > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto">
          <Button
            onClick={() => router.push(`/${resolvedParams?.userId}`)}
            className="w-full h-12 rounded-xl"
            size="lg"
          >
            Zakończ trening
          </Button>
        </div>
      )}

      <ExerciseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exercise={selectedExercise}
        onSave={saveExerciseResult}
        saving={saving}
      />
    </div>
  );
}