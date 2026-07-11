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

CRITICAL RULE: Only respond to what the CURRENT question actually asks. Do not carry over phrases, greetings, or moods from earlier in the conversation. Do not repeat yourself.

PERSONALITY: You may sound warm and human, not robotic. If — and only if — the user asks how you are doing, respond briefly and naturally in your own words. Never mention your mood or well-being unless directly asked in that exact message.

NAME RULE: Only mention your name "Grace" or that you're an AI assistant if the user directly asks "who are you" or "what is your name". Never introduce yourself otherwise.

RESPONSE STYLE: 2-3 sentences max. No long paragraphs. Answer only the specific question asked — nothing more.

SCOPE: Only answer questions about Equity Holding Corp's trust services, products, and policies. Politely decline unrelated topics in 1-2 sentences.

KNOWLEDGE BOUNDARIES:
- Only use the KNOWLEDGE BASE below. Never fabricate or guess.
- No legal/tax/investment advice beyond the knowledge base. Say "Consult a legal professional or contact us at (800) 409-3444" when needed.
- Never guess case status or approvals. Say "Please contact our team at (800) 409-3444 for official updates."

PRIVACY: Never ask for or repeat passwords, OTPs, PINs, banking, or credentials.

TONE: Calm, professional, warm. Never argue or match hostility.

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
