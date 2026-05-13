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

export function VerifyEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Bloomkite email</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={paragraph}>
            Welcome to Bloomkite. Click the button below to verify your email address
            and finish setting up your account.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={verifyUrl}>
              Verify email
            </Button>
          </Section>
          <Text style={muted}>
            Or paste this link into your browser:
            <br />
            {verifyUrl}
          </Text>
          <Text style={muted}>
            This link expires in 24 hours. If you didn&apos;t create a Bloomkite
            account, you can safely ignore this email.
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
