import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { runBingeOptimizer, buildGeminiPrompt } from '../services/bingeService.js';

const prisma = new PrismaClient();

// POST /api/binge
// Runs algorithm + waits for Gemini re-rank before responding (~2-4s total)
export const createBingeSession = async (req, res) => {
  try {
    const { timeMins, moods = [], genre = 'all' } = req.body;
    if (!timeMins || timeMins < 1) {
      return res.status(400).json({ message: 'timeMins is required' });
    }

    const userId = req.user.id;

    // ── Phase 1: Algorithmic scorer (instant, <50ms) ─────────────
    const algorithmicResults = await runBingeOptimizer({ userId, timeMins, moods, genre });

    if (algorithmicResults.length === 0) {
      // Nothing in any collection — save empty session and return
      const session = await prisma.bingeSession.create({
        data: {
          userId,
          timeAvailableMins: timeMins,
          selectedMoods: JSON.stringify(moods),
          genreFilter: genre,
          candidateMediaIds: '[]',
          rankedResults: '[]',
        }
      });
      return res.json({ sessionId: session.id, results: [], aiReady: true, aiBlurbs: null, sessionNote: null });
    }

    // ── Phase 2: Gemini re-rank (synchronous, ~1-3s) ─────────────
    let finalResults = algorithmicResults;
    let aiBlurbs     = null;
    let sessionNote  = null;
    let llmLatencyMs = null;
    let llmModel     = null;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('No Gemini API key');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt   = buildGeminiPrompt(algorithmicResults, { timeMins, moods, genre });
      const startMs  = Date.now();
      const result   = await model.generateContent(prompt);
      llmLatencyMs   = Date.now() - startMs;
      llmModel       = 'gemini-2.0-flash';

      const text     = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Re-order by Gemini's ranked list
        if (Array.isArray(parsed.rankedTitles) && parsed.rankedTitles.length > 0) {
          finalResults = [...algorithmicResults].sort((a, b) => {
            const ia = parsed.rankedTitles.findIndex(t =>
              a.title.toLowerCase().includes(t.toLowerCase()) ||
              t.toLowerCase().includes(a.title.toLowerCase())
            );
            const ib = parsed.rankedTitles.findIndex(t =>
              b.title.toLowerCase().includes(t.toLowerCase()) ||
              t.toLowerCase().includes(b.title.toLowerCase())
            );
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
        }

        aiBlurbs    = parsed.blurbs || null;
        sessionNote = parsed.sessionNote || null;
      }
    } catch (err) {
      // Gemini failed — fall back to algorithmic results silently
      console.error('[BingeAI] Gemini failed, using algo results:', err.message);
    }

    // ── Save session to DB ────────────────────────────────────────
    const session = await prisma.bingeSession.create({
      data: {
        userId,
        timeAvailableMins: timeMins,
        selectedMoods: JSON.stringify(moods),
        genreFilter: genre,
        candidateMediaIds: JSON.stringify(algorithmicResults.map(c => c.mediaId)),
        rankedResults: JSON.stringify(finalResults),
        llmModelUsed: llmModel,
        llmLatencyMs: llmLatencyMs,
      }
    });

    // Return everything in one shot
    return res.json({
      sessionId:   session.id,
      results:     finalResults,
      aiReady:     true,
      aiBlurbs,
      sessionNote,
      llmLatencyMs,
    });

  } catch (err) {
    console.error('[Binge] Fatal error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};

// GET /api/binge/:id — retrieve a past session
export const getBingeSession = async (req, res) => {
  try {
    const session = await prisma.bingeSession.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      sessionId:        session.id,
      results:          session.rankedResults ? JSON.parse(session.rankedResults) : [],
      aiReady:          !!session.llmModelUsed,
      aiBlurbs:         null,
      sessionNote:      null,
      llmLatencyMs:     session.llmLatencyMs,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/binge — list recent sessions
export const getBingeSessions = async (req, res) => {
  try {
    const sessions = await prisma.bingeSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(sessions.map(s => ({
      id:               s.id,
      timeAvailableMins: s.timeAvailableMins,
      selectedMoods:    s.selectedMoods ? JSON.parse(s.selectedMoods) : [],
      createdAt:        s.createdAt,
      resultCount:      s.rankedResults ? JSON.parse(s.rankedResults).length : 0,
      aiReady:          !!s.llmModelUsed,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
