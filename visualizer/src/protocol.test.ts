import { describe, expect, it } from 'vitest';
import { DEFAULT_AGENT, sanitizeAgentId } from './protocol';

describe('sanitizeAgentId', () => {
  it('普通の識別子はそのまま通す', () => {
    expect(sanitizeAgentId('cloud-1')).toBe('cloud-1');
    expect(sanitizeAgentId('my_agent')).toBe('my_agent');
  });

  it('大文字は小文字にならす', () => {
    expect(sanitizeAgentId('Cloud-Agent')).toBe('cloud-agent');
  });

  it('記号や空白は - に置換する', () => {
    expect(sanitizeAgentId('agent one!')).toBe('agent-one-');
  });

  it('32文字で切り詰める', () => {
    expect(sanitizeAgentId('a'.repeat(50))).toHaveLength(32);
  });

  it('空・文字列以外は既定の agent に落とす', () => {
    expect(sanitizeAgentId('')).toBe(DEFAULT_AGENT);
    expect(sanitizeAgentId('   ')).toBe(DEFAULT_AGENT);
    expect(sanitizeAgentId(undefined)).toBe(DEFAULT_AGENT);
    expect(sanitizeAgentId(42)).toBe(DEFAULT_AGENT);
  });
});
