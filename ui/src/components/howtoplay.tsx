export default function HowToPlay() {
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
        @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .htp-hero {
          position: relative;
          padding: 64px 24px 48px;
          text-align: center;
          overflow: hidden;
        }
        .htp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(146,52,235,0.25) 0%, transparent 70%);
          pointer-events: none;
        }
        .htp-eyebrow {
          display: inline-block;
          font-family: 'Inter', Arial, sans-serif;
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
        .htp-title {
          font-family: 'Inter', Arial, sans-serif;
          font-size: clamp(28px, 6vw, 52px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.05;
          margin: 0 0 16px;
          background: linear-gradient(135deg, #ffffff 0%, #c084fc 60%, #9234eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .htp-subtitle {
          font-size: 17px;
          color: rgba(240,240,240,0.55);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
          letter-spacing: 0.02em;
        }
        .htp-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #9234eb, transparent);
          margin: 32px auto 0;
        }

        .htp-steps {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .htp-step {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          position: relative;
        }
        .htp-step-num-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .htp-step-num {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(146,52,235,0.15);
          border: 1.5px solid rgba(146,52,235,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 16px;
          font-weight: 900;
          color: #c084fc;
          flex-shrink: 0;
        }
        .htp-step-line {
          width: 1.5px;
          flex: 1;
          background: linear-gradient(to bottom, rgba(146,52,235,0.4), rgba(146,52,235,0.05));
          margin-top: 8px;
          min-height: 24px;
        }
        .htp-step-body {
          padding-bottom: 36px;
          flex: 1;
        }
        .htp-step-title {
          font-family: 'Inter', Arial, sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 10px 0 10px;
          letter-spacing: 0.04em;
        }
        .htp-step-desc {
          font-size: 16px;
          color: rgba(240,240,240,0.65);
          line-height: 1.65;
          margin: 0 0 14px;
        }
        .htp-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .htp-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 15px;
          color: rgba(240,240,240,0.7);
          line-height: 1.5;
        }
        .htp-bullets li::before {
          content: '▸';
          color: #9234eb;
          flex-shrink: 0;
          margin-top: 1px;
          font-size: 13px;
        }

        .htp-section-label {
          font-family: 'Inter', Arial, sans-serif;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #9234eb;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 680px;
          padding: 0 20px;
          margin-left: auto;
          margin-right: auto;
          margin-top: 40px;
        }
        .htp-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(146,52,235,0.25);
        }

        .htp-modes {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 520px) {
          .htp-modes { grid-template-columns: 1fr; }
        }
        .htp-mode-card {
          background: #121212;
          border: 1px solid rgba(146,52,235,0.2);
          border-radius: 8px;
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
        }
        .htp-mode-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #9234eb, transparent);
        }
        .htp-mode-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .htp-mode-badge {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .htp-mode-badge.live { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); }
        .htp-mode-badge.demand { background: #9234eb; box-shadow: 0 0 8px rgba(146,52,235,0.6); }
        .htp-mode-name {
          font-family: 'Inter', Arial, sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #ffffff;
        }
        .htp-mode-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .htp-mode-list li {
          font-size: 14px;
          color: rgba(240,240,240,0.6);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }
        .htp-mode-list li span.dot {
          color: #9234eb;
          flex-shrink: 0;
        }
      `}</style>

      {/* Hero */}
      <div className="htp-hero">
        <div className="htp-eyebrow">Game Guide</div>
        <h1 className="htp-title">How Pinball Race Works</h1>
        <p className="htp-subtitle">
          Free daily marble races on a real physical track. Play live at scheduled times and enter 5 on-demand races per day to climb the leaderboard.
        </p>
        <div className="htp-divider" />
      </div>

      {/* Steps */}
      <div className="htp-section-label">The Rules</div>
      <div className="htp-steps">

        {/* Step 1 */}
        <div className="htp-step">
          <div className="htp-step-num-col">
            <div className="htp-step-num">1</div>
            <div className="htp-step-line" />
          </div>
          <div className="htp-step-body">
            <div className="htp-step-title">Pick Your Marble</div>
            <p className="htp-step-desc">Before every race, choose the marble you think will win. Your chosen marble determines your points.</p>
            <ul className="htp-bullets">
              <li>Live races: pick before the countdown ends</li>
              <li>On-demand races: choose before the replay starts</li>
              <li>Every replay is unique and can only be played once</li>
            </ul>
          </div>
        </div>

        {/* Step 2 */}
        <div className="htp-step">
          <div className="htp-step-num-col">
            <div className="htp-step-num">2</div>
            <div className="htp-step-line" />
          </div>
          <div className="htp-step-body">
            <div className="htp-step-title">Watch the Race</div>
            <p className="htp-step-desc">Real physical marble races captured on track. Live races happen weekdays at 12:30 PM UK — join in real time or catch on-demand replays.</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="htp-step">
          <div className="htp-step-num-col">
            <div className="htp-step-num">3</div>
          </div>
          <div className="htp-step-body">
            <div className="htp-step-title">Earn Points &amp; Climb</div>
            <p className="htp-step-desc">Points from every race count toward your global rank, weekly championships, and prize eligibility. Use all 5 daily on-demand races to maximise your score.</p>
          </div>
        </div>

      </div>

      {/* Race Modes */}
      <div className="htp-section-label">Race Modes</div>
      <div className="htp-modes">
        <div className="htp-mode-card">
          <div className="htp-mode-header">
            <div className="htp-mode-badge live" />
            <div className="htp-mode-name">Live Races</div>
          </div>
          <ul className="htp-mode-list">
            <li><span className="dot">▸</span> Weekdays at 12:30 PM UK</li>
            <li><span className="dot">▸</span> Approx 1 hour</li>
            <li><span className="dot">▸</span> Real-time competition</li>
            <li><span className="dot">▸</span> Best for leaderboard climbing</li>
            <li><span className="dot">▸</span> Sponsor-backed prize races</li>
          </ul>
        </div>
        <div className="htp-mode-card">
          <div className="htp-mode-header">
            <div className="htp-mode-badge demand" />
            <div className="htp-mode-name">On-Demand</div>
          </div>
          <ul className="htp-mode-list">
            <li><span className="dot">▸</span> 5 per day</li>
            <li><span className="dot">▸</span> Real footage from previous races</li>
            <li><span className="dot">▸</span> Random race assignment</li>
            <li><span className="dot">▸</span> No repeat races</li>
            <li><span className="dot">▸</span> AI verified finish order</li>
          </ul>
        </div>
      </div>
    </div>
  );
}