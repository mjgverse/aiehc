
const Groq = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const { question } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    const { data: articles, error } = await supabase
      .from('kb_articles')
      .select('title, content');

    if (error) {
      console.error('Supabase error:', error.message);
      res.status(500).json({ error: 'could not load knowledge base' });
      return;
    }

    const kbContext = (articles || [])
      .map((a) => `- ${a.title}: ${a.content}`)
      .join('\n');

    const systemPrompt = `You are a client-facing assistant for a real estate trust company.
Only answer using the knowledge base content below. If the answer isn't in it, say you don't know and suggest contacting staff.
KNOWLEDGE BASE:
${kbContext}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    });

    const answer = completion.choices[0].message.content;

    supabase
      .from('agent_logs')
      .insert({ question, answer })
      .then(({ error: logError }) => {
        if (logError) console.error('Log insert error:', logError.message);
      });

    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong' });
  }
};
