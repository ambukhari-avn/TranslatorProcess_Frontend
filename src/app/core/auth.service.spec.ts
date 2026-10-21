import { checkWorkEmail } from './auth.service';

describe('checkWorkEmail', () => {
  const allowed = ['avanceon.ae'];

  it('accepts an address on an allowed domain, ignoring case and spaces', () => {
    expect(checkWorkEmail('amna@avanceon.ae', allowed)).toBeNull();
    expect(checkWorkEmail('  Amna@AVANCEON.AE ', allowed)).toBeNull();
  });

  it('rejects text that is not an e-mail address', () => {
    for (const bad of ['', 'abc', 'a@b', 'a b@avanceon.ae', '@avanceon.ae']) {
      expect(checkWorkEmail(bad, allowed)).toBe('invalid');
    }
  });

  it('rejects a valid address on another domain', () => {
    expect(checkWorkEmail('someone@gmail.com', allowed)).toBe('domain');
    expect(checkWorkEmail('someone@evil-avanceon.ae', allowed)).toBe('domain');
  });

  it('allows any domain when none are configured', () => {
    expect(checkWorkEmail('someone@gmail.com', [])).toBeNull();
  });
});
