import { prepareCheckout, cancelPurchase } from '../lib/checkout';
import { supabase } from '../lib/supabase';

const getSession = supabase.auth.getSession as jest.Mock;
const request = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = request;
  getSession.mockResolvedValue({
    data: { session: { access_token: 'customer-session-token' } },
  });
});

test('sends authenticated purchase selections to server without trusting client prices', async () => {
  request.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'order', amountPaise: 2600, status: 'CREATED' }),
  });
  await prepareCheckout(
    {
      kind: 'flex',
      vendorId: 'vendor',
      planId: 'plan',
      date: '2030-01-01',
      days: 2,
      startTime: '08:00',
    },
    'retry-key',
  );
  const [url, options] = request.mock.calls[0];
  expect(url).toBe('https://api.test.invalid/api/customer/checkout');
  expect(options.headers.Authorization).toBe('Bearer customer-session-token');
  expect(JSON.parse(options.body)).toEqual({
    kind: 'flex',
    vendorId: 'vendor',
    planId: 'plan',
    date: '2030-01-01',
    days: 2,
    startTime: '08:00',
    idempotencyKey: 'retry-key',
  });
});

test('does not send checkout requests without an authenticated session', async () => {
  getSession.mockResolvedValue({ data: { session: null } });
  await expect(
    prepareCheckout(
      {
        kind: 'subscription',
        vendorId: 'vendor',
        planId: 'monthly',
        date: '2030-01-01',
      },
      'key',
    ),
  ).rejects.toThrow('sign in');
  expect(request).not.toHaveBeenCalled();
});

test('cancellation uses the payment-aware server and reports failures', async () => {
  request.mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Purchase not found' }),
  });
  await expect(cancelPurchase('someone-elses-booking')).rejects.toThrow(
    'Purchase not found',
  );
  expect(request.mock.calls[0][1].method).toBe('DELETE');
});
