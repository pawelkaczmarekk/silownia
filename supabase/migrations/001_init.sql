-- Użytkownicy
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ćwiczenia
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('A', 'B')),
  order_index INTEGER NOT NULL,
  is_cardio BOOLEAN DEFAULT FALSE,
  suggested_sets INTEGER,
  suggested_reps TEXT
);

-- Treningi
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Serie/wyniki
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  sets INTEGER,
  reps TEXT,
  weight_kg DECIMAL(5,1),
  time_min INTEGER,
  speed DECIMAL(3,1),
  incline DECIMAL(3,1),
  notes TEXT,
  UNIQUE(workout_id, exercise_id)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_id ON exercise_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_training_type ON exercises(training_type);

-- RLS wyłączone (brak autoryzacji)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Zezwól na wszystko dla anon (brak haseł)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

-- Seed: Użytkownicy
INSERT INTO users (name) VALUES ('Paweł'), ('Dawid');

-- Seed: Ćwiczenia Trening A
INSERT INTO exercises (name, category, training_type, order_index, is_cardio, suggested_sets, suggested_reps) VALUES
  ('Przysiad ze sztangą na plecach', 'Nogi', 'A', 1, false, 3, '8-10'),
  ('Wyciskanie sztangi/hantli na ławce skośnej', 'Klatka piersiowa', 'A', 2, false, 3, '8-10'),
  ('Podciąganie na drążku / Ściąganie drążka', 'Plecy', 'A', 3, false, 3, '10-12'),
  ('Wyciskanie hantli nad głowę', 'Barki', 'A', 4, false, 3, '10'),
  ('Cardio', 'Cardio', 'A', 5, true, null, null);

-- Seed: Ćwiczenia Trening B
INSERT INTO exercises (name, category, training_type, order_index, is_cardio, suggested_sets, suggested_reps) VALUES
  ('Rumuński martwy ciąg', 'Nogi / Tył ud', 'B', 1, false, 3, '8-10'),
  ('Wiosłowanie sztangą / Maszyna', 'Plecy', 'B', 2, false, 3, '8-10'),
  ('Wyciskanie na maszynie / Pompki na poręczach', 'Klatka piersiowa', 'B', 3, false, 3, '10-12'),
  ('Wznosy hantli bokiem', 'Barki / Tył barku', 'B', 4, false, 3, '12-15'),
  ('Superseria: Biceps + Triceps', 'Ramiona', 'B', 5, false, 3, '10-12'),
  ('Cardio', 'Cardio', 'B', 6, true, null, null);