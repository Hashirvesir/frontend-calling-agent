import { Logo } from '../Icons';

const columns = [
  {
    heading: 'Product',
    links: ['Platform', 'Voice agents', 'Outbound', 'Dashboard', 'Integrations'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'API reference', 'Changelog', 'Status', 'Blog'],
  },
  {
    heading: 'Company',
    links: ['About', 'Customers', 'Pricing', 'Security', 'Careers'],
  },
  {
    heading: 'Legal',
    links: ['Privacy', 'Terms', 'DPA', 'Subprocessors', 'Trust'],
  },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-1)',
      padding: '64px 24px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr repeat(4, 1fr)',
        gap: '40px',
        marginBottom: '48px',
      }} className="footer-grid">
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-0)', marginBottom: '12px' }}>
            <Logo size={20} />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Invenco</span>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'var(--fg-3)' }}>AI</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--fg-3)', lineHeight: 1.6, maxWidth: '220px' }}>
            Voice agents that pick up on the first ring and handle real conversations at scale.
          </p>
        </div>

        {/* Link columns */}
        {columns.map(col => (
          <div key={col.heading}>
            <h4 style={{
              color: 'var(--fg-3)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontWeight: 500,
            }}>
              {col.heading}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.links.map(link => (
                <li key={link}>
                  <a
                    href="#"
                    style={{
                      fontSize: '14px',
                      color: 'var(--fg-2)',
                      textDecoration: 'none',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-2)')}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-1)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--fg-3)', fontFamily: 'var(--font-geist-mono)' }}>
          © 2026 Invenco, Inc.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--fg-4)', fontFamily: 'var(--font-geist-mono)' }}>
            SOC 2 · HIPAA · GDPR
          </span>
        </div>
      </div>
    </footer>
  );
}
