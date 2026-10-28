import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client',()=>({supabase:{}}));
import { validateClickRequest } from './clickRequests';
describe('Click request limits',()=>{
  it('requires a nonblank subject and message',()=>{
    expect(()=>validateClickRequest(' ','test')).toThrow();
    expect(()=>validateClickRequest('test',' ')).toThrow();
    expect(validateClickRequest(' Help ',' Message ')).toEqual({subject:'Help',message:'Message'});
  });
  it('allows at most 160 subject and 2000 message characters',()=>{
    expect(()=>validateClickRequest('a'.repeat(160),'b'.repeat(2000))).not.toThrow();
    expect(()=>validateClickRequest('a'.repeat(161),'b')).toThrow();
    expect(()=>validateClickRequest('a','b'.repeat(2001))).toThrow();
  });
});