import { describe,it,expect } from 'vitest';
import {allowedReelUrl,reelFileError} from './reels';
describe('Reels sources',()=>{
 it('allows a genuine social video link but rejects lookalike and unsafe hosts',()=>{expect(allowedReelUrl('https://www.instagram.com/reel/abc/')).toBe(true);expect(allowedReelUrl('https://youtube.com.evil.test/x')).toBe(false);expect(allowedReelUrl('javascript:alert(1)')).toBe(false);});
 it('checks actual upload format and size',()=>{expect(reelFileError({type:'video/mp4',size:1000})).toBeNull();expect(reelFileError({type:'text/html',size:1000})).not.toBeNull();expect(reelFileError({type:'video/mp4',size:51*1024*1024})).not.toBeNull();});
});