/**
 * Invoice Data Extract Tool for TPMJS
 * Extracts structured data from invoice text including vendor, line items, totals
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable?: boolean;
}

/**
 * Vendor/supplier information
 */
export interface VendorInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

/**
 * Customer/bill-to information
 */
export interface CustomerInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * Payment terms
 */
export interface PaymentTerms {
  dueDate?: string;
  netDays?: number;
  lateFee?: number;
  discountTerms?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Extracted invoice data
 */
export interface ExtractedInvoice {
  invoiceNumber?: string;
  invoiceDate?: string;
  vendor: VendorInfo;
  customer?: CustomerInfo;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  paymentTerms?: PaymentTerms;
  notes?: string;
  validation: ValidationResult;
}

/**
 * Input type for Invoice Data Extract Tool
 */
type InvoiceDataExtractInput = {
  invoiceText: string;
};

/**
 * Extract vendor information from invoice text
 */
function extractVendorInfo(text: string): VendorInfo {
  const lines = text.split('\n');

  // Look for vendor name (usually in first few lines)
  let vendorName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]?.trim();
    if (line && !line.match(/invoice|bill|from|to/i)) {
      vendorName = line;
      break;
    }
  }

  // Extract phone number
  const phoneMatch = text.match(/(?:phone|tel|p):?\s*([0-9\-\(\)\s]{10,})/i);
  const phone = phoneMatch?.[1]?.trim();

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  const email = emailMatch?.[1];

  // Extract tax ID
  const taxIdMatch = text.match(/(?:tax\s*id|ein|vat):?\s*([0-9\-]+)/i);
  const taxId = taxIdMatch?.[1];

  // Extract address (simplified)
  const addressMatch = text.match(/(?:address|addr):?\s*([^\n]+(?:\n[^\n]+)?)/i);
  const address = addressMatch?.[1]?.trim();

  return {
    name: vendorName || 'Unknown Vendor',
    address,
    phone,
    email,
    taxId,
  };
}

/**
 * Extract invoice metadata (number, date)
 */
function extractMetadata(text: string): {
  invoiceNumber?: string;
  invoiceDate?: string;
} {
  // Extract invoice number
  const invoiceNumMatch = text.match(/(?:invoice|inv)\s*(?:#|no|number):?\s*([A-Z0-9\-]+)/i);
  const invoiceNumber = invoiceNumMatch?.[1];

  // Extract invoice date
  const dateMatch = text.match(
    /(?:date|dated|invoice\s+date):?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}|[A-Z][a-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i
  );
  const invoiceDate = dateMatch?.[1];

  return { invoiceNumber, invoiceDate };
}

/**
 * Extract line items from invoice text
 */
function extractLineItems(text: string): InvoiceLineItem[] {
  const lines = text.split('\n');
  const items: InvoiceLineItem[] = [];

  // Look for line items section
  let inItemsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start of items section
    if (trimmed.match(/^(?:description|item|product|service|qty|quantity)/i) && !inItemsSection) {
      inItemsSection = true;
      continue;
    }

    // End of items section
    if (inItemsSection && trimmed.match(/^(?:subtotal|total|tax|amount\s+due)/i)) {
      break;
    }

    if (inItemsSection && trimmed) {
      // Try to parse line item
      // Pattern: Description [Quantity] [Unit Price] [Amount]
      const itemMatch = trimmed.match(
        /^(.+?)\s+(\d+(?:\.\d+)?)\s+(?:\$|USD|EUR|GBP)?\s*(\d+(?:\.\d{2})?)\s+(?:\$|USD|EUR|GBP)?\s*(\d+(?:\.\d{2})?)/
      );

      if (itemMatch) {
        const description = itemMatch[1];
        const quantity = itemMatch[2];
        const unitPrice = itemMatch[3];
        const amount = itemMatch[4];
        if (description && quantity && unitPrice && amount) {
          items.push({
            description: description.trim(),
            quantity: Number.parseFloat(quantity),
            unitPrice: Number.parseFloat(unitPrice),
            amount: Number.parseFloat(amount),
          });
        }
      } else {
        // Try simpler pattern: Description Amount
        const simpleMatch = trimmed.match(/^(.+?)\s+(?:\$|USD|EUR|GBP)?\s*(\d+(?:\.\d{2})?)\s*$/);
        if (simpleMatch) {
          const description = simpleMatch[1];
          const amount = simpleMatch[2];
          if (description && amount) {
            items.push({
              description: description.trim(),
              quantity: 1,
              unitPrice: Number.parseFloat(amount),
              amount: Number.parseFloat(amount),
            });
          }
        }
      }
    }
  }

  // If no items found, try to extract from whole text
  if (items.length === 0) {
    const amountMatches = text.matchAll(/^(.+?)\s+(?:\$|USD|EUR|GBP)?\s*(\d+(?:\.\d{2})?)/gm);
    for (const match of amountMatches) {
      const description = match[1];
      const amount = match[2];
      if (
        description &&
        amount &&
        !description.match(/total|subtotal|tax|balance|due|paid/i) &&
        description.trim()
      ) {
        items.push({
          description: description.trim(),
          quantity: 1,
          unitPrice: Number.parseFloat(amount),
          amount: Number.parseFloat(amount),
        });
      }
    }
  }

  return items;
}

/**
 * Extract totals (subtotal, tax, total) from invoice text
 */
function extractTotals(text: string): {
  subtotal: number;
  tax: number;
  total: number;
} {
  // Extract subtotal
  const subtotalMatch = text.match(
    /(?:subtotal|sub\s*total):?\s*(?:\$|USD|EUR|GBP)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const subtotal = subtotalMatch?.[1] ? Number.parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;

  // Extract tax
  const taxMatch = text.match(
    /(?:tax|vat|gst|sales\s*tax):?\s*(?:\$|USD|EUR|GBP)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const tax = taxMatch?.[1] ? Number.parseFloat(taxMatch[1].replace(/,/g, '')) : 0;

  // Extract total
  const totalMatch = text.match(
    /(?:total|amount\s*due|balance\s*due|grand\s*total):?\s*(?:\$|USD|EUR|GBP)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const total = totalMatch?.[1] ? Number.parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

  return { subtotal, tax, total };
}

/**
 * Extract payment terms
 */
function extractPaymentTerms(text: string): PaymentTerms | undefined {
  const dueDateMatch = text.match(
    /(?:due\s*date|payment\s*due):?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}|[A-Z][a-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i
  );
  const dueDate = dueDateMatch?.[1];

  const netDaysMatch = text.match(/(?:net|due\s+in)\s+(\d+)\s*(?:days?)/i);
  const netDays = netDaysMatch?.[1] ? Number.parseInt(netDaysMatch[1]) : undefined;

  if (!dueDate && !netDays) {
    return undefined;
  }

  return {
    dueDate,
    netDays,
  };
}

/**
 * Extract currency
 */
function extractCurrency(text: string): string {
  if (text.match(/\$|USD/i)) return 'USD';
  if (text.match(/€|EUR/i)) return 'EUR';
  if (text.match(/£|GBP/i)) return 'GBP';
  if (text.match(/¥|JPY/i)) return 'JPY';
  return 'USD'; // Default
}

/**
 * Validate extracted invoice data
 */
function validateInvoice(invoice: Omit<ExtractedInvoice, 'validation'>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if vendor name is present
  if (!invoice.vendor.name || invoice.vendor.name === 'Unknown Vendor') {
    warnings.push('Vendor name could not be extracted');
  }

  // Check if line items are present
  if (invoice.lineItems.length === 0) {
    errors.push('No line items found in invoice');
  }

  // Validate totals
  const calculatedSubtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);

  if (invoice.subtotal > 0) {
    const subtotalDiff = Math.abs(calculatedSubtotal - invoice.subtotal);
    if (subtotalDiff > 0.01) {
      errors.push(
        `Subtotal mismatch: calculated ${calculatedSubtotal.toFixed(2)} but invoice shows ${invoice.subtotal.toFixed(2)}`
      );
    }
  } else {
    warnings.push('Subtotal not found, using calculated value from line items');
  }

  // Validate total
  const expectedTotal = (invoice.subtotal || calculatedSubtotal) + invoice.tax;
  if (invoice.total > 0) {
    const totalDiff = Math.abs(expectedTotal - invoice.total);
    if (totalDiff > 0.01) {
      errors.push(
        `Total mismatch: expected ${expectedTotal.toFixed(2)} (subtotal + tax) but invoice shows ${invoice.total.toFixed(2)}`
      );
    }
  } else {
    errors.push('Total amount not found in invoice');
  }

  // Validate line items
  for (const item of invoice.lineItems) {
    const expectedAmount = item.quantity * item.unitPrice;
    const amountDiff = Math.abs(expectedAmount - item.amount);
    if (amountDiff > 0.01) {
      warnings.push(
        `Line item "${item.description}": amount ${item.amount.toFixed(2)} does not match quantity × unit price (${expectedAmount.toFixed(2)})`
      );
    }
  }

  // Check for invoice number
  if (!invoice.invoiceNumber) {
    warnings.push('Invoice number not found');
  }

  // Check for invoice date
  if (!invoice.invoiceDate) {
    warnings.push('Invoice date not found');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Invoice Data Extract Tool
 * Extracts structured data from invoice text including vendor, line items, totals
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const invoiceDataExtractTool = tool({
  description:
    'Extracts structured data from invoice text content. Parses vendor information, invoice metadata (number, date), line items with quantities and prices, subtotal, tax, and total. Validates that totals match line items and provides warnings for any discrepancies. Useful for automated invoice processing and data entry.',
  inputSchema: jsonSchema<InvoiceDataExtractInput>({
    type: 'object',
    properties: {
      invoiceText: {
        type: 'string',
        description: 'Full text content of the invoice (from OCR, PDF extraction, or manual input)',
      },
    },
    required: ['invoiceText'],
    additionalProperties: false,
  }),
  async execute({ invoiceText }) {
    // Validate input
    if (!invoiceText || invoiceText.trim().length === 0) {
      throw new Error('Invoice text is required');
    }

    // Extract all components
    const vendor = extractVendorInfo(invoiceText);
    const { invoiceNumber, invoiceDate } = extractMetadata(invoiceText);
    const lineItems = extractLineItems(invoiceText);
    const { subtotal, tax, total } = extractTotals(invoiceText);
    const paymentTerms = extractPaymentTerms(invoiceText);
    const currency = extractCurrency(invoiceText);

    // Use calculated subtotal if not found
    const calculatedSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const finalSubtotal = subtotal > 0 ? subtotal : calculatedSubtotal;

    // Build invoice object
    const invoice: Omit<ExtractedInvoice, 'validation'> = {
      invoiceNumber,
      invoiceDate,
      vendor,
      lineItems,
      subtotal: finalSubtotal,
      tax,
      total: total > 0 ? total : finalSubtotal + tax,
      currency,
      paymentTerms,
    };

    // Validate
    const validation = validateInvoice(invoice);

    return {
      ...invoice,
      validation,
    };
  },
});

/**
 * Export default for convenience
 */
export default invoiceDataExtractTool;
