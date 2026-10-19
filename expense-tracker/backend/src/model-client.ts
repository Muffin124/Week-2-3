const DEFAULT_TIMEOUT_MS = 30_000;

export class ConfigurationError extends Error {}

export interface ModelPayload {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function callModel(
  url: string | undefined,
  body: Record<string, unknown>
): Promise<ModelPayload> {
  const apiKey = process.env['DIAL_API_KEY'];
  if (!apiKey) {
    throw new ConfigurationError(
      'Configure DIAL_API_KEY before calling an agent.'
    );
  }

  // Wymuszamy w 100% poprawny, sprawdzony adres i model:
  const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  const requestBody = {
    ...body,
    model: 'gemini-3.5-flash',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('Google API Error:', response.status, payload);
      throw new Error(`Google API error ${response.status}: ${JSON.stringify(payload)}`);
    }
    if (!isModelPayload(payload)) {
      throw new Error('Model provider returned an invalid JSON response.');
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function isModelPayload(value: unknown): value is ModelPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const choices = (value as { choices?: unknown }).choices;
  return Array.isArray(choices) && choices.every((choice) => {
    if (typeof choice !== 'object' || choice === null) {
      return false;
    }
    const message = (choice as { message?: unknown }).message;
    return typeof message === 'object' &&
      message !== null &&
      typeof (message as { content?: unknown }).content === 'string';
  });
}
