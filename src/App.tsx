import React, { useState, useEffect } from 'react';

const PRECIO_ARG_USD = 0.01;
const LOGO_AURA_GOLD = "https://pbs.twimg.com/profile_images/2033415962737639425/Qynt9rO0_400x400.jpg";

export default function App() {
  const [cantidadARG, setCantidadARG] = useState(10000);
  const [metodoPago, setMetodoPago] = useState<'USDT' | 'SOL'>('USDT');
  const [montoAPagar, setMontoAPagar] = useState(100);
  const [precioSOL] = useState(170); // Precio base de respaldo

  useEffect(() => {
    const costoUSD = cantidadARG * PRECIO_ARG_USD;
    if (metodoPago === 'USDT') {
      setMontoAPagar(costoUSD);
    } else {
      setMontoAPagar(costoUSD / precioSOL);
    }
  }, [cantidadARG, metodoPago, precioSOL]);

  return (
    <div style={{ backgroundColor: '#070709', color: '#f3f4f6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #1f2937', backgroundColor: '#070709', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={LOGO_AURA_GOLD} alt="Aura Gold" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #f59e0b' }} />
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: '#fbbf24' }}>AURA GOLD</span>
          </div>
          <div>
            <button style={{ padding: '10px 20px', backgroundColor: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => alert('Conectando billetera simulada...')}>
              Conectar Billetera
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
            Portal Oficial de Preventa <span style={{ color: '#fbbf24' }}>Aura Gold (ARG)</span>
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '600px', margin: '0 auto', fontSize: '16px', lineHeight: '1.5' }}>
            Adquiere tus tokens de forma directa y segura. Distribución instantánea controlada por Smart Contract en la red de Solana.
          </p>
        </div>

        {/* INTERCAMBIADOR */}
        <div style={{ background: 'linear-gradient(to bottom, #111827, #0b0f19)', border: '1px solid #1f2937', borderRadius: '24px', padding: '30px', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Módulo de Compra</h3>

          {/* MONEDA */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', marginBottom: '8px' }}>SELECCIONA TU MONEDA:</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setMetodoPago('USDT')} style={{ flex: 1, padding: '14px', background: metodoPago === 'USDT' ? '#065f46' : '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>USDT</button>
              <button onClick={() => setMetodoPago('SOL')} style={{ flex: 1, padding: '14px', background: metodoPago === 'SOL' ? '#4c1d95' : '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>SOL</button>
            </div>
          </div>

          {/* INPUT */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', marginBottom: '8px' }}>CANTIDAD DE TOKENS ARG DESEADA:</label>
            <input 
              type="number" 
              value={cantidadARG}
              onChange={(e) => setCantidadARG(Math.max(1, parseInt(e.target.value) || 0))}
              style={{ width: '100%', boxSizing: 'border-box', background: '#030712', border: '1px solid #1f2937', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '18px' }} 
            />
          </div>

          {/* TOTAL */}
          <div style={{ background: '#030712', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
              <span>Precio Unitario Fijo:</span>
              <span>$0.01 USD</span>
            </div>
            <div style={{ height: '1px', background: '#1f2937', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#d1d5db' }}>Total Estimado a Pagar:</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' }}>
                {montoAPagar.toFixed(metodoPago === 'SOL' ? 4 : 2)} {metodoPago}
              </span>
            </div>
          </div>

          <button onClick={() => alert('¡Transacción enviada a la red!')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>
            ADQUIRIR TOKENS ARG
          </button>
        </div>

        {/* CONTRATO */}
        <section style={{ maxWidth: '800px', margin: '0 auto', width: '100%', background: '#0b0f19', border: '1px solid #1f2937', borderRadius: '20px', padding: '24px', boxSizing: 'border-box' }}>
          <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', marginBottom: '4px' }}>MINT ADDRESS (CONTRATO OFICIAL):</span>
          <span style={{ color: '#fbbf24', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px' }}>22gYFgCNLcyRrLhrMtBSq3uwRhvfCA7wUGzG8QzCycqc</span>
        </section>

      </main>
    </div>
  );
}