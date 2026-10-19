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
  if (!apiKey || !url) {
    throw new ConfigurationError(
      'Configure DIAL_API_KEY and the model endpoint before calling an agent.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const cleanKey = apiKey.trim();
  const separator = url.includes('?') ? '&' : '?';
  const targetUrl = url.includes('key=') ? url : `${url}${separator}key=${cleanKey}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey, // <- Nagłówek dla Google
        'api-key': cleanKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('Błąd Google:', response.status, payload);
      throw new Error(`Model provider returned HTTP ${response.status}.`);
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
