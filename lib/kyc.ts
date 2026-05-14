// KYC helpers (BRD §12.4). PAN + optional Aadhaar capture for premium tier.
//
// Storage strategy: SHA-256 hash of the canonicalised ID + last 4 digits in
// plain form. The hash lets us match (e.g. "is anyone else using this PAN?"
// without leaking it on a DB compromise; the last-4 lets support staff
// confirm a user over the phone without sending the full ID.

import crypto from 'crypto'

/// Indian PAN: 5 letters + 4 digits + 1 letter, case-insensitive on input,
/// always uppercased before validation/hashing. The 4th letter encodes the
/// holder type (P=individual, C=company, etc.) — we don't enforce that here
/// since accepting all valid PANs is safer than rejecting edge cases.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/

/// Aadhaar: 12 digits, no spaces. Some providers issue with spaces (e.g.
/// "1234 5678 9012") which we strip before validation.
const AADHAAR_DIGIT_REGEX = /^[0-9]{12}$/

export interface PanResult {
  ok: true
  canonical: string
  hash: string
  last4: string
}
export interface PanError {
  ok: false
  error: string
}

export function canonicalisePan(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

export function processPan(raw: string): PanResult | PanError {
  const canonical = canonicalisePan(raw)
  if (!PAN_REGEX.test(canonical)) {
    return { ok: false, error: 'PAN must be 10 chars: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)' }
  }
  return {
    ok: true,
    canonical,
    hash: crypto.createHash('sha256').update(canonical).digest('hex'),
    last4: canonical.slice(-4),
  }
}

export interface AadhaarResult {
  ok: true
  canonical: string
  hash: string
  last4: string
}
export interface AadhaarError {
  ok: false
  error: string
}

export function canonicaliseAadhaar(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

export function processAadhaar(raw: string): AadhaarResult | AadhaarError {
  const canonical = canonicaliseAadhaar(raw)
  if (!AADHAAR_DIGIT_REGEX.test(canonical)) {
    return { ok: false, error: 'Aadhaar must be 12 digits' }
  }
  return {
    ok: true,
    canonical,
    hash: crypto.createHash('sha256').update(canonical).digest('hex'),
    last4: canonical.slice(-4),
  }
}
