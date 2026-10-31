import { describe, expect, it, vi } from 'vitest';
const {insert,select,order,limit,from}=vi.hoisted(()=>({insert:vi.fn(),select:vi.fn(),order:vi.fn(),limit:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from}}));
import { readClickRequests, submitClickRequest, validateClickRequest } from './clickRequests';
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
describe('Click request persistence',()=>{
  it('saves support requests to the Click admin source',async()=>{
    from.mockReturnValue({insert});insert.mockResolvedValue({error:null});
    await submitClickRequest('owner-id',' Qabul ',' Savol ');
    expect(from).toHaveBeenCalledWith('click_partner_requests');
    expect(insert).toHaveBeenCalledWith({user_id:'owner-id',subject:'Qabul',message:'Savol',kind:'support',status:'new'});
  });
  it('reads both support and server QR reports without excluding either kind',async()=>{
    const rows=[{id:'request',kind:'support'},{id:'qr',kind:'device_link',status:'server_confirmed'}];
    from.mockReturnValue({select});select.mockReturnValue({order});order.mockReturnValue({limit});limit.mockResolvedValue({data:rows,error:null});
    expect(await readClickRequests()).toEqual(rows);
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('created_at',{ascending:false});
  });
  it('does not pretend a rejected write was saved',async()=>{
    from.mockReturnValue({insert});insert.mockResolvedValue({error:new Error('unavailable')});
    await expect(submitClickRequest('owner-id','Mavzu','Xabar')).rejects.toThrow('unavailable');
  });
});