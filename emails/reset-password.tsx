import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export function ResetPassword({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Bloomkite password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>
            You (or someone using your email) requested a password reset for your
            Bloomkite account. Click the button below to set a new password.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={resetUrl}>
              Reset password
            </Button>
          </Section>
          <Text style={muted}>
            Or paste this link into your browser:
            <br />
            {resetUrl}
          </Text>
          <Text style={muted}>
            This link expires in 1 hour and can be used only once. If you didn&apos;t
            request a reset, you can safely ignore this email — your password will
            not change.
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
const button = {
  backgroundColor: '#2a7f5f',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 600,
  display: 'inline-block',
}
const muted = { fontSize: '13px', color: '#777', lineHeight: '20px' }
