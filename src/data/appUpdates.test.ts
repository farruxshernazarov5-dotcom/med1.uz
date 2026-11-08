import { describe,it,expect } from 'vitest';
import {APP_RELEASE,isUnseenRelease} from './appUpdates';
describe('Mobile NEW releases',()=>{
 it('marks a new release until that version is read',()=>{expect(isUnseenRelease(null)).toBe(true);expect(isUnseenRelease(APP_RELEASE.version)).toBe(false);expect(isUnseenRelease('older')).toBe(true);});
});