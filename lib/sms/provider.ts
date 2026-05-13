// SMS provider abstraction.
//
// India SMS delivery requires a TRAI DLT-registered sender + template
// approval per operator before any production traffic is allowed (BRD §12.1).
// That's a procurement step measured in weeks, not a coding step — so we
// ship the surface with a stub provider, and the production provider gets
// plugged in once the DLT paperwork lands.
//
// Selection is by env:
//   SMS_PROVIDER=stub        — logs the OTP, also returns it from the API
//                              when NODE_ENV=development for local testing.
//                              Refuses to send in production.
//   SMS_PROVIDER=msg91|...   — TODO: wire real providers behind their own
//                              modules in lib/sms/providers/ and select here.

export type SmsProviderName = 'stub'

export interface SmsSendInput {
  to: string // E.164, e.g. "+919876543210"
  body: string
}

export interface SmsSendResult {
  // True if the provider accepted the message. For the stub provider in dev
  // this is always true; in production with stub configured it's false.
  delivered: boolean
  // The OTP code (or other body content) returned by the provider only for
  // dev-mode debugging. Production providers MUST NOT populate this.
  debugBody?: string
  // Provider-side identifier for the message, if any. Useful for log
  // correlation but not load-bearing.
  providerMessageId?: string
}

export interface SmsProvider {
  readonly name: SmsProviderName
  send(input: SmsSendInput): Promise<SmsSendResult>
}

class StubSmsProvider implements SmsProvider {
  readonly name = 'stub' as const

  async send(input: SmsSendInput): Promise<SmsSendResult> {
    if (process.env.NODE_ENV === 'production') {
      // Hard fail in production. Don't pretend we sent something.
      console.error(
        '[sms:stub] StubSmsProvider refused to send in production. ' +
          'Set SMS_PROVIDER to a real provider and complete TRAI DLT registration.',
      )
      return { delivered: false }
    }
    console.log(`[sms:stub] would send to ${input.to}: ${input.body}`)
    return {
      delivered: true,
      debugBody: input.body,
      providerMessageId: `stub-${Date.now()}`,
    }
  }
}

let cached: SmsProvider | null = null

export function getSmsProvider(): SmsProvider {
  if (cached) return cached
  const name = process.env.SMS_PROVIDER || 'stub'
  switch (name) {
    case 'stub':
      cached = new StubSmsProvider()
      return cached
    default:
      console.warn(
        `[sms] unknown SMS_PROVIDER="${name}", falling back to stub`,
      )
      cached = new StubSmsProvider()
      return cached
  }
}

/**
 * Test-only — drops the cached provider so the next getSmsProvider() picks
 * up new env. Don't call this from production code paths.
 */
export function _resetSmsProvider(): void {
  cached = null
}
