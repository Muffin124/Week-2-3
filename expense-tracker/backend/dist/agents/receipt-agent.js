import { callModel } from '../model-client.js';
const RECEIPT_PROMPT = 'Analyze this receipt image. Return ONLY a valid raw JSON object with merchantName, date, ' +
    'totalAmount, and items. Each item must have name, price, category (Food, Electronics, ' +
    'Clothing, Household, or Other), and quantity. Do not include markdown or explanation.';
const RECEIPT_CATEGORIES = new Set([
    'Food',
    'Electronics',
    'Clothing',
    'Household',
    'Other',
]);
export async function runReceiptAgent({ imageBase64, mimeType = 'image/jpeg', }) {
    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
        throw new TypeError('imageBase64 must be a non-empty string.');
    }
    if (typeof mimeType !== 'string' || !mimeType.trim()) {
        throw new TypeError('mimeType must be a non-empty string.');
    }
    if (!mimeType.startsWith('image/')) {
        throw new TypeError('mimeType must be an image MIME type.');
    }
    const payload = await callModel(process.env['DIAL_RECEIPT_URL'], {
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: RECEIPT_PROMPT },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${imageBase64.trim()}`,
                        },
                    },
                ],
            },
        ],
    });
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
        throw new Error('The receipt model returned an empty response.');
    }
    const receipt = JSON.parse(content.replace(/^```json\s*|\s*```$/g, '').trim());
    if (!isReceiptAnalysis(receipt)) {
        throw new Error('The receipt model returned an invalid receipt.');
    }
    return receipt;
}
function isReceiptAnalysis(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const receipt = value;
    if (typeof receipt.merchantName !== 'string' ||
        !receipt.merchantName.trim() ||
        typeof receipt.date !== 'string' ||
        !isValidDate(receipt.date) ||
        typeof receipt.totalAmount !== 'number' ||
        !Number.isFinite(receipt.totalAmount) ||
        receipt.totalAmount <= 0 ||
        !Array.isArray(receipt.items) ||
        receipt.items.length === 0) {
        return false;
    }
    const totalAmount = receipt.totalAmount;
    const itemTotal = receipt.items.reduce((total, item) => {
        if (!isReceiptItem(item)) {
            return Number.NaN;
        }
        return total + item.price * item.quantity;
    }, 0);
    return Number.isFinite(itemTotal) &&
        Math.abs(itemTotal - totalAmount) <= 0.01;
}
function isReceiptItem(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const item = value;
    const price = item.price;
    const quantity = item.quantity;
    return typeof item.name === 'string' &&
        Boolean(item.name.trim()) &&
        typeof item.category === 'string' &&
        RECEIPT_CATEGORIES.has(item.category) &&
        typeof price === 'number' &&
        Number.isFinite(price) &&
        price > 0 &&
        typeof quantity === 'number' &&
        Number.isInteger(quantity) &&
        quantity > 0;
}
function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
