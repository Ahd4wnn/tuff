const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export async function askGPT(systemPrompt, userMessage, options = {}) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
