import React from "react";
import { IonIcon } from "@ionic/react";
import { documentTextOutline } from "ionicons/icons";
import Layout from "./Layout";

const TermsPage: React.FC = () => {
    const terms = [
        {
            title: "1. Acceptance of Terms",
            desc: "By downloading, installing, or using the Shri Bazar app, you agree to these Terms of Service.",
        },
        {
            title: "2. Use of Service",
            desc: "The Shri Bazar app provides an online delivery platform.",
        },
        {
            title: "3. Orders & Payments",
            desc: "All orders placed are subject to availability.",
        },
        {
            title: "4. Delivery Policy",
            desc: "Delivery times may vary depending on distance and weather.",
        },
        {
            title: "5. Returns & Refunds",
            desc: "Refunds will be processed within 24–48 hours.",
        },
        {
            title: "6. Prohibited Conduct",
            desc: "You may not use the App for unlawful purposes.",
        },
        {
            title: "7. Intellectual Property",
            desc: "All content is protected by intellectual property laws.",
        },
        {
            title: "8. Limitation of Liability",
            desc: "Shri Bazar shall not be liable for indirect damages.",
        },
        {
            title: "9. Governing Law",
            desc: "These terms are governed by the laws of India.",
        },
    ];

    return (
        <Layout title="Terms & Conditions" activeNav="terms">

            <div style={styles.page}>

                {/* Hero Section */}
                <div style={styles.hero}>
                    <IonIcon
                        icon={documentTextOutline}
                        style={styles.heroIcon}
                    />

                    <h1 style={styles.heroTitle}>
                        Terms of Service
                    </h1>

                    <p style={styles.heroText}>
                        Please read these terms carefully before using our services
                    </p>
                </div>

                {/* Terms Cards */}
                <div style={styles.cardWrap}>
                    {terms.map((item, index) => (
                        <div key={index} style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                {item.title}
                            </h3>

                            <p style={styles.cardDesc}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

            </div>

        </Layout>
    );
};

export default TermsPage;

const styles: any = {
    page: {
        background: "#F7F4E9",
        minHeight: "100%",
    },

    hero: {
        background: "linear-gradient(180deg,#1A1714 0%,#0F0C0A 100%)",
        padding: "35px 20px",
        textAlign: "center",
        color: "#fff",
        borderRadius: 20,
    },

    heroIcon: {
        fontSize: 28,
        marginBottom: 10,
    },

    heroTitle: {
        fontSize: 28,
        fontWeight: 700,
        margin: 0,
    },

    heroText: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 10,
    },

    cardWrap: {
        marginTop: 20,
        display: "flex",
        flexDirection: "column",
        gap: 15,
    },

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 18,
        border: "1px solid #E8E2D3",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 10,
        color: "#1A1714",
    },

    cardDesc: {
        fontSize: 14,
        lineHeight: 1.7,
        color: "#555",
        margin: 0,
    },
};