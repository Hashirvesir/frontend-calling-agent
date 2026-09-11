"use client";

import Link from "next/link";
import { ArrowRight, Play } from "../Icons";

const WAVEFORM_BARS = 80;

function AgentTile({
  name,
  status,
  calls,
}: {
  name: string;
  status: "live" | "idle";
  calls: number;
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "10px",
        background: "var(--tint-2)",

        border: "1px solid var(--border-2)",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span
          style={{ fontSize: "13px", fontWeight: 500, color: "var(--fg-0)" }}
        >
          {name}
        </span>
        <span
          className={`pill ${status === "live" ? "live" : ""}`}
          style={{ height: "20px", fontSize: "11px" }}
        >
          <span className="dot" />
          {status}
        </span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: "11px",
          color: "var(--fg-3)",
        }}
      >
        {calls} calls today
      </span>
    </div>
  );
}

const transcriptLines = [
  {
    speaker: "USER",
    text: "Hi, I need to book a service appointment for my Civic.",
  },
  {
    speaker: "AGENT",
    text: "Of course. I can see your last visit was in March. What kind of service do you need?",
  },
  { speaker: "USER", text: "It is making a strange noise on the left turn." },
  {
    speaker: "AGENT",
    text: "I will schedule a 30 minute diagnostic. Thursday at 10 a.m. or Friday at 2 p.m.?",
  },
];

export default function Hero() {
  return (
    <section
      style={{
        paddingTop: "calc(52px + 12px + 80px)",
        paddingBottom: "80px",
        paddingLeft: "24px",
        paddingRight: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <span className="pill" style={{ gap: "6px" }}>
          <span
            style={{
              background: "var(--fg-0)",
              color: "var(--fg-inv)",
              borderRadius: "4px",
              padding: "1px 5px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            NEW
          </span>
          Multilingual, switchable mid-call
        </span>
      </div>

      {/* H1 */}
      <h1
        style={{
          fontSize: "clamp(48px, 8vw, 88px)",
          letterSpacing: "-0.04em",
          fontWeight: 600,
          lineHeight: 1.0,
          color: "var(--fg-0)",
          marginBottom: "28px",
          maxWidth: "800px",
          textAlign: "center",
          margin: "0 auto 28px",
        }}
      >
        Voice agents
        <br />
        that actually{" "}
        <em style={{ color: "var(--fg-3)", fontStyle: "italic" }}>answer.</em>
      </h1>

      {/* Subheadline */}
      <p
        style={{
          fontSize: "20px",
          color: "var(--fg-2)",
          maxWidth: "600px",
          lineHeight: 1.6,
          marginBottom: "40px",
          textAlign: "center",
          margin: "0 auto 40px",
        }}
      >
        Real-time AI that picks up on the first ring, handles natural
        conversation, and routes to a human only when it should.
      </p>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "64px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link href="/sign-up" className="btn btn-primary btn-lg">
          Start free trial <ArrowRight size={16} />
        </Link>
        <button className="btn btn-secondary btn-lg">
          <Play size={16} /> Hear it in action
        </button>
      </div>

      {/* Hero Visual */}
      <div
        style={{
          borderRadius: "20px",
          border: "1px solid var(--border-2)",
          background: "var(--tint-1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            padding: "24px",
            gap: "16px",
          }}
          className="hero-grid"
        >
          {/* Left: Agent List */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-geist-mono)",
                color: "var(--fg-3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Agents
            </div>
            <AgentTile name="Inbound triage" status="live" calls={142} />
            <AgentTile name="Sales outbound" status="idle" calls={38} />
            <AgentTile name="Appointment desk" status="live" calls={89} />
            <AgentTile name="After-hours" status="idle" calls={12} />
          </div>

          {/* Right: Live Call View */}
          <div
            style={{
              borderRadius: "12px",
              background: "var(--tint-2)",
              border: "1px solid var(--border-2)",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <span className="pill live">
                <span className="dot" />
                LIVE
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "13px",
                  color: "var(--fg-2)",
                }}
              >
                +1 (415) 555-0142
              </span>
            </div>

            {/* Waveform */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                height: "40px",
                marginBottom: "20px",
                overflow: "hidden",
              }}
            >
              {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "2px",
                    height: "6px",
                    borderRadius: "1px",
                    background: "var(--fg-3)",
                    flexShrink: 0,
                    animationName: "barAnim",
                    animationDuration: "1.4s",
                    animationTimingFunction: "var(--ease-smooth)",
                    animationIterationCount: "infinite",
                    animationDelay: `${(i * 1.4) / WAVEFORM_BARS}s`,
                  }}
                />
              ))}
            </div>

            {/* Transcript */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {transcriptLines.map((line, i) => (
                <div key={i} style={{ display: "flex", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      color:
                        line.speaker === "AGENT"
                          ? "var(--fg-2)"
                          : "var(--fg-3)",
                      flexShrink: 0,
                      paddingTop: "1px",
                      width: "42px",
                    }}
                  >
                    {line.speaker}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color:
                        line.speaker === "AGENT"
                          ? "var(--fg-1)"
                          : "var(--fg-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fade out bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background:
              "linear-gradient(to bottom, transparent, var(--canvas))",
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
