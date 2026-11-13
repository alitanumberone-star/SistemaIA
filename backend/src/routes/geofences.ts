import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Obtener todas las geocercas del usuario
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: geofences, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(geofences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una geocerca específica
router.get('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: geofence, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.json(geofence);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva geocerca
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, description, coordinates } = req.body;

    if (!name || !coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: 'Name and coordinates are required' });
    }

    const { data: geofence, error } = await supabase
      .from('geofences')
      .insert({
        user_id: user.id,
        name,
        description,
        coordinates
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(geofence);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una geocerca
router.put('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, description, coordinates } = req.body;

    const { data: geofence, error } = await supabase
      .from('geofences')
      .update({
        name,
        description,
        coordinates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.json(geofence);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una geocerca
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener eventos de una geocerca
router.get('/:id/events', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: events, error } = await supabase
      .from('geofence_events')
      .select('*')
      .eq('geofence_id', req.params.id)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar un evento de entrada/salida
router.post('/:id/events', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { event_type, location } = req.body;

    if (!event_type || !location) {
      return res.status(400).json({ error: 'Event type and location are required' });
    }

    if (!['entry', 'exit'].includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const { data: event, error } = await supabase
      .from('geofence_events')
      .insert({
        geofence_id: req.params.id,
        user_id: user.id,
        event_type,
        location
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
