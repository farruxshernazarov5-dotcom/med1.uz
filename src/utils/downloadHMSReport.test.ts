import { describe, expect, it } from 'vitest';
import { generateHTML } from './downloadHMSReport';
describe('HMS report text escaping', () => {
  it('renders stored markup as text in headers, cells and narrative', () => {
    const attack = '<img src=x onerror="alert(1)">';
    const html = generateHTML({ title: attack, moduleType: attack, clinicName: attack, generatedBy: attack, sections: [{ heading: attack, content: attack }], tables: [{ title: attack, table: { headers: [attack], rows: [[attack]] } }], kpiCards: [{label: attack, value: attack}] });
    expect(html).not.toContain(attack);
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});