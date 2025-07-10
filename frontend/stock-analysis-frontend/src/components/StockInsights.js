import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function StockInsights() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState('');

  const fetchInsight = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/analyze?ticker=${ticker || 'AAPL'}`, {
        method: "GET",
        mode: "cors"
      });
      if (!res.ok) throw new Error('Failed to fetch insight');
      const data = await res.json();
      setInsight(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const IndicatorChart = ({ indicators }) => {
    if (!indicators) return null;
    const { close, rsi_14, macd, macd_hist, sma_50, sma_200 } = indicators;

    let rsiColor = '#0074D9', rsiLabel = 'Neutral';
    if (rsi_14 < 30) { rsiColor = '#2ECC40'; rsiLabel = 'Oversold'; }
    else if (rsi_14 > 70) { rsiColor = '#FF4136'; rsiLabel = 'Overbought'; }

    const macdArrow = macd > 0 ? '↑' : macd < 0 ? '↓' : '';
    const macdArrowColor = macd > 0 ? '#2ECC40' : macd < 0 ? '#FF4136' : '#888';

    const macdHistBadge = (
      <span style={{
        display: 'inline-block',
        minWidth: 32,
        padding: '2px 8px',
        borderRadius: 8,
        background: macd_hist > 0 ? '#e6f9ed' : '#ffeaea',
        color: macd_hist > 0 ? '#2ECC40' : '#FF4136',
        fontWeight: 600,
        fontSize: 13,
        marginLeft: 8,
        textAlign: 'center'
      }}>
        {macd_hist > 0 ? '+' : ''}{macd_hist}
      </span>
    );

    const smaBlock = (label, sma) => {
      const above = close > sma;
      return (
        <div style={{
          background: '#f8f9fa',
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>{sma}</div>
          <div>
            <span style={{
              background: above ? '#e6f9ed' : '#ffeaea',
              color: above ? '#2ECC40' : '#FF4136',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 13,
              fontWeight: 500,
              marginRight: 6
            }}>
              {above ? 'Above SMA' : 'Below SMA'}
            </span>
            <span style={{ color: '#888', fontSize: 13 }}>Close: {close}</span>
          </div>
        </div>
      );
    };

    return (
      <div style={{
        marginTop: 32,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        maxWidth: 600
      }}>
        {/* RSI Block */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>RSI (14)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 180,
              height: 14,
              background: '#e5e7eb',
              borderRadius: 7,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: 14,
                width: `${Math.min(Math.max(rsi_14, 0), 100) * 1.8}px`,
                background: rsiColor,
                borderRadius: 7,
                transition: 'width 0.3s'
              }} />
              <div style={{
                position: 'absolute', left: '54px', top: 0, height: 14, width: 2, background: '#bbb'
              }} />
              <div style={{
                position: 'absolute', left: '126px', top: 0, height: 14, width: 2, background: '#bbb'
              }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 16, color: rsiColor }}>{rsi_14}</span>
          </div>
          <div style={{ fontSize: 13, color: rsiColor, fontWeight: 500 }}>{rsiLabel}</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>0 <span style={{ marginLeft: 44 }}>30</span> <span style={{ marginLeft: 60 }}>70</span> <span style={{ float: 'right' }}>100</span></div>
        </div>

        {/* MACD Block */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>MACD</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontWeight: 600,
              fontSize: 18,
              color: macdArrowColor,
              marginRight: 4
            }}>{macd} {macdArrow}</span>
            <span style={{ fontSize: 13, color: '#888' }}>Histogram:</span>
            {macdHistBadge}
          </div>
        </div>

        {/* SMA 50 Block */}
        {smaBlock('SMA 50', sma_50)}

        {/* SMA 200 Block */}
        {smaBlock('SMA 200', sma_200)}
      </div>
    );
  };

  // Responsive grid and search card for mobile
  const gridMedia = `
    @media (max-width: 700px) {
      .indicator-grid {
        grid-template-columns: 1fr !important;
      }
      .summary-block {
        padding: 12px !important;
      }
      .search-card {
        padding: 14px !important;
      }
      .search-row {
        flex-direction: column !important;
        gap: 10px !important;
        align-items: stretch !important;
      }
    }
  `;

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <style>{gridMedia}</style>
      {/* --- Search Card Block --- */}
      <div
        className="search-card"
        style={{
          background: '#f8f9fa',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          marginBottom: 28
        }}
      >
        <div style={{
          fontWeight: 700,
          fontSize: 22,
          color: '#222',
          letterSpacing: 0.5,
          marginBottom: 16
        }}>
          Stock Analysis Tool
        </div>
        <div
          className="search-row"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Enter a ticker (e.g. AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            style={{
              width: '60%',
              padding: 8,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 15
            }}
          />
          <button
            onClick={fetchInsight}
            disabled={loading || !ticker}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: '#0074D9',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              cursor: loading || !ticker ? 'not-allowed' : 'pointer',
              height: 38
            }}
          >
            {loading ? 'Loading...' : 'Get Insight'}
          </button>
        </div>
      </div>
      {/* --- End Search Card Block --- */}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {insight && (
        <div style={{ marginTop: 20 }}>
          {/* --- Summary Card Block --- */}
          <div
            className="summary-block"
            style={{
              background: '#f8f9fa',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              marginBottom: 28,
              marginTop: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#222', letterSpacing: 1 }}>
                {insight.ticker || (insight.indicators && insight.indicators.ticker)}
              </span>
              <span style={{ color: '#888', fontSize: 13 }}>
                {(insight.date || (insight.indicators && insight.indicators.date))}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.6 }}>
              <ReactMarkdown
                children={insight.analysis || insight.commentary}
                components={{
                  li: ({node, ...props}) => <li style={{marginBottom: 4}} {...props} />,
                  code: ({node, ...props}) => <code style={{background: '#eee', padding: '2px 4px', borderRadius: 3}} {...props} />
                }}
              />
            </div>
          </div>
          {/* --- End Summary Card Block --- */}

          <div className="indicator-grid">
            <IndicatorChart indicators={insight.indicators} />
          </div>
        </div>
      )}
    </div>
  );
}

export default StockInsights;
