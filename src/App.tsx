import React, { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Importaciones del ecosistema de Solana (Sin adaptadores rígidos obsoletos)
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Importar los estilos oficiales del modal
import '@solana/wallet-adapter-react-ui/styles.css';

// Configuración de Red Base (Ankr RPC Estable para evitar bloqueos 403)
const NODE_RPC_ENDPOINT = 'https://rpc.ankr.com/solana';
const PRESALE_WALLET = new PublicKey('2NjhoA5TKiVKja9Gq8iPht5ya5Ho8yo2AEUbv37aGDTa');
const LOGO_AURA_GOLD = "https://pbs.twimg.com/profile_images/2033415962737639425/Qynt9rO0_400x400.jpg";

function PresaleContent() {
  const { publicKey, sendTransaction, connected, select, connect } = useWallet();
  const [solPriceUsd, setSolPriceUsd] = useState<number>(140); 
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  
  // Estados de los campos de compra
  const [currency, setCurrency] = useState<'USDT' | 'SOL'>('SOL'); 
  const [argAmount, setArgAmount] = useState<string>('10000');
  const [payAmount, setPayAmount] = useState<string>('100');

  const ARG_PRICE_USD = 0.01; 

  // 1. Obtener precio en vivo de SOL
  useEffect(() => {
    async function fetchSolPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data.solana && data.solana.usd) {
          setSolPriceUsd(data.solana.usd);
        }
      } catch (error) {
        console.error("Error trayendo precio de SOL:", error);
      } finally {
        setLoadingPrice(false);
      }
    }
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Conversiones matemáticas automatizadas
  useEffect(() => {
    const arg = parseFloat(argAmount);
    if (isNaN(arg) || arg <= 0) {
      setPayAmount('');
      return;
    }
    const totalCostUsd = arg * ARG_PRICE_USD;
    if (currency === 'USDT') {
      setPayAmount(totalCostUsd.toFixed(2));
    } else {
      const totalSol = totalCostUsd / solPriceUsd;
      setPayAmount(totalSol.toFixed(4));
    }
  }, [argAmount, currency, solPriceUsd]);

  const handlePayAmountChange = (val: string) => {
    setPayAmount(val);
    const pay = parseFloat(val);
    if (isNaN(pay) || pay <= 0) {
      setArgAmount('');
      return;
    }
    if (currency === 'USDT') {
      const totalArg = pay / ARG_PRICE_USD;
      setArgAmount(totalArg.toFixed(0));
    } else {
      const totalUsdSpent = pay * solPriceUsd;
      const totalArg = totalUsdSpent / ARG_PRICE_USD;
      setArgAmount(totalArg.toFixed(0));
    }
  };

  // Botón alternativo de rescate si el modal del adapter falla por culpa del navegador
  const forcePhantomConnect = async () => {
    try {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        await provider.connect();
        // Sincronizar el estado de la ventana inyectada con la librería de Solana
        window.location.reload(); 
      } else {
        alert("Phantom Wallet no detectada en este navegador. Por favor instala la extensión oficial.");
      }
    } catch (err: any) {
      console.error("Error en conexión forzada:", err);
    }
  };

  // 3. Envío seguro del pago a la tesorería
  const handlePurchase = async () => {
    try {
      if (!connected || !publicKey) {
        alert('Por favor, conecta tu billetera primero usando el botón superior "Select Wallet".');
        return;
      }
      if (currency === 'USDT') {
        alert('La recepción directa de USDT está temporalmente en mantenimiento técnico para optimizar los gas fees. Por favor, selecciona SOL para adquirir tus tokens en esta Fase 1.');
        return;
      }
      const parsedPay = parseFloat(payAmount);
      if (isNaN(parsedPay) || parsedPay <= 0) {
        alert('Monto de compra inválido.');
        return;
      }

      alert(`Iniciando solicitud para adquirir ${argAmount} ARG. Se abrirá tu billetera para autorizar el envío de ${parsedPay} SOL.`);

      const connection = new Connection(NODE_RPC_ENDPOINT, 'confirmed');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PRESALE_WALLET,
          lamports: Math.floor(parsedPay * 1_000_000_000),
        })
      );

      const signature = await sendTransaction(transaction, connection);

      if (signature) {
        alert(`🎉 ¡RESERVA EXITOSA!\n\nTu pago de ${parsedPay} SOL fue enviado a resguardo en Mainnet.\nFirma de Transacción: ${signature.slice(0, 8)}...\n\nTu saldo de ${argAmount} ARG será distribuido al finalizar la ronda.`);
      }
    } catch (error: any) {
      console.error(error);
      alert('Operación cancelada o fondos insuficientes: ' + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#060b13', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* PRECIO SUPERIOR */}
      <div style={{ backgroundColor: '#0d192d', borderBottom: '1px solid #1e293b', padding: '8px 20px', textAlign: 'center', fontSize: '14px' }}>
        {loadingPrice ? (
          <span style={{ color: '#94a3b8' }}>🔄 Conectando con Solana Mainnet...</span>
        ) : (
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            🟢 Solana (SOL) en tiempo real: ${solPriceUsd.toFixed(2)} USD
          </span>
        )}
      </div>

      {/* NAVBAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LOGO_AURA_GOLD} alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #fbbf24' }} />
          <span style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '1px', color: '#fbbf24' }}>AURA GOLD</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Si el botón oficial falla por seguridad del navegador, este texto ofrece la alternativa limpia */}
          {!connected && (
            <button onClick={forcePhantomConnect} style={{ backgroundColor: 'transparent', border: '1px solid #64748b', color: '#94a3b8', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              ¿Problemas con el modal? Conexión Directa
            </button>
          )}
          
          <WalletMultiButton style={{ 
            backgroundColor: connected ? '#10b981' : '#fbbf24', 
            color: '#060b13', 
            fontWeight: 'bold', 
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px'
          }} />
        </div>
      </header>

      {/* CONTENIDO */}
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>
          Portal Oficial de Preventa <span style={{ color: '#fbbf24' }}>Aura Gold (ARG)</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '30px' }}>
          Asegura tus tokens ARG directamente en la tesorería antes del listado público.
        </p>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Módulo de Compra</h2>
          
          {/* MONEDA */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', textAlign: 'left', marginBottom: '8px', fontWeight: 'bold' }}>SELECCIONA TU MONEDA:</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCurrency('USDT')} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: currency === 'USDT' ? '#065f46' : '#1e293b', color: currency === 'USDT' ? '#34d399' : '#94a3b8' }}>USDT</button>
              <button onClick={() => setCurrency('SOL')} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: currency === 'SOL' ? '#5b21b6' : '#1e293b', color: currency === 'SOL' ? '#a78bfa' : '#94a3b8' }}>SOL</button>
            </div>
          </div>

          {/* COINS ARG */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>CANTIDAD DE TOKENS ARG DESEADA:</label>
            <input type="number" value={argAmount} onChange={(e) => setArgAmount(e.target.value)} style={{ width: '100%', backgroundColor: '#060b13', border: '1px solid #1e293b', padding: '14px', borderRadius: '8px', color: '#ffffff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          {/* PAGO */}
          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>TOTAL A PAGAR ({currency}):</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={payAmount} onChange={(e) => handlePayAmountChange(e.target.value)} style={{ width: '100%', backgroundColor: '#060b13', border: '1px solid #1e293b', padding: '14px', borderRadius: '8px', color: '#fbbf24', fontSize: '16px', fontWeight: 'bold', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: '14px', top: '14px', fontWeight: 'bold', color: '#64748b' }}>{currency}</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>Precio Unitario Fijo: $0.01 USD por ARG</p>
          </div>

          {/* COMPRAR */}
          <button onClick={handlePurchase} style={{ width: '100%', backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Adquirir Tokens ARG
          </button>

          {/* REGLAS */}
          <div style={{ marginTop: '24px', backgroundColor: '#0d192d', border: '1px solid #1d4ed8', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>📢 Reglas de la Fase 1 y Distribución de Fondos</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}><strong>1. Reserva en Tesorería:</strong> Los fondos se transfieren directamente a nuestra dirección de resguardo oficial de manera inmediata.</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}><strong>2. Distribución Diferida (Airdrop):</strong> Los tokens ARG serán enviados de forma masiva a las billeteras al finalizar el periodo de recaudación.</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ marginTop: '50px', borderTop: '1px solid #1e293b', padding: '20px 0' }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>MINT ADDRESS (CONTRATO OFICIAL DEL TOKEN):</p>
          <code style={{ fontSize: '12px', color: '#fbbf24', wordBreak: 'break-all' }}>22gYFgCNLcyRrLhrMtBSq3uwRhvfCA7wUGzG8QzCycqc</code>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  // Al dejar el arreglo vacío en las versiones nuevas del Adapter, se inicializa el Wallet Standard
  // de forma nativa reduciendo las colisiones a cero en Brave/Chrome.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={NODE_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <PresaleContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
