import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";
import { SITE_NAME } from "@/lib/constants";

interface ContactNotificationEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactNotificationEmail({
  name,
  email,
  subject,
  message,
}: ContactNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New contact form message from {name}: {subject}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>{SITE_NAME}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>New Contact Form Message</Text>
            <Text style={paragraph}>
              You received a new message through the contact form.
            </Text>

            <Hr style={divider} />

            <Section style={fieldGroup}>
              <Text style={fieldLabel}>From</Text>
              <Text style={fieldValue}>{name}</Text>
            </Section>

            <Section style={fieldGroup}>
              <Text style={fieldLabel}>Email</Text>
              <Text style={fieldValueLink}>{email}</Text>
            </Section>

            <Section style={fieldGroup}>
              <Text style={fieldLabel}>Subject</Text>
              <Text style={fieldValue}>{subject}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={fieldLabel}>Message</Text>
            <Section style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={footerText}>
              Reply directly to this email to respond to {name} at {email}.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerBrand}>{SITE_NAME} — Admin Notification</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px",
  textAlign: "center" as const,
};

const headerText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: 0,
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "32px 24px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 8px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 12px 0",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "20px 0",
};

const fieldGroup: React.CSSProperties = {
  marginBottom: "12px",
};

const fieldLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px 0",
};

const fieldValue: React.CSSProperties = {
  fontSize: "15px",
  color: "#18181b",
  margin: 0,
};

const fieldValueLink: React.CSSProperties = {
  fontSize: "15px",
  color: "#2563eb",
  margin: 0,
};

const messageBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "8px",
};

const messageText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#18181b",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: 0,
};

const footer: React.CSSProperties = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerBrand: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  margin: 0,
};
