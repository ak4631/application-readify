import { API_BASE_URL } from '@env';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PurchaseInput =
  | {
      kind: 'flex' | 'subscription';
      vendorId: string;
      planId: string;
      date: string;
      startTime?: string;
      days?: number;
    }
  | { kind: 'extension'; targetId: string; planId: string; hours: number };
export type CheckoutOrder = {
  id: string;
  status: string;
  amountPaise: number;
  checkoutUrl: string;
  // Present when the server has a Razorpay order; drives in-app checkout.
  razorpay?: { keyId: string; orderId: string; verifyToken: string } | null;
};
export type CheckoutStatus = {
  id: string;
  targetId: string;
  status: string;
  amountPaise: number;
  startsAt: string;
  timeZone: string;
  seatNumber: string | null;
  bookingCode: string | null;
};

export function newCheckoutKey() {
  // A retry key, not a security token. Customer authentication remains server-side.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.floor(Math.random() * 16);
    return (char === 'x' ? value : (value % 4) + 8).toString(16);
  });
}

async function customerRequest<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  if (!API_BASE_URL)
    throw new Error('Checkout is not configured. Please contact support.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/api/customer/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? 'Could not complete this request.');
  return result as T;
}

export async function prepareCheckout(
  input: PurchaseInput,
  idempotencyKey: string,
) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in again.');
  const storageKey = `vriddhora:checkout:${
    data.session.user?.id ?? 'customer'
  }:${JSON.stringify(input)}`;
  const previous = await AsyncStorage.getItem(storageKey);
  let key = previous ?? idempotencyKey;
  await AsyncStorage.setItem(storageKey, key);
  let result = await customerRequest<CheckoutOrder>('checkout', 'POST', {
    ...input,
    idempotencyKey: key,
  });
  if (['EXPIRED', 'CANCELLED', 'REFUNDED'].includes(result.status)) {
    key = newCheckoutKey();
    await AsyncStorage.setItem(storageKey, key);
    result = await customerRequest<CheckoutOrder>('checkout', 'POST', {
      ...input,
      idempotencyKey: key,
    });
  }
  return result;
}
// Hands the in-app checkout result to the server, which checks the signature
// and the payment with Razorpay. The webhook confirms independently, so a
// failure here is retried by status polling rather than by paying again.
export async function verifyPayment(
  order: CheckoutOrder,
  result: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
) {
  if (!API_BASE_URL || !order.razorpay) return;
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/api/payments/verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        token: order.razorpay.verifyToken,
        ...result,
      }),
    },
  );
  if (!response.ok) throw new Error('Payment verification is pending.');
}

export const fetchCheckoutStatus = (id: string) =>
  customerRequest<CheckoutStatus>(`orders/${encodeURIComponent(id)}`, 'GET');
export const cancelPurchase = (targetId: string) =>
  customerRequest(`orders/${encodeURIComponent(targetId)}`, 'DELETE');
