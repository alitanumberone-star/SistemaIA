import { Router } from 'express';
import { evaluate, parse } from 'mathjs';
import { laplaceTransform } from '../lib/laplace.js';

const router = Router();

// Basic mathematical expression evaluation
router.post('/evaluate', (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required' });
    }

    const result = evaluate(expression);
    res.json({ result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Validate mathematical expression
router.post('/validate', (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required' });
    }

    parse(expression);
    res.json({ valid: true });
  } catch (error: any) {
    res.status(400).json({ valid: false, error: error.message });
  }
});

// Transformada de Laplace simbólica
router.post('/laplace', (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required' });
    }

    const result = laplaceTransform(expression);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
