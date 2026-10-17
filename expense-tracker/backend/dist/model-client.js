const DEFAULT_TIMEOUT_MS = 30_000;
export class ConfigurationError extends Error {
}
export async function callModel(url, body) {
    const apiKey = process.env['DIAL_API_KEY'];
    if (!apiKey || !url) {
        throw new ConfigurationError('Configure DIAL_API_KEY and the model endpoint before calling an agent.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(`Model provider returned HTTP ${response.status}.`);
        }
        if (!isModelPayload(payload)) {
            throw new Error('Model provider returned an invalid JSON response.');
        }
        return payload;
    }
    finally {
        clearTimeout(timeout);
    }
}
function isModelPayload(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const choices = value.choices;
    return Array.isArray(choices) && choices.every((choice) => {
        if (typeof choice !== 'object' || choice === null) {
            return false;
        }
        const message = choice.message;
        return typeof message === 'object' &&
            message !== null &&
            typeof message.content === 'string';
    });
}
