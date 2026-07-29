/* Ask Sage — the streaming endpoint.
 *
 * A route handler, not a browser call, for the reason §12.2 gives about the
 * API proxy: the key stays server-side. Common Sage's own frontend does the
 * same thing with the same env var, so a deployment that already runs that
 * app needs no new configuration.
 *
 * When `GEMINI_API_KEY` is absent — which is the case in every local build of
 * this repo today — the route streams a SCRIPTED reply and says so in the
 * first line. That is deliberate: the alternative is a chat panel that looks
 * broken, and a designer reviewing the streaming UI needs tokens arriving
 * over time far more than they need those tokens to be clever.
 */

import type { NextRequest } from 'next/server'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

interface ChatRequest {
  message: string
  /** Course title and up to 30 topic titles, per the catalogue. */
  context?: { course: string; topics: string[] }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest
  const key = process.env.GEMINI_API_KEY

  const encoder = new TextEncoder()

  if (!key) {
    const text = scripted(body)
    const stream = new ReadableStream({
      async start(controller) {
        // Word by word, with a real delay: the point of the fallback is that
        // the streaming interface can be exercised, and a single chunk would
        // exercise nothing.
        for (const word of text.split(' ')) {
          controller.enqueue(encoder.encode(word + ' '))
          await new Promise((r) => setTimeout(r, 24))
        }
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-sage-source': 'scripted' },
    })
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You are Sage, a study assistant inside a course. Answer from the ' +
                'course material you are given. Be brief. If the material does not ' +
                'cover the question, say so rather than guessing.' +
                (body.context
                  ? `\n\nCourse: ${body.context.course}\nTopics: ${body.context.topics.join(', ')}`
                  : ''),
            },
          ],
        },
        contents: [{ role: 'user', parts: [{ text: body.message }] }],
      }),
    },
  )

  if (!upstream.ok || !upstream.body) {
    return new Response('Sage could not be reached. Nothing you typed was lost.', {
      status: 502,
    })
  }

  /* Gemini speaks SSE with a JSON envelope; the panel wants text. Unwrapping
   * here rather than in the component keeps the client free of any knowledge
   * of which model is behind this. */
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const json = JSON.parse(line.slice(5))
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) controller.enqueue(encoder.encode(text))
          } catch {
            // A partial JSON line is normal mid-stream; the next chunk
            // completes it. Dropping it silently is correct here.
          }
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-sage-source': 'gemini' },
  })
}

function scripted(body: ChatRequest): string {
  const topic = body.context?.topics[0] ?? 'this topic'
  return (
    `No model key is configured, so this is a scripted reply — the streaming, ` +
    `formatting and card generation below are real, the wording is not. ` +
    `On ${topic}: the thing worth holding on to is the definition, because every ` +
    `later result is a rearrangement of it. Work one example by hand before you ` +
    `trust the general form, and when you get an answer that surprises you, check ` +
    `the denominator first — that is where most of the errors live.`
  )
}
