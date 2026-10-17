import { createServer } from 'node:http';
import { runChatAgent } from './agents/chat-agent.js';
import { runReceiptAgent, } from './agents/receipt-agent.js';
import { ConfigurationError } from './model-client.js';
const port = Number(process.env['PORT'] || 3001);
const maxBodySize = 12 * 1024 * 1024;
const allowedOrigin = process.env['CORS_ORIGIN'] || 'http://localhost:4200';
class PayloadTooLargeError extends Error {
}
function sendJson(response, status, body) {
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    response.end(JSON.stringify(body));
}
function readJson(request) {
    return new Promise((resolve, reject) => {
        let rawBody = '';
        request.setEncoding('utf8');
        request.on('data', (chunk) => {
            rawBody += chunk;
            if (rawBody.length > maxBodySize) {
                reject(new PayloadTooLargeError('Request body is too large.'));
                request.destroy();
            }
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(rawBody || '{}'));
            }
            catch {
                reject(new SyntaxError('Request body must be valid JSON.'));
            }
        });
        request.on('error', reject);
    });
}
function asRequestBody(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new SyntaxError('Request body must be a JSON object.');
    }
    return value;
}
const server = createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
        sendJson(response, 204, {});
        return;
    }
    if (request.method === 'GET' && request.url === '/health') {
        sendJson(response, 200, { status: 'ok' });
        return;
    }
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
    }
    try {
        const body = asRequestBody(await readJson(request));
        const result = request.url === '/api/ai/chat'
            ? await runChatAgent(body)
            : request.url === '/api/receipts/analyze'
                ? await runReceiptAgent(body)
                : null;
        if (!result) {
            sendJson(response, 404, { error: 'Endpoint not found.' });
            return;
        }
        sendJson(response, 200, result);
    }
    catch (error) {
        const status = error instanceof PayloadTooLargeError
            ? 413
            : error instanceof TypeError || error instanceof SyntaxError
                ? 400
                : error instanceof ConfigurationError
                    ? 503
                    : 502;
        const message = error instanceof Error ? error.message : 'Agent request failed.';
        sendJson(response, status, { error: message });
    }
});
server.listen(port, () => {
    console.log(`Spendwise agent API listening on http://localhost:${port}`);
});
