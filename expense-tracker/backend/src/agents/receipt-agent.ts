import { callModel } from '../model-client.js';

const RECEIPT_PROMPT =
  'Analyze this receipt image. Return ONLY a valid raw JSON object with merchantName, date, ' +
  'totalAmount, and items. Each item must have name, price, category (Food, Electronics, ' +
  'Clothing, Household, or Other), and quantity. Do not include markdown or explanation.';

export interface ReceiptRequest {
  imageBase64?: unknown;
  mimeType?: unknown;
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  quantity: number;
}

export interface ReceiptAnalysis {
  merchantName: string;
  date: string;
  totalAmount: number;
  items: ReceiptItem[];
}

const RECEIPT_CATEGORIES = new Set([
  'Food',
  'Electronics',
  'Clothing',
  'Household',
  'Other',
]);

export async function runReceiptAgent({
  imageBase64,
  mimeType = 'image/jpeg',
}: ReceiptRequest): Promise<ReceiptAnalysis> {
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
    model: 'gemini-3.8-flash',
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

  const receipt: unknown = JSON.parse(
    content.replace(/^```json\s*|\s*```$/g, '').trim()
  );
  if (!isReceiptAnalysis(receipt)) {
    throw new Error('The receipt model returned an invalid receipt.');
  }

  return receipt;
}

function isReceiptAnalysis(value: unknown): value is ReceiptAnalysis {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const receipt = value as Partial<ReceiptAnalysis>;
  if (
    typeof receipt.merchantName !== 'string' ||
    !receipt.merchantName.trim() ||
    typeof receipt.date !== 'string' ||
    !isValidDate(receipt.date) ||
    typeof receipt.totalAmount !== 'number' ||
    !Number.isFinite(receipt.totalAmount) ||
    receipt.totalAmount <= 0 ||
    !Array.isArray(receipt.items) ||
    receipt.items.length === 0
  ) {
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

function isReceiptItem(value: unknown): value is ReceiptItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Partial<ReceiptItem>;
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

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
