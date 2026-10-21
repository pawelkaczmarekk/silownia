"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExerciseWithResults } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

interface ExerciseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ExerciseWithResults | null;
  onSave: (data: {
    sets?: number;
    reps?: string;
    weight_kg?: number;
    time_min?: number;
    speed?: number;
    incline?: number;
    notes?: string;
  }) => void;
  saving: boolean;
}

export default function ExerciseFormDialog({
  open,
  onOpenChange,
  exercise,
  onSave,
  saving,
}: ExerciseFormDialogProps) {
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [time, setTime] = useState("");
  const [speed, setSpeed] = useState("");
  const [incline, setIncline] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (exercise) {
      if (exercise.is_cardio) {
        setTime(exercise.exercise_set?.time_min?.toString() || "");
        setSpeed(exercise.exercise_set?.speed?.toString() || "");
        setIncline(exercise.exercise_set?.incline?.toString() || "");
      } else {
        setSets(exercise.exercise_set?.sets?.toString() || exercise.suggested_sets?.toString() || "");
        setReps(exercise.exercise_set?.reps || exercise.suggested_reps || "");
        setWeight(exercise.exercise_set?.weight_kg?.toString() || "");
      }
      setNotes(exercise.exercise_set?.notes || "");
    }
  }, [exercise]);

  function handleSubmit() {
    if (exercise?.is_cardio) {
      onSave({
        time_min: time ? Number(time) : undefined,
        speed: speed ? Number(speed) : undefined,
        incline: incline ? Number(incline) : undefined,
        notes: notes || undefined,
      });
    } else {
      onSave({
        sets: sets ? Number(sets) : undefined,
        reps: reps || undefined,
        weight_kg: weight ? Number(weight) : undefined,
        notes: notes || undefined,
      });
    }
  }

  if (!exercise) return null;

  const lastResult = exercise.last_result;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">{exercise.name}</DialogTitle>
        </DialogHeader>

        {lastResult && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">
              Ostatni wynik ({format(parseISO(lastResult.workout_date), "d MMM yyyy", { locale: pl })}):
            </p>
            {exercise.is_cardio ? (
              <p className="font-medium">
                {lastResult.time_min} min, {lastResult.speed} km/h
                {lastResult.incline && `, nachylenie ${lastResult.incline}%`}
              </p>
            ) : (
              <p className="font-medium">
                {lastResult.sets} serie × {lastResult.reps} powt., {lastResult.weight_kg} kg
              </p>
            )}
          </div>
        )}

        <div className="space-y-4 pt-2">
          {exercise.is_cardio ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="time">Czas (min)</Label>
                  <Input
                    id="time"
                    type="number"
                    inputMode="numeric"
                    placeholder="25"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="speed">Prędkość (km/h)</Label>
                  <Input
                    id="speed"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="8"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="incline">Nachylenie (%)</Label>
                <Input
                  id="incline"
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="0"
                  value={incline}
                  onChange={(e) => setIncline(e.target.value)}
                  className="h-11"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sets">Serie</Label>
                  <Input
                    id="sets"
                    type="number"
                    inputMode="numeric"
                    placeholder="3"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reps">Powt.</Label>
                  <Input
                    id="reps"
                    type="text"
                    inputMode="text"
                    placeholder="8-10"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Kg</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="60"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notatki (opcjonalnie)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Uwagi do ćwiczenia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11"
            disabled={saving}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-11"
            disabled={saving}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              "Zapisz"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}