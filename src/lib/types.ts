export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  training_type: "A" | "B";
  order_index: number;
  is_cardio: boolean;
  suggested_sets: number | null;
  suggested_reps: string | null;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  training_type: "A" | "B";
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number | null;
  reps: string | null;
  weight_kg: number | null;
  time_min: number | null;
  speed: number | null;
  incline: number | null;
  notes: string | null;
}

export interface ExerciseWithResults extends Exercise {
  exercise_set: ExerciseSet | null;
  last_result: (ExerciseSet & { workout_date: string }) | null;
}

export interface WorkoutWithExercises extends Workout {
  exercises: ExerciseWithResults[];
}