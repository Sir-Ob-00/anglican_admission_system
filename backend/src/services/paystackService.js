import crypto from 'crypto';
import axios from 'axios';
import { env } from '../config/env.js';

const PAYSTACK_SECRET_KEY = env.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Generate unique payment reference
export function generatePaymentReference() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ADM_${timestamp}_${random}`;
}

// Initialize payment with Paystack
export async function initializePaystackPayment({ email, amount, reference, metadata }) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Paystack expects amount in kobo (cents)
        reference,
        metadata,
        callback_url: `${env.frontendUrl}/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new Error('Failed to initialize payment with Paystack');
  }
}

// Verify payment with Paystack
export async function verifyPaystackTransaction(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw new Error('Failed to verify payment with Paystack');
  }
}

// Verify Paystack webhook signature
export function verifyWebhookSignature(payload, signature) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
}
