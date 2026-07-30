import { NextResponse, type NextRequest } from 'next/server'
import { ANALYSIS, type ConversationAnalysis, type ConversationTurn } from '@/lib/api/jkg'
import { getToken } from '@/lib/auth/session'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

interface ReviewRequest {
  conversationId: string
  title: string
  turns: ConversationTurn[]
}

const reviewGlobal = globalThis as typeof globalThis & {
  conversationReviewCache?: Map<string, ConversationAnalysis>
  conversationReviewRequests?: Map<string, Promise<ConversationAnalysis>>
}

const reviewCache =
  reviewGlobal.conversationReviewCache ??
  (reviewGlobal.conversationReviewCache = new Map<string, ConversationAnalysis>())
const reviewRequests =
  reviewGlobal.conversationReviewRequests ??
  (reviewGlobal.conversationReviewRequests = new Map<string, Promise<ConversationAnalysis>>())

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ReviewRequest | null
  if (!isReviewRequest(body)) {
    return NextResponse.json({ error: 'A conversation is required.' }, { status: 400 })
  }

  const cacheIdentity = await createCacheIdentity(request, body.conversationId)
  const { cacheKey } = cacheIdentity
  const cached = reviewCache.get(cacheKey)
  if (cached) return reviewResponse(cached, 'hit', cacheIdentity)

  const existingRequest = reviewRequests.get(cacheKey)
  if (existingRequest) {
    try {
      return reviewResponse(await existingRequest, 'coalesced', cacheIdentity)
    } catch {
      return NextResponse.json(
        { error: 'The conversation could not be reviewed.' },
        { status: 502 },
      )
    }
  }

  const reviewRequest = analyseConversation(body)
  reviewRequests.set(cacheKey, reviewRequest)

  try {
    const analysis = await reviewRequest
    reviewCache.set(cacheKey, analysis)
    return reviewResponse(analysis, 'miss', cacheIdentity)
  } catch {
    return NextResponse.json({ error: 'The conversation could not be reviewed.' }, { status: 502 })
  } finally {
    reviewRequests.delete(cacheKey)
  }
}

async function createCacheIdentity(
  request: NextRequest,
  conversationId: string,
): Promise<{ cacheKey: string; anonymousSession?: string }> {
  const token = (await getToken()) ?? 'anonymous'
  const existingAnonymousSession = request.cookies.get('cs_review_session')?.value
  const anonymousSession =
    token === 'anonymous' ? (existingAnonymousSession ?? crypto.randomUUID()) : undefined
  const scope = anonymousSession ?? token
  const bytes = new TextEncoder().encode(`${scope}:${conversationId}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return {
    cacheKey: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    ),
    anonymousSession:
      anonymousSession && anonymousSession !== existingAnonymousSession
        ? anonymousSession
        : undefined,
  }
}

async function analyseConversation(body: ReviewRequest): Promise<ConversationAnalysis> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return ANALYSIS

  const transcript = body.turns
    .map((turn) => `${turn.role === 'learner' ? 'Learner' : 'Tutor'}: ${turn.text}`)
    .join('\n')

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You are a Japanese language tutor reviewing a completed conversation. ' +
                'Return concise, constructive feedback grounded only in the transcript. ' +
                'Do not invent learner mistakes. Write all explanations in English.',
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Conversation: ${body.title}\n\n${transcript}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            required: ['summary', 'patterns', 'targets', 'drills', 'nextPrompts'],
            properties: {
              summary: { type: 'STRING' },
              patterns: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  required: ['pattern', 'original', 'corrected', 'note'],
                  properties: {
                    pattern: { type: 'STRING' },
                    original: { type: 'STRING' },
                    corrected: { type: 'STRING' },
                    note: { type: 'STRING' },
                  },
                },
              },
              targets: { type: 'ARRAY', items: { type: 'STRING' } },
              drills: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  required: ['label', 'moduleType'],
                  properties: {
                    label: { type: 'STRING' },
                    moduleType: { type: 'STRING' },
                  },
                },
              },
              nextPrompts: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
        },
      }),
      cache: 'no-store',
    },
  )

  if (!upstream.ok) throw new Error('Review model request failed')
  const payload = (await upstream.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Review model returned no content')

  const analysis = JSON.parse(text) as unknown
  if (!isConversationAnalysis(analysis)) throw new Error('Review model returned invalid content')
  return analysis
}

function isReviewRequest(value: ReviewRequest | null): value is ReviewRequest {
  return Boolean(
    value &&
    typeof value.conversationId === 'string' &&
    value.conversationId.length > 0 &&
    value.conversationId.length <= 160 &&
    typeof value.title === 'string' &&
    value.title.length <= 240 &&
    Array.isArray(value.turns) &&
    value.turns.length > 0 &&
    value.turns.length <= 200 &&
    value.turns.every(
      (turn) =>
        (turn.role === 'learner' || turn.role === 'tutor') &&
        typeof turn.text === 'string' &&
        turn.text.length > 0 &&
        turn.text.length <= 4000,
    ),
  )
}

function isConversationAnalysis(value: unknown): value is ConversationAnalysis {
  if (!value || typeof value !== 'object') return false
  const analysis = value as Partial<ConversationAnalysis>
  return (
    typeof analysis.summary === 'string' &&
    Array.isArray(analysis.patterns) &&
    analysis.patterns.every(
      (pattern) =>
        typeof pattern.pattern === 'string' &&
        typeof pattern.original === 'string' &&
        typeof pattern.corrected === 'string' &&
        typeof pattern.note === 'string',
    ) &&
    Array.isArray(analysis.targets) &&
    analysis.targets.every((target) => typeof target === 'string') &&
    Array.isArray(analysis.drills) &&
    analysis.drills.every(
      (drill) => typeof drill.label === 'string' && typeof drill.moduleType === 'string',
    ) &&
    Array.isArray(analysis.nextPrompts) &&
    analysis.nextPrompts.every((prompt) => typeof prompt === 'string')
  )
}

function reviewResponse(
  analysis: ConversationAnalysis,
  cacheStatus: 'hit' | 'miss' | 'coalesced',
  cacheIdentity: { anonymousSession?: string },
) {
  const response = NextResponse.json(analysis, {
    headers: {
      'cache-control': 'private, max-age=31536000, immutable',
      'x-review-cache': cacheStatus,
    },
  })
  if (cacheIdentity.anonymousSession) {
    response.cookies.set('cs_review_session', cacheIdentity.anonymousSession, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return response
}
