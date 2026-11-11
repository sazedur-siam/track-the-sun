import { translations } from '../translations';

const placeholders = (template: string) => (template.match(/\{\w+\}/g) ?? []).sort();

describe('translations', () => {
  const enKeys = Object.keys(translations.en).sort();
  const bnKeys = Object.keys(translations.bn).sort();

  it('has the same keys in English and Bangla', () => {
    expect(enKeys.filter((key) => !(key in translations.bn))).toEqual([]);
    expect(bnKeys.filter((key) => !(key in translations.en))).toEqual([]);
  });

  it('uses the same {placeholders} in every language', () => {
    const mismatched = enKeys.filter(
      (key) =>
        key in translations.bn &&
        placeholders(translations.en[key]).join() !== placeholders(translations.bn[key]).join()
    );
    expect(mismatched).toEqual([]);
  });

  it('has no empty strings', () => {
    for (const lang of [translations.en, translations.bn]) {
      expect(Object.entries(lang).filter(([, value]) => !value.trim())).toEqual([]);
    }
  });
});
