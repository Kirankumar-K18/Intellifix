import React from "react";
import {
  FiInfo,
  FiCheckCircle,
  FiMapPin,
  FiImage,
  FiAlertCircle,
  FiBell,
  FiStar,
  FiShield,
  FiMail,
  FiPhone,
  FiUser,
  FiArrowRight,
} from "react-icons/fi";

import { Layout } from "../components/common/Layout";
import { Card } from "../components/common/Card";

export default function HelpSupport() {
  // Change these details to your actual System Admin contact details
  const ADMIN = {
    name: "System Administrator",
    email: "intellifix@gmail.com",
    phone: "+91 XXXXX XXXXX",
  };

  const guidelines = [
    {
      icon: <FiInfo />,
      title: "Provide Accurate Information",
      text: "Use a clear complaint title and provide enough information for the responsible department to understand the issue.",
    },
    {
      icon: <FiMapPin />,
      title: "Provide the Correct Location",
      text: "Ensure that the location provided accurately represents where the reported issue exists.",
    },
    {
      icon: <FiImage />,
      title: "Upload Relevant Evidence",
      text: "Upload genuine and relevant images that clearly show the reported issue whenever possible.",
    },
    {
      icon: <FiAlertCircle />,
      title: "Avoid Duplicate Complaints",
      text: "Avoid repeatedly submitting the same issue. Track the existing complaint for further updates.",
    },
    {
      icon: <FiShield />,
      title: "Use Appropriate Content",
      text: "Do not submit abusive, misleading, fraudulent, or unrelated information through the platform.",
    },
    {
      icon: <FiBell />,
      title: "Track Complaint Progress",
      text: "Use your dashboard and notifications to monitor complaint status and important updates.",
    },
    {
      icon: <FiStar />,
      title: "Provide Genuine Feedback",
      text: "After resolution, provide an honest rating based on your experience with the complaint resolution process.",
    },
    {
      icon: <FiCheckCircle />,
      title: "Use IntelliFix Responsibly",
      text: "Use the platform only for genuine complaints and cooperate with the responsible department during resolution.",
    },
  ];

  const process = [
    {
      number: "01",
      title: "Report",
      text: "Submit the issue with a clear description, location and supporting evidence.",
    },
    {
      number: "02",
      title: "Analyze",
      text: "IntelliFix assists with complaint classification and priority identification.",
    },
    {
      number: "03",
      title: "Review",
      text: "The responsible department reviews the submitted complaint.",
    },
    {
      number: "04",
      title: "Assign",
      text: "The department administrator assigns the issue to an appropriate worker.",
    },
    {
      number: "05",
      title: "Resolve",
      text: "The assigned worker handles the issue and updates its resolution status.",
    },
    {
      number: "06",
      title: "Feedback",
      text: "After resolution, the citizen can provide feedback and a service rating.",
    },
  ];

  return (
    <Layout title="Help & Support">
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* HERO */}

        <div
          style={{
            padding: "38px 34px",
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(13,110,253,.14), rgba(91,91,214,.10))",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 20,
              background: "rgba(13,110,253,.10)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            <FiInfo />
            INTELLIFIX HELP CENTER
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 30,
              color: "var(--text-primary)",
            }}
          >
            How can we help you?
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 760,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            Learn more about IntelliFix, understand the complaint resolution
            process, review platform guidelines, and find support information
            whenever you need assistance.
          </p>
        </div>

        {/* ABOUT */}

        <Card style={{ padding: 30 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(13,110,253,.12)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <FiInfo />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                  color: "var(--text-primary)",
                }}
              >
                About IntelliFix
              </h2>

              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  marginTop: 3,
                }}
              >
                Intelligent Complaint Management & Resolution
              </div>
            </div>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              margin: 0,
              fontSize: 14,
            }}
          >
            IntelliFix is an intelligent complaint management and resolution
            platform designed to simplify how issues are reported, assigned,
            tracked and resolved. The platform connects citizens, department
            administrators and workers through a structured workflow while
            providing intelligent assistance for complaint classification and
            prioritization.
          </p>

          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              margin: "12px 0 0",
              fontSize: 14,
            }}
          >
            Through status tracking, notifications, analytics, location
            information and feedback, IntelliFix aims to improve transparency,
            accountability and efficiency throughout the complaint resolution
            process.
          </p>
        </Card>

        {/* HOW IT WORKS */}

        <Card style={{ padding: 30 }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 19,
              color: "var(--text-primary)",
            }}
          >
            How IntelliFix Works
          </h2>

          <p
            style={{
              margin: "0 0 24px",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            A complaint moves through a structured resolution workflow.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
              gap: 12,
            }}
          >
            {process.map((item, index) => (
              <div
                key={item.number}
                style={{
                  position: "relative",
                  padding: 18,
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  background: "var(--bg-card)",
                  minHeight: 145,
                }}
              >
                <div
                  style={{
                    color: "var(--primary)",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  {item.number}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 7,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </div>

                {index < process.length - 1 && (
                  <FiArrowRight
                    style={{
                      position: "absolute",
                      right: -10,
                      top: "50%",
                      zIndex: 2,
                      color: "var(--primary)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* GUIDELINES */}

        <Card style={{ padding: 30 }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 19,
              color: "var(--text-primary)",
            }}
          >
            Complaint Guidelines
          </h2>

          <p
            style={{
              margin: "0 0 22px",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Follow these guidelines to help departments process complaints
            effectively.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {guidelines.map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  gap: 13,
                  padding: 16,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    minWidth: 36,
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(13,110,253,.10)",
                    color: "var(--primary)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontSize: 13,
                      marginBottom: 5,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SUPPORT */}

        <Card style={{ padding: 30 }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 19,
              color: "var(--text-primary)",
            }}
          >
            Help & Support
          </h2>

          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            If you experience problems with your account, complaint submission,
            system access, or another IntelliFix feature, contact the System
            Administrator for assistance.
          </p>

          <div
            style={{
              padding: 22,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background:
                "linear-gradient(135deg, rgba(13,110,253,.07), transparent)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
                color: "var(--primary)",
                marginBottom: 16,
              }}
            >
              SYSTEM ADMINISTRATOR
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <SupportRow
                icon={<FiUser />}
                label="Administrator"
                value={ADMIN.name}
              />

              <SupportRow
                icon={<FiMail />}
                label="Email"
                value={ADMIN.email}
              />

              <SupportRow
                icon={<FiPhone />}
                label="Phone"
                value={ADMIN.phone}
              />
            </div>
          </div>
        </Card>

        {/* FOOTER */}

        <div
          style={{
            textAlign: "center",
            padding: "8px 20px 24px",
            color: "var(--text-secondary)",
            fontSize: 12,
          }}
        >
          <strong style={{ color: "var(--text-primary)" }}>
            IntelliFix
          </strong>{" "}
          — Intelligent Complaint Management & Resolution
        </div>
      </div>
    </Layout>
  );
}

function SupportRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(13,110,253,.10)",
          color: "var(--primary)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 11,
            marginBottom: 2,
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}