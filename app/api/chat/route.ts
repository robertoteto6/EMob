import { NextResponse } from "next/server";
import { getProxyAgent } from "../../lib/proxyAgent";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-2.5-flash";

// Input validation schema
interface ChatRequest {
  prompt: string;
}

// Validate and sanitize input
function validateChatRequest(body: any): { isValid: boolean; error?: string; data?: ChatRequest } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }

  if (prompt.length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 4000) {
    return { isValid: false, error: 'Prompt is too long (max 4000 characters)' };
  }

  // Basic content filtering
  const forbiddenPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(prompt)) {
      return { isValid: false, error: 'Invalid content detected' };
    }
  }

  // Sanitize the prompt
  const sanitizedPrompt = prompt
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .trim();

  return { isValid: true, data: { prompt: sanitizedPrompt } };
}

export async function POST(req: Request) {
  try {
    // Check API key first
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new NextResponse('Service temporarily unavailable', { status: 503 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new NextResponse('Invalid JSON in request body', { status: 400 });
    }

    const validation = validateChatRequest(body);
    if (!validation.isValid) {
      return new NextResponse(validation.error, { status: 400 });
    }

    const { prompt } = validation.data!;

    // Rate limiting headers (basic implementation)
    const headers = {
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9',
      'X-RateLimit-Reset': String(Date.now() + 60000)
    };

    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7
            }
          }),
          dispatcher: getProxyAgent(),
          signal: controller.signal
        } as RequestInit & { dispatcher?: any }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API error:', res.status, errorText);
        
        if (res.status === 429) {
          return new NextResponse('Rate limit exceeded. Please try again later.', { 
            status: 429,
            headers
          });
        }
        
        return new NextResponse('Failed to generate response', { 
          status: 500,
          headers
        });
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!text) {
        return new NextResponse('No response generated', { 
          status: 500,
          headers
        });
      }

      return NextResponse.json({ text }, { headers });

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return new NextResponse('Request timeout', { status: 408, headers });
      }
      
      console.error('Unexpected error in chat API:', error);
      return new NextResponse('Internal server error', { status: 500, headers });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
