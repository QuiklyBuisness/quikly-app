/**
 * Analyzes a job photo and returns a worker-facing notice.
 * Run server-side only. Never expose to customers.
 */
export async function analyzeJobPhoto(
  base64Image: string,
  mediaType: string,
  category: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `You help tradespeople understand job photos before arriving on site. The job category is: ${category}. Write 1-2 short practical sentences about what you notice that would help a worker prepare — things the customer may not have mentioned or understood. Be specific. Do not diagnose definitively. Output ONLY the notice text, no preamble.`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: 'What do you notice that would help the worker prepare?' }
          ]
        }]
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    const text = data?.content?.[0]?.text?.trim()
    return text || null
  } catch {
    return null
  }
}
