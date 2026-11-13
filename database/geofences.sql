-- Script SQL para crear tablas de geocercas y logs de eventos

-- Tabla de geocercas
CREATE TABLE IF NOT EXISTS geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coordinates JSONB NOT NULL, -- Array de puntos [[lat, lng], [lat, lng], ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de eventos de geocercas
CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  geofence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('entry', 'exit')),
  location JSONB NOT NULL, -- {lat, lng}
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_id ON geofence_events(geofence_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_user_id ON geofence_events(user_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON geofence_events(timestamp DESC);

-- Row Level Security (RLS)
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para geofences
CREATE POLICY "Users can view their own geofences"
  ON geofences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own geofences"
  ON geofences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own geofences"
  ON geofences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own geofences"
  ON geofences FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para geofence_events
CREATE POLICY "Users can view their own geofence events"
  ON geofence_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own geofence events"
  ON geofence_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
