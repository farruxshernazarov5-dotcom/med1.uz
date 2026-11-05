import { beforeEach, describe, expect, it } from 'vitest';
import { isClickExperience } from './clickExperiencePolicy';
describe('Click excludes advertising throughout its visit', () => {
  beforeEach(() => sessionStorage.clear());
  it('excludes Click entry and profile', () => {
    expect(isClickExperience('/click')).toBe(true);
    expect(isClickExperience('/click/profile')).toBe(true);
    expect(isClickExperience('/clinics')).toBe(false);
  });
  it('keeps AI pages ad-free after arriving from Click', () => {
    sessionStorage.setItem('med1_click_entry', '1');
    expect(isClickExperience('/ai-cosmetology')).toBe(true);
  });
});