import React from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonButton,
} from "@ionic/react";
import Layout from "./Layout";


const cardStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
};

const headingStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "14px",
  color: "#0f172a",
};

const textStyle = {
  fontSize: "15px",
  color: "#475569",
  lineHeight: "1.9",
  marginBottom: "10px",
};

const numberStyle = {
  width: "32px",
  height: "32px", 
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "18px",
  flexShrink: 0,
};

const Privacy: React.FC = () => {
  return (
    <Layout title="Privacy" activeNav="Privacy">
      <IonContent fullscreen>
        <div
          style={{
            minHeight: "100vh",
            background:
              "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
            padding: "24px 16px 50px",
          }}
        >
          {/* Top Header */}
          <div
            style={{
              maxWidth: "950px",
              margin: "0 auto 30px",
              background:
                "linear-gradient(135deg, #1a1818 100%,  #ec966410 0%)",
              borderRadius: "28px",
              padding: "40px 28px",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "160px",
                height: "160px",
                background: "rgba(255,255,255,0.12)",
                borderRadius: "50%",
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: "-50px",
                left: "-50px",
                width: "180px",
                height: "180px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "50%",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>


              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                Privacy & Conditions
              </h1>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.8",
                  opacity: 0.95,
                  maxWidth: "700px",
                }}
              >
                Please read the following seller policies carefully.

              </p>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              maxWidth: "950px",
              margin: "0 auto",
            }}
          >
            {/* Product Responsibility */}
            <div style={cardStyle}>
              <div style={headingStyle}>

                <div style={numberStyle}>1</div>

                Product Responsibility
              </div>

              <p style={textStyle}>
                The Seller shall bear full responsibility for the goods
                supplied by them.
              </p>

              <p style={textStyle}>
                The Seller shall ensure the quality, expiration status,
                authenticity, and legality of the products.
              </p>
            </div>

            {/* Returns */}

            <div style={cardStyle}>
              <div style={headingStyle}>

                <div style={numberStyle}>2</div>

                Returns & Complaints
              </div>

              <p style={textStyle}>
                It shall be the Seller's responsibility to respond to
                customer returns, complaints, or disputes.
              </p>

              <p style={textStyle}>
                In the event of any product-related issues, the liability
                for replacement or refund shall rest with the Seller.
              </p>
            </div>

            {/* Delivery */}
            <div style={cardStyle}>
              <div style={headingStyle}>

                <div style={numberStyle}>3</div>

                Delivery Charges
              </div>

              <p style={textStyle}>
                The Seller shall bear the delivery charges as stipulated
                in the agreement.
              </p>

              <p style={textStyle}>
                Charges shall also be applicable to the Seller in cases
                of product returns or failed deliveries.
              </p>
            </div>

            {/* Violations */}
            <div
              style={{
                ...cardStyle,
               
                background: "#fff7f7",
              }}
            >
              <div style={headingStyle}>

                <div
                  style={{
                    ...numberStyle,
                   
                  }}
                >
                  4
                </div>

                Policy Violations
              </div>

              <p style={textStyle}>
                Supplying incorrect products, duplicate items, or engaging
                in fraudulent activities may result in the suspension or
                termination of the Seller's account.
              </p>

              <p style={textStyle}>
                Legal action may also be initiated if deemed necessary.
              </p>

              <p style={textStyle}>
                Additionally, if a customer pursues legal action regarding
                the goods, the sole responsibility for such matters shall
                lie with the Seller.
              </p>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                marginTop: "40px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              © 2026 Vendor Panel — All Rights Reserved
            </div>
          </div>
        </div>
      </IonContent>
    </Layout>
  );
};

export default Privacy;