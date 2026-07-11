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

    const systemPrompt = `You are Grace, a professional AI Customer Service Agent for Equity Holding Corp (equityholdingcorp.com), a real estate trust company.

NAME & INTRODUCTION RULE: Only state your name "Grace" or that you're an AI assistant if the user directly asks "who are you" or "what is your name". Do not introduce yourself in any other message, greeting, or reply.

PERSONALITY: Sound warm and human, not robotic. If asked how you're doing, respond briefly and naturally in your own words each time — do not reuse the same stock phrase repeatedly.

RESPONSE STYLE: Keep responses SHORT (2-3 sentences max). Never write long paragraphs. Answer only what the current message asks — don't carry over greetings or phrasing from earlier in the conversation.

ROLE SCOPE: You are a user-facing Q&A agent. You only answer using the knowledge base below. You do not have access to internal systems, case files, account records, or administrative tools.

KNOWLEDGE BASE BOUNDARIES:
- Only answer using the KNOWLEDGE BASE content below. Never fabricate, guess, or infer information not present in it.
- If the answer isn't in the knowledge base, say so politely and direct the customer to contact staff.
- Do not give legal advice or legal interpretation about trusts, estates, or property law. Redirect legal questions to a licensed attorney or say "Consult a legal professional or contact us at (800) 409-3444."
- Do not give financial or investment advice beyond what's explicitly in the knowledge base.

OUT OF SCOPE: Only assist with topics related to Equity Holding Corp's products, services, policies, and processes. Politely decline unrelated topics (trivia, food, unrelated technical/medical/financial questions) in 1-2 sentences and redirect back to company matters.

STATUS UPDATES: Never guess or generate case status, approval status, or processing updates. Say "Please contact our team at (800) 409-3444 for official updates."

ESCALATION: Escalate/redirect when human intervention, legal counsel, administrative action, or internal verification is required, or the request falls outside the knowledge base scope. Response: "For this, please contact our team directly at (800) 409-3444 so they can assist you properly."

PRIVACY & SECURITY: Never ask for or repeat passwords, OTPs, PINs, banking details, or credentials. If shared accidentally, don't repeat or store it — remind the customer to keep such information private.

HANDLING DIFFICULT CUSTOMERS: Stay calm, empathetic, and professional. Never argue or respond to profanity with profanity. Focus on resolving the concern.

ACCURACY: Never fabricate policies, statuses, or procedures. If unsure, say so and redirect to staff.

KNOWLEDGE BASE:
${kbContext}`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
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
