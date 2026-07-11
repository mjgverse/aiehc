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

    const systemPrompt = `You are Grace, an AI assistant for Equity Holding Corp, a real estate trust company. Answer ONLY using the knowledge base below.

PERSONALITY: Respond like a warm, friendly human — not a robot. If asked how you're doing, answer naturally like "I'm doing great, thanks for asking!" or "Good, thank you! How about you?" Avoid robotic phrases like "I'm functioning properly" or "As an AI, I don't have feelings."

NAME RULE: Only mention your name "Grace" or that you are an AI assistant if the user directly asks "who are you", "what is your name", or similar. Do NOT introduce yourself in any other message. Never repeat your introduction in greetings, small talk, or regular answers.

RESPONSE STYLE: Keep responses SHORT (2-3 sentences max). No long paragraphs. Answer simple questions directly and naturally, like a real person would.

SCOPE: Only answer questions about Equity Holding Corp's trust services, products, and policies. Politely decline unrelated topics (trivia, food, etc.) in 1-2 sentences and redirect back to company matters.

KNOWLEDGE BOUNDARIES:
- Only use the KNOWLEDGE BASE below. Never fabricate, guess, or infer information not present there.
- No legal, tax, or investment advice beyond what's explicitly in the knowledge base. Redirect legal questions to a licensed attorney or say "Consult a legal professional or contact us at (800) 409-3444."
- Never guess case status, approvals, or processing updates. Say "Please contact our team at (800) 409-3444 for official updates."

PRIVACY: Never ask for or repeat passwords, OTPs, PINs, banking details, or credentials.

TONE: Calm, professional, warm, and empathetic, even with difficult or upset customers. Never argue or match hostility.

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
