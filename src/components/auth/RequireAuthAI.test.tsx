import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe,it,expect,vi } from 'vitest';
const state=vi.hoisted(()=>({user:{id:'account'} as {id:string}|null,loading:false}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>state}));
import { RequireAuthAI } from './RequireAuthAI';
describe('Camera return auth refresh',()=>{
  it('keeps the scanner mounted for the same signed-in account during refresh',()=>{
    const {rerender}=render(<MemoryRouter><RequireAuthAI><input aria-label="photo" defaultValue="selected"/></RequireAuthAI></MemoryRouter>);
    const original=screen.getByLabelText('photo');
    state.loading=true;
    rerender(<MemoryRouter><RequireAuthAI><input aria-label="photo" defaultValue="selected"/></RequireAuthAI></MemoryRouter>);
    expect(screen.getByLabelText('photo')).toBe(original);
    state.loading=false;
  });
});