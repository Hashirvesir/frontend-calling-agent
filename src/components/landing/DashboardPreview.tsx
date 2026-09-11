import { ChartLine, Phone, Bot, Calendar, Users, Settings, PhoneIncoming, PhoneOutgoing } from '../Icons';

const callData = [
  { dir: 'in', number: '+1 (415) 555-0142', agent: 'Inbound triage', outcome: 'Resolved', dur: '02:47', lat: '312ms', live: true },
  { dir: 'in', number: '+92 300 1234567', agent: 'Inbound triage', outcome: 'Voicemail', dur: '00:48', lat: '287ms', live: false },
  { dir: 'out', number: '+1 (212) 555-0931', agent: 'Sales outbound', outcome: 'Booked', dur: '04:11', lat: '358ms', live: false },
  { dir: 'in', number: '+44 20 7946 0958', agent: 'After-hours', outcome: 'Resolved', dur: '01:22', lat: '298ms', live: false },
  { dir: 'in', number: '+1 (628) 555-0114', agent: 'Inbound triage', outcome: 'Escalated', dur: '05:33', lat: '344ms', live: false },
  { dir: 'out', number: '+33 1 70 18 70 25', agent: 'Sales outbound', outcome: 'Booked', dur: '03:18', lat: '411ms', live: false },
];

const sidebarItems = [
  { icon: <ChartLine size={15} />, label: 'Overview' },
  { icon: <Phone size={15} />, label: 'Calls', active: true },
  { icon: <Bot size={15} />, label: 'Agents', badge: '4' },
  { icon: <Calendar size={15} />, label: 'Schedules' },
  { icon: <Users size={15} />, label: 'Team' },
];

function outcomeColor(outcome: string) {
  if (outcome === 'Resolved' || outcome === 'Booked') return 'var(--status-success)';
  if (outcome === 'Escalated') return 'var(--status-warn)';
  return 'var(--fg-3)';
}

export default function DashboardPreview() {
  return (
    <section style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '11px',
          color: 'var(--fg-3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          DASHBOARD
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
          marginBottom: '12px',
        }}>
          See every call, in real time.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fg-2)', maxWidth: '480px', margin: '0 auto' }}>
          Monitor live calls, track resolution rates, and manage your agents — all from one place.
        </p>
      </div>

      {/* Browser Chrome */}
      <div style={{
        borderRadius: '16px',
        border: '1px solid var(--border-2)',
        overflow: 'hidden',
        background: 'var(--surface-1)',
      }}>
        {/* Chrome top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-1)',
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div style={{
            flex: 1,
            maxWidth: '300px',
            height: '24px',
            borderRadius: '6px',
            background: 'var(--surface-3)',
            border: '1px solid var(--border-1)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '11px',
            color: 'var(--fg-3)',
          }}>
            app.invenco.ai/calls
          </div>
        </div>

        {/* App Interior */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          minHeight: '520px',
        }}>
          {/* Sidebar */}
          <div style={{
            borderRight: '1px solid var(--border-1)',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {sidebarItems.map(item => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: item.active ? 'var(--tint-3)' : 'transparent',
                  color: item.active ? 'var(--fg-0)' : 'var(--fg-2)',
                  fontSize: '13px',
                  fontWeight: item.active ? 500 : 400,
                }}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'var(--tint-3)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '4px',
                    padding: '0 5px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-geist-mono)',
                    color: 'var(--fg-2)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-1)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: '8px',
                color: 'var(--fg-2)',
                fontSize: '13px',
              }}>
                <Settings size={15} /> Settings
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ padding: '20px', overflow: 'hidden' }}>
            {/* Header + Metrics */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fg-0)', marginBottom: '4px' }}>Calls</div>
              <div style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '11px',
                color: 'var(--fg-3)',
                marginBottom: '16px',
              }}>
                Today · 312 inbound · 47 outbound
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'ANSWERED', value: '98.4%' },
                  { label: 'AVG LATENCY', value: '312ms' },
                  { label: 'AVG DURATION', value: '2:47' },
                  { label: 'ESCALATIONS', value: '3.1%' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'var(--tint-2)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '9px', color: 'var(--fg-3)', letterSpacing: '0.08em', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--fg-0)' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Table */}
            <div style={{
              borderRadius: '8px',
              border: '1px solid var(--border-1)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '20px 1fr 1fr 80px 50px 50px',
                gap: '8px',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-1)',
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10px',
                color: 'var(--fg-3)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                <div></div>
                <div>NUMBER</div>
                <div>AGENT</div>
                <div>OUTCOME</div>
                <div>DUR</div>
                <div>LAT</div>
              </div>
              {callData.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr 1fr 80px 50px 50px',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: i < callData.length - 1 ? '1px solid var(--border-1)' : 'none',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: 'var(--fg-3)' }}>
                    {row.dir === 'in' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                  </div>
                  <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--fg-1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {row.number}
                    {row.live && <span className="pill live" style={{ height: '16px', fontSize: '9px' }}><span className="dot" />LIVE</span>}
                  </div>
                  <div style={{ color: 'var(--fg-2)', fontSize: '11px' }}>{row.agent}</div>
                  <div style={{ color: outcomeColor(row.outcome), fontSize: '11px', fontFamily: 'var(--font-geist-mono)' }}>{row.outcome}</div>
                  <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--fg-3)' }}>{row.dur}</div>
                  <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--fg-3)' }}>{row.lat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
