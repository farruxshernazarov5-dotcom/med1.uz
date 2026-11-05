import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
const env = import.meta.env;
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
describe('live wallet receipt permissions', () => {
  it('verifies the reported completed transfer without disclosing payer data', async () => {
    const { data, error } = await client.rpc('verify_payment_receipt', { _id: '98c98c37-ee5f-450c-809c-3118bcd52f70' });
    expect(error).toBeNull();
    expect(data?.[0]?.status).toBe('completed');
    expect(Number(data?.[0]?.amount)).toBe(1000);
    expect(data?.[0]).not.toHaveProperty('user_id');
    expect(data?.[0]).not.toHaveProperty('balance_after');
  });
  it('does not authorize signed-out wallet purchases', async () => {
    const { data, error } = await client.rpc('purchase_medcoin_from_wallet', { _package_code: 'coin_40', _idempotency_key: 'signed-out-regression-check' });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});