export default function SponsorPage() {
  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      color: '#f0f0f0',
      fontFamily: "'Arial', 'Barlow Condensed', sans-serif",
      padding: '0 0 80px 0',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;500;600;700&family=Inter:wght@700;900&display=swap');

        .sp-hero {
          position: relative;
          padding: 72px 24px 52px;
          text-align: center;
          overflow: hidden;
        }
        .sp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 100% 70% at 50% 0%, rgba(146,52,235,0.3) 0%, transparent 65%);
          pointer-events: none;
        }
        .sp-hero::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(146,52,235,0.3), transparent);
        }
        .sp-eyebrow {
          display: inline-block;
          font-family: 'Inter', Arial;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #9234eb;
          border: 1px solid rgba(146,52,235,0.4);
          padding: 6px 16px;
          border-radius: 2px;
          margin-bottom: 20px;
        }
        .sp-title {
          font-family: 'Inter', Arial;
          font-size: clamp(28px, 6vw, 52px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.05;
          margin: 0 0 20px;
          background: linear-gradient(135deg, #ffffff 0%, #c084fc 60%, #9234eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sp-subtitle {
          font-size: 17px;
          color: rgba(240,240,240,0.6);
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.65;
        }

        .sp-section-label {
          font-family: 'Inter', Arial;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #9234eb;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 680px;
          padding: 0 20px;
          margin: 48px auto 24px;
        }
        .sp-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(146,52,235,0.25);
        }

        /* Activations grid */
        .sp-activations {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 560px) {
          .sp-activations { grid-template-columns: 1fr 1fr; }
        }
        .sp-act-card {
          background: #121212;
          border: 1px solid rgba(146,52,235,0.18);
          border-radius: 8px;
          padding: 22px 16px 18px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .sp-act-card:hover {
          border-color: rgba(146,52,235,0.45);
        }
        .sp-act-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #9234eb, rgba(192,132,252,0.4), transparent);
        }
        .sp-act-icon {
          font-size: 26px;
          margin-bottom: 10px;
          display: block;
        }
        .sp-act-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,240,0.8);
          line-height: 1.4;
          letter-spacing: 0.02em;
        }

        /* Stat bar */
        .sp-stats {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 520px) {
          .sp-stats { grid-template-columns: 1fr; }
        }
        .sp-stat-card {
          background: #121212;
          border: 1px solid rgba(146,52,235,0.15);
          border-radius: 8px;
          padding: 24px 16px;
          text-align: center;
        }
        .sp-stat-num {
          font-family: 'Inter', Arial;
          font-size: 30px;
          font-weight: 900;
          background: linear-gradient(135deg, #c084fc, #9234eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 6px;
        }
        .sp-stat-label {
          font-size: 12px;
          color: rgba(240,240,240,0.45);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* CTA Card */
        .sp-cta-wrap {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .sp-cta-card {
          background: #121212;
          border: 1px solid rgba(146,52,235,0.3);
          border-radius: 12px;
          padding: 40px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .sp-cta-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #9234eb, #c084fc, #9234eb);
        }
        .sp-cta-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(146,52,235,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .sp-cta-title {
          font-family: 'Inter', Arial;
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          margin: 0 0 12px;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 1;
        }
        .sp-cta-desc {
          font-size: 16px;
          color: rgba(240,240,240,0.6);
          max-width: 400px;
          margin: 0 auto 28px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        .sp-cta-btn {
          display: inline-block;
          background: linear-gradient(135deg, #9234eb 0%, #7c22d4 100%);
          color: #fff;
          font-family: 'Inter', Arial;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 36px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          position: relative;
          z-index: 1;
          transition: opacity 0.2s, transform 0.15s;
          text-decoration: none;
          box-shadow: 0 0 24px rgba(146,52,235,0.4);
        }
        .sp-cta-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 32px rgba(146,52,235,0.55);
        }
        .sp-cta-btn:active {
          transform: translateY(0px);
        }
      `}</style>

      {/* Hero */}
      <div className="sp-hero">
        <div className="sp-eyebrow">Partnerships</div>
        <h1 className="sp-title">Sponsor The Race</h1>
        <p className="sp-subtitle">
          Put your brand at the center of a daily live esport experience. Pinball Race creates memorable branded moments that players actively engage with.
        </p>
      </div>

      {/* Activation types */}
      <div className="sp-section-label">Activation Types</div>
      <div className="sp-activations">
        {[
          { icon: '🎁', label: 'Product Giveaways' },
          { icon: '🏁', label: 'Branded Race Events' },
          { icon: '📲', label: 'Social Winner Content' },
          { icon: '📺', label: 'Live Stream Visibility' },
          { icon: '🙋', label: 'Real Audience Interaction' },
          { icon: '🏆', label: 'Championship Sponsorship' },
        ].map(a => (
          <div key={a.label} className="sp-act-card">
            <span className="sp-act-icon">{a.icon}</span>
            <span className="sp-act-label">{a.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="sp-section-label">The Audience</div>
      <div className="sp-stats">
        {[
          { num: 'Daily', label: 'Live Races' },
          { num: '3×', label: 'On-Demand Per Player' },
          { num: '5 Days', label: 'Weekly Broadcast' },
        ].map(s => (
          <div key={s.label} className="sp-stat-card">
            <div className="sp-stat-num">{s.num}</div>
            <div className="sp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="sp-section-label">Get Involved</div>
      <div className="sp-cta-wrap">
        <div className="sp-cta-card">
          <div className="sp-cta-title">Request Sponsor Deck</div>
          <p className="sp-cta-desc">
            Get our sponsorship opportunities, audience insights, and activation ideas — sent directly to you.
          </p>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSel4Rrfj9uqxpgoYaiIBUcxswgbXwAiDJAY2mR9M_6wkHD9Aw/viewform" className="sp-cta-btn">Apply Now</a>
        </div>
      </div>
    </div>
  );
}