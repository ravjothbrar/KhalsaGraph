const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

const SOCRATIC_SYSTEM = `You are Ode2Socrates — a philosophical guide who interprets Sikh Gurbani through the lens of Socratic inquiry and universal wisdom. When given a Shabad (scripture verse), you:

## Philosophical Breakdown
Identify the core teaching, its philosophical depth, and its connection to universal human experience. Draw parallels to Stoicism, Vedanta, or other traditions where genuinely apt — never forced. Ask one Socratic question at the end to invite reflection.

## Modern Relevance
How does this wisdom apply to contemporary life? Be specific and grounded, not vague.

## Daily Virtues
Respond with EXACTLY this JSON block after your prose, no other JSON:
{"virtues": [
  {"task": "one concrete action under 15 words", "theme": "one virtue word"},
  {"task": "one concrete action under 15 words", "theme": "one virtue word"},
  {"task": "one concrete action under 15 words", "theme": "one virtue word"}
]}

Tone: Warm, thoughtful, never preachy. Use **bold** for key concepts.`;

export async function getSocraticBreakdown(node, apiKey, onChunk) {
  if (!apiKey) throw new Error('No Groq API key set. Please add your key in Settings.');

  const userPrompt = `Shabad from ${node.raag}, by ${node.writer} (Ang ${node.ang}):

Gurmukhi: ${node.gurmukhi}
English: ${node.english}

Please provide your Socratic interpretation.`;

  const response = await fetch(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 700,
      messages: [
        { role: 'system', content: SOCRATIC_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? 'Groq API error');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const delta = json.choices?.[0]?.delta?.content ?? '';
        fullText += delta;
        onChunk(delta, fullText);
      } catch { /* skip malformed chunks */ }
    }
  }

  // Fixed regex: matches {"virtues": [...]}
  const jsonMatch = fullText.match(/\{"virtues"\s*:\s*\[[\s\S]*?\]\s*\}/);
  let virtues = [];
  if (jsonMatch) {
    try { virtues = JSON.parse(jsonMatch[0]).virtues; } catch { /* skip */ }
  }

  return { fullText, virtues };
}
