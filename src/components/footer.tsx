import React from "react";
import { useHistory } from "react-router-dom";

const Footer: React.FC = () => {
    const history = useHistory();

    return (
        <footer
            style={{
                background: "linear-gradient(180deg,#1A1714 0%,#0F0C0A 100%)",
                padding: "20px 15px",
                marginTop: "auto",
                width: "100%",
            }}
        >
            <div
                style={{
                    maxWidth: 1400,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "15px",
                }}
            >
                {/* Left Side */}
                <div
                    style={{
                        flex: "1 1 200px",
                    }}
                ></div>

                {/* Center Links */}
                <div
                    style={{
                        flex: "1 1 300px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "rgba(247,119,14,0.99)",
                        lineHeight: 1.8,
                    }}
                >
                    {/* Terms */}
                    <span
                        style={{
                            cursor: "pointer",
                            display: "inline-block",
                            margin: "5px 10px",
                        }}
                        onClick={() => history.push("/terms")}
                    >
                        Terms & Conditions
                    </span>

                    <span style={{ opacity: 0.6 }}>|</span>

                    {/* Privacy */}
                    <span
                        style={{
                            cursor: "pointer",
                            display: "inline-block",
                            margin: "5px 10px",
                        }}
                        onClick={() => history.push("/privacy")}
                    >
                        Privacy Policy
                    </span>
                </div>

                {/* Right Side */}
                <div
                    style={{
                        flex: "1 1 250px",
                        textAlign: "right",
                        fontSize: 12,
                        color: "rgba(247,119,14,0.99)",
                        lineHeight: 1.6,
                    }}
                >
                    © {new Date().getFullYear()}{" "}
                    <a
                        href="https://shriecom.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "inherit",
                            textDecoration: "none",
                        }}
                    >
                        Shri Enterprises
                    </a>

                    <div style={{ fontSize: 11 }}>
                        Made with ❤️ in India
                    </div>
                </div>
            </div>

            {/* Mobile Responsive */}
            <style>
                {`
                @media (max-width: 768px) {
                    footer div[style] {
                        text-align: center !important;
                    }
                }
                `}
            </style>
        </footer>
    );
};

export default Footer;