import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const { type, difficulty } = req.query;

    let query = supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ exercises: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get single exercise
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ exercise: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create exercise (requires authentication)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      difficulty,
      expression,
      solution,
      answer_type,
      options,
      correct_option_index
    } = req.body;

    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        title,
        description,
        type,
        difficulty,
        expression,
        solution,
        answer_type: answer_type || 'open_answer',
        options,
        correct_option_index,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ exercise: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Submit answer to exercise
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get exercise to check answer
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (exerciseError) throw exerciseError;

    let isCorrect = false;

    if (exercise.answer_type === 'multiple_choice') {
      // For multiple choice, compare index
      isCorrect = parseInt(answer) === exercise.correct_option_index;
    } else {
      // For open answer, compare with solution (case-insensitive)
      isCorrect = answer.toLowerCase().trim() === exercise.solution.toLowerCase().trim();
    }

    // Record submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        exercise_id: id,
        answer,
        is_correct: isCorrect
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Update progress
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progress) {
      await supabase
        .from('progress')
        .update({
          total_exercises: progress.total_exercises + 1,
          correct_answers: progress.correct_answers + (isCorrect ? 1 : 0),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('progress')
        .insert({
          user_id: user.id,
          total_exercises: 1,
          correct_answers: isCorrect ? 1 : 0
        });
    }

    res.json({
      submission,
      is_correct: isCorrect,
      correct_answer: exercise.solution
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's submissions for an exercise
router.get('/:id/submissions', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('exercise_id', id)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    res.json({ submissions: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
