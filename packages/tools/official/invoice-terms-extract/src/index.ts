/**
 * Invoice Terms Extract Tool for TPMJS
 * Extracts payment terms, due dates, and late fees from invoice text
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for invoice terms extraction
 */
interface InvoiceTermsExtractInput {
  invoiceText: string;
}

/**
 * Late fee structure
 */
export interface LateFee {
  type: 'percentage' | 'fixed' | 'daily' | 'monthly';
  amount: number;
  currency?: string;
  description: string;
}

/**
 * Discount terms for early payment
 */
export interface EarlyPaymentDiscount {
  discountPercentage: number;
  paymentDays: number;
  description: string;
}

/**
 * Output interface for extracted payment terms
 */
export interface PaymentTerms {
  netDays: number | null;
  dueDate: string | null;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  totalAmount: number | null;
  currency: string | null;
  lateFee: LateFee | null;
  earlyPaymentDiscount: EarlyPaymentDiscount | null;
  paymentMethods: string[];
  additionalTerms: string[];
  summary: string;
}

/**
 * Extracts net payment terms (e.g., "Net 30", "Net 60")
 */
function extractNetDays(text: string): number | null {
  const normalizedText = text.toLowerCase();

  // Match "Net XX" or "Net XX days"
  const netMatch = normalizedText.match(/net\s+(\d+)(?:\s+days?)?/i);
  if (netMatch && netMatch[1]) {
    return Number.parseInt(netMatch[1], 10);
  }

  // Match "XX days" in payment terms context
  const daysMatch = normalizedText.match(/(?:payment\s+)?(?:due\s+)?(?:in\s+)?(\d+)\s+days/i);
  if (daysMatch && daysMatch[1]) {
    return Number.parseInt(daysMatch[1], 10);
  }

  // Match common payment terms
  if (normalizedText.includes('due on receipt') || normalizedText.includes('payable immediately')) {
    return 0;
  }

  if (normalizedText.includes('end of month') || normalizedText.includes('eom')) {
    return 30; // Approximate
  }

  return null;
}

/**
 * Extracts due date from invoice text
 */
function extractDueDate(text: string): string | null {
  // Match common date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const datePatterns = [
    /due(?:\s+date)?:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /payment\s+due:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /due\s+by:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /due\s+on:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Match written dates: "January 15, 2024" or "15 January 2024"
  const writtenDateMatch = text.match(
    /due\s+(?:date|on|by)?:?\s*(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+\w+\s+\d{4})/i
  );
  if (writtenDateMatch && writtenDateMatch[1]) {
    return writtenDateMatch[1];
  }

  return null;
}

/**
 * Extracts invoice date
 */
function extractInvoiceDate(text: string): string | null {
  const datePatterns = [
    /invoice\s+date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /dated:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extracts invoice number
 */
function extractInvoiceNumber(text: string): string | null {
  const patterns = [
    /invoice\s+(?:number|#|no\.?):?\s*([A-Z0-9\-]+)/i,
    /invoice:?\s+([A-Z0-9\-]+)/i,
    /#\s*([A-Z0-9\-]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extracts total amount and currency
 */
function extractTotalAmount(text: string): { amount: number | null; currency: string | null } {
  // Match currency symbols and amounts
  const patterns = [
    /(?:total|amount\s+due|balance\s+due):?\s*\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/,
    /(?:total|amount\s+due|balance\s+due):?\s*([A-Z]{3})\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Check if currency code is present
      const hasCurrencyCode = match[0].match(/[A-Z]{3}/);
      const currency = hasCurrencyCode && match[1] ? match[1] : 'USD';
      const amountStr = hasCurrencyCode && match[2] ? match[2] : match[1];
      if (amountStr) {
        const amount = Number.parseFloat(amountStr.replace(/,/g, ''));

        if (!isNaN(amount)) {
          return { amount, currency };
        }
      }
    }
  }

  return { amount: null, currency: null };
}

/**
 * Extracts late fee information
 */
function extractLateFee(text: string): LateFee | null {
  const normalizedText = text.toLowerCase();

  // Match percentage late fee: "1.5% per month" or "2% monthly"
  const percentageMatch = normalizedText.match(
    /([\d.]+)%\s*(?:per\s+month|monthly|late\s+fee|interest)/i
  );
  if (percentageMatch && percentageMatch[1]) {
    return {
      type: 'monthly',
      amount: Number.parseFloat(percentageMatch[1]),
      description: `${percentageMatch[1]}% per month late fee`,
    };
  }

  // Match daily percentage: "0.05% per day"
  const dailyMatch = normalizedText.match(/([\d.]+)%\s*(?:per\s+day|daily)/i);
  if (dailyMatch && dailyMatch[1]) {
    return {
      type: 'daily',
      amount: Number.parseFloat(dailyMatch[1]),
      description: `${dailyMatch[1]}% per day late fee`,
    };
  }

  // Match fixed fee: "$25 late fee" or "late fee of $50"
  const fixedMatch = text.match(/(?:late\s+fee|fee)(?:\s+of)?\s*\$?\s*([\d.]+)/i);
  if (fixedMatch && fixedMatch[1]) {
    return {
      type: 'fixed',
      amount: Number.parseFloat(fixedMatch[1]),
      currency: 'USD',
      description: `$${fixedMatch[1]} late fee`,
    };
  }

  return null;
}

/**
 * Extracts early payment discount (e.g., "2/10 Net 30")
 */
function extractEarlyPaymentDiscount(text: string): EarlyPaymentDiscount | null {
  // Match "2/10 Net 30" format (2% discount if paid within 10 days)
  const discountMatch = text.match(/(\d+)\/(\d+)\s+(?:net|n)\s+\d+/i);
  if (discountMatch && discountMatch[1] && discountMatch[2]) {
    return {
      discountPercentage: Number.parseInt(discountMatch[1], 10),
      paymentDays: Number.parseInt(discountMatch[2], 10),
      description: `${discountMatch[1]}% discount if paid within ${discountMatch[2]} days`,
    };
  }

  // Match "X% discount if paid within Y days"
  const explicitMatch = text.match(/(\d+)%\s+discount\s+(?:if\s+paid\s+)?within\s+(\d+)\s+days/i);
  if (explicitMatch && explicitMatch[1] && explicitMatch[2]) {
    return {
      discountPercentage: Number.parseInt(explicitMatch[1], 10),
      paymentDays: Number.parseInt(explicitMatch[2], 10),
      description: `${explicitMatch[1]}% discount if paid within ${explicitMatch[2]} days`,
    };
  }

  return null;
}

/**
 * Extracts payment methods
 */
function extractPaymentMethods(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const methods: string[] = [];

  const paymentPatterns = [
    { keyword: 'check', value: 'Check' },
    { keyword: 'wire transfer', value: 'Wire Transfer' },
    { keyword: 'ach', value: 'ACH' },
    { keyword: 'credit card', value: 'Credit Card' },
    { keyword: 'debit card', value: 'Debit Card' },
    { keyword: 'paypal', value: 'PayPal' },
    { keyword: 'venmo', value: 'Venmo' },
    { keyword: 'cash', value: 'Cash' },
    { keyword: 'bank transfer', value: 'Bank Transfer' },
    { keyword: 'online payment', value: 'Online Payment' },
  ];

  paymentPatterns.forEach(({ keyword, value }) => {
    if (normalizedText.includes(keyword)) {
      methods.push(value);
    }
  });

  return [...new Set(methods)]; // Remove duplicates
}

/**
 * Extracts additional payment terms
 */
function extractAdditionalTerms(text: string): string[] {
  const terms: string[] = [];
  const normalizedText = text.toLowerCase();

  const termPatterns = [
    { keyword: 'non-refundable', term: 'Payment is non-refundable' },
    { keyword: 'prepayment required', term: 'Prepayment required' },
    { keyword: 'partial payments', term: 'Partial payments accepted' },
    { keyword: 'installment', term: 'Installment payments available' },
    {
      keyword: 'collection costs',
      term: 'Customer responsible for collection costs',
    },
    {
      keyword: 'interest charges',
      term: 'Interest charges apply to overdue amounts',
    },
  ];

  termPatterns.forEach(({ keyword, term }) => {
    if (normalizedText.includes(keyword)) {
      terms.push(term);
    }
  });

  return terms;
}

/**
 * Extracts and normalizes payment terms from invoice text
 */
function extractPaymentTerms(invoiceText: string): PaymentTerms {
  if (!invoiceText || invoiceText.trim().length === 0) {
    throw new Error('Invoice text cannot be empty');
  }

  const netDays = extractNetDays(invoiceText);
  const dueDate = extractDueDate(invoiceText);
  const invoiceDate = extractInvoiceDate(invoiceText);
  const invoiceNumber = extractInvoiceNumber(invoiceText);
  const { amount, currency } = extractTotalAmount(invoiceText);
  const lateFee = extractLateFee(invoiceText);
  const earlyPaymentDiscount = extractEarlyPaymentDiscount(invoiceText);
  const paymentMethods = extractPaymentMethods(invoiceText);
  const additionalTerms = extractAdditionalTerms(invoiceText);

  // Generate summary
  let summary = 'Extracted payment terms: ';
  const summaryParts: string[] = [];

  if (netDays !== null) {
    summaryParts.push(`Net ${netDays} days`);
  }

  if (dueDate) {
    summaryParts.push(`due ${dueDate}`);
  }

  if (amount !== null) {
    summaryParts.push(`total ${currency || 'USD'} ${amount.toFixed(2)}`);
  }

  if (lateFee) {
    summaryParts.push(`late fee: ${lateFee.description}`);
  }

  if (earlyPaymentDiscount) {
    summaryParts.push(`discount: ${earlyPaymentDiscount.description}`);
  }

  if (paymentMethods.length > 0) {
    summaryParts.push(`accepted: ${paymentMethods.join(', ')}`);
  }

  summary +=
    summaryParts.length > 0 ? summaryParts.join('; ') : 'No specific payment terms identified';

  return {
    netDays,
    dueDate,
    invoiceDate,
    invoiceNumber,
    totalAmount: amount,
    currency,
    lateFee,
    earlyPaymentDiscount,
    paymentMethods,
    additionalTerms,
    summary,
  };
}

/**
 * Invoice Terms Extract Tool
 * Extracts payment terms, due dates, and late fees from invoice text
 */
export const invoiceTermsExtractTool = tool({
  description:
    'Extracts and normalizes payment terms from invoice text or payment terms sections. Identifies net payment days (e.g., Net 30), due dates, invoice dates, invoice numbers, total amounts, currencies, late fee structures (percentage, fixed, daily, monthly), early payment discounts, accepted payment methods, and additional terms. Returns structured payment terms ready for processing or calendar entry.',
  inputSchema: jsonSchema<InvoiceTermsExtractInput>({
    type: 'object',
    properties: {
      invoiceText: {
        type: 'string',
        description: 'The invoice text or payment terms section to analyze',
      },
    },
    required: ['invoiceText'],
    additionalProperties: false,
  }),
  execute: async ({ invoiceText }): Promise<PaymentTerms> => {
    // Validate input
    if (typeof invoiceText !== 'string') {
      throw new Error('Invoice text must be a string');
    }

    if (invoiceText.trim().length === 0) {
      throw new Error('Invoice text cannot be empty');
    }

    try {
      return extractPaymentTerms(invoiceText);
    } catch (error) {
      throw new Error(
        `Failed to extract invoice terms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default invoiceTermsExtractTool;
