import { describe,it,expect,vi } from 'vitest';
vi.mock('./nativeApp',()=>({isNativeApp:()=>false}));
import {voiceKind,voicePhrase,speakNotification,setVoiceNotify} from './voiceNotify';
describe('Spoken MED ALL messages',()=>{
 it('uses a distinct transfer phrase',()=>{expect(voiceKind('Yangi o‘tkazma','Pul qabul qilindi')).toBe('transfer');expect(voicePhrase('transfer')).toBe("MED ALL. Sizda yangi o'tkazma bor.");});
 it('speaks a private-safe phrase, not patient content, and skips appointment reminders',async()=>{
  const speak=vi.fn();vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}});vi.stubGlobal('speechSynthesis',{speak,getVoices:()=>[]});setVoiceNotify(true);
  await speakNotification('new-private-message','Yangi xabar','Private patient diagnosis');
  expect(speak.mock.calls[0][0].text).toBe('MED ALL. Sizda yangi xabar bor.');
  await speakNotification('appointment-test','Qabul eslatmasi');expect(speak).toHaveBeenCalledTimes(1);vi.unstubAllGlobals();
 });
});
import { uzForRussianVoice } from './voiceNotify';
describe('uzForRussianVoice', () => {
  it('transliterates Uzbek phrase for Russian voices', () => {
    expect(uzForRussianVoice("MED ALL. Sizda yangi o'tkazma bor.")).toBe('Мед Олл. Сизда янги утказма бор.');
  });
});
