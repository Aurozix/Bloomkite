import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export function VerifyEmailOtp({ code }: { code: string }) {
  return (
    <Html>
      <Head />
      <Preview>Your Bloomkite verification code is {code}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Your verification code</Heading>
          <Text style={paragraph}>
            Enter this code in Bloomkite to finish setting up your account.
          </Text>
          <Section style={codeSection}>
            <Text style={codeStyle}>{code}</Text>
          </Section>
          <Text style={muted}>
            This code expires in 10 minutes. If you didn&apos;t request it, you can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = { backgroundColor: '#f6f6f0', fontFamily: 'Inter, Arial, sans-serif' }
const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  maxWidth: '560px',
  borderRadius: '12px',
}
const heading = { fontSize: '24px', color: '#0f3d2e', marginBottom: '16px' }
const paragraph = { fontSize: '16px', color: '#333', lineHeight: '24px' }
const codeSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f6f6f0',
  borderRadius: '8px',
}
const codeStyle = {
  fontSize: '36px',
  letterSpacing: '12px',
  fontWeight: 700,
  color: '#0f3d2e',
  margin: 0,
  fontFamily: 'JetBrains Mono, Menlo, monospace',
}
const muted = { fontSize: '13px', color: '#777', lineHeight: '20px' }
