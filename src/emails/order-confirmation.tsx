import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
  Preview,
} from "@react-email/components";
import { formatPrice } from "@/lib/utils";
import { SITE_URL, SITE_NAME, BUSINESS } from "@/lib/constants";

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; priceCents: number }[];
  subtotalCents: number;
  totalCents: number;
  shippingAddress: { line1: string; city: string; state: string; zip: string };
}

export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotalCents,
  totalCents,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Order {orderNumber} confirmed — thank you for your purchase!
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>{SITE_NAME}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Order Confirmed</Text>
            <Text style={paragraph}>
              Hi {customerName || "there"},
            </Text>
            <Text style={paragraph}>
              Thank you for your order! We&apos;ve received your payment and
              are getting your items ready.
            </Text>

            <Section style={orderInfoBox}>
              <Text style={orderNumberLabel}>Order Number</Text>
              <Text style={orderNumberValue}>{orderNumber}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={sectionHeading}>Items</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemNameCol}>
                  <Text style={itemName}>
                    {item.productName}
                    {item.quantity > 1 ? ` x${item.quantity}` : ""}
                  </Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>
                    {formatPrice(item.priceCents * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            <Row style={totalRow}>
              <Column style={itemNameCol}>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column style={itemPriceCol}>
                <Text style={totalValue}>{formatPrice(subtotalCents)}</Text>
              </Column>
            </Row>
            {totalCents !== subtotalCents && (
              <Row style={totalRow}>
                <Column style={itemNameCol}>
                  <Text style={totalLabel}>Shipping</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={totalValue}>
                    {formatPrice(totalCents - subtotalCents)}
                  </Text>
                </Column>
              </Row>
            )}
            <Row style={totalRow}>
              <Column style={itemNameCol}>
                <Text style={grandTotalLabel}>Total</Text>
              </Column>
              <Column style={itemPriceCol}>
                <Text style={grandTotalValue}>{formatPrice(totalCents)}</Text>
              </Column>
            </Row>

            <Hr style={divider} />

            <Text style={sectionHeading}>Shipping Address</Text>
            <Text style={addressText}>
              {shippingAddress.line1}
              <br />
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.zip}
            </Text>

            <Hr style={divider} />

            <Section style={buttonSection}>
              <Button style={button} href={SITE_URL}>
                Visit Our Store
              </Button>
            </Section>

            <Text style={footerText}>
              If you have any questions about your order, reply to this email or
              contact us at {BUSINESS.email.support}.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerBrand}>{SITE_NAME}</Text>
            <Text style={footerMuted}>{BUSINESS.address.city}, Michigan</Text>
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
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 16px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 12px 0",
};

const orderInfoBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "16px 0",
};

const orderNumberLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px 0",
};

const orderNumberValue: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#18181b",
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "20px 0",
};

const sectionHeading: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px 0",
};

const itemRow: React.CSSProperties = {
  marginBottom: "8px",
};

const itemNameCol: React.CSSProperties = {
  width: "70%",
};

const itemPriceCol: React.CSSProperties = {
  width: "30%",
  textAlign: "right" as const,
};

const itemName: React.CSSProperties = {
  fontSize: "15px",
  color: "#18181b",
  margin: 0,
};

const itemPrice: React.CSSProperties = {
  fontSize: "15px",
  color: "#3f3f46",
  margin: 0,
  textAlign: "right" as const,
};

const totalRow: React.CSSProperties = {
  marginBottom: "4px",
};

const totalLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#71717a",
  margin: 0,
};

const totalValue: React.CSSProperties = {
  fontSize: "14px",
  color: "#3f3f46",
  margin: 0,
  textAlign: "right" as const,
};

const grandTotalLabel: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#18181b",
  margin: 0,
};

const grandTotalValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#18181b",
  margin: 0,
  textAlign: "right" as const,
};

const addressText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#3f3f46",
  margin: 0,
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "8px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#18181b",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "6px",
  display: "inline-block",
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "16px 0 0 0",
};

const footer: React.CSSProperties = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerBrand: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#71717a",
  margin: "0 0 4px 0",
};

const footerMuted: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  margin: 0,
};
