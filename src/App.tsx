import React, { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Importaciones del adaptador oficial de billeteras de Solana
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Importar los estilos del modal oficial de Solana
import '@solana/wallet-adapter-react-ui/styles.css';

// Dirección real de la tesorería de la preventa (Mainnet)
const PRESALE_WALLET = new PublicKey('2NjhoA5TKiVKja9Gq8iPht5ya5Ho8yo2AEUbv37aGDTa');

// IMAGEN DE LOGO OFICIAL
const LOGO_AURA_GOLD = "https://pbs.twimg.com/profile_images/2033415962737639425/Qynt9rO0_400x400.jpg";

// Componente Interno con la lógica de negocio y UI
function PresaleContent() {
  const { publicKey, sendTransaction, connected, disconnect, select } = useWallet();
  const [solPriceUsd, setSolPriceUsd] = useState<number>(140); // Precio base por defecto
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  
  // Estados de los campos de compra
  const [currency, setCurrency] = useState<'USDT' | 'SOL'>('SOL'); 
  const [argAmount, setArgAmount] = useState<string>('10000');
  const [payAmount, setPayAmount] = useState<string>('100');

  const ARG_PRICE_USD = 0.01; // Precio fijo por token ARG

  // 1. Obtener el precio de Solana en tiempo real (Coingecko)
  useEffect(() => {
    async function fetchSolPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data.solana && data.solana.usd) {
          setSolPriceUsd(data.solana.usd);
        }
      } catch (error) {
        console.error("Error consultando el precio de SOL en vivo:", error);
      } finally {
        setLoadingPrice(false);
      }
    }
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Recalcular montos de conversión de manera bidireccional
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

  // 3. Procesamiento seguro de transacciones en Mainnet vía Ankr RPC Node
  const handlePurchase = async () => {
    try {
      if (!connected || !publicKey) {
        alert('Por favor, conecta tu billetera primero usando el botón superior.');
        return;
      }

      if (currency === 'USDT') {
        alert('La recepción directa de USDT está temporalmente en mantenimiento técnico para optimizar los gas fees. Por favor, selecciona SOL para realizar tu adquisición de tokens en esta Fase 1.');
        return;
      }

      const parsedPay = parseFloat(payAmount);
      if (isNaN(parsedPay) || parsedPay <= 0) {
        alert('Monto de compra inválido.');
        return;
      }

      alert(`Iniciando solicitud para adquirir ${argAmount} ARG. Se abrirá tu billetera seleccionada para autorizar el envío de ${parsedPay} SOL.`);

      // Endpoint inmune al error 403 de Netlify
      const connection = new Connection('https://rpc.ankr.com/solana', 'confirmed');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PRESALE_WALLET,
          lamports: Math.floor(parsedPay * 1_000_000_000),
        })
      );

      const signature = await sendTransaction(transaction, connection);

      if (signature) {
        alert(`🎉 ¡RESERVA EXITOSA!\n\nTu pago de ${parsedPay} SOL fue procesado en Mainnet.\nID de Operación (Firma): ${signature.slice(0, 8)}...\n\nTu billetera ha sido registrada para recibir ${argAmount} ARG en la distribución de la Fase 1.`);
      }
    } catch (error: any) {
      console.error(error);
      alert('Operación cancelada o fondos insuficientes: ' + error.message);
    }
  };

  // 4. Hook de seguridad: Si el usuario desconecta manualmente la billetera, limpiamos el localStorage de raíz
  useEffect(() => {
    if (!connected) {
      localStorage.removeItem('walletName');
      // Forzamos al adaptador a olvidar la selección previa
      select(null); 
    }
  }, [connected, select]);

  return (
    <div style={{ backgroundColor: '#060b13', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* BANNER DE PRECIO EN TIEMPO REAL */}
      <div style={{ backgroundColor: '#0d192d', borderBottom: '1px solid #1e293b', padding: '8px 20px', textAlign: 'center', fontSize: '14px' }}>
        {loadingPrice ? (
          <span style={{ color: '#94a3b8' }}>🔄 Sincronizando con Solana Mainnet...</span>
        ) : (
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            🟢 Solana (SOL) en tiempo real: ${solPriceUsd.toFixed(2)} USD
          </span>
        )}
      </div>

      {/* ENCABEZADO / NAVBAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={LOGO_AURA_GOLD} 
            alt="Logo Aura Gold" 
            style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #fbbf24', boxSizing: 'border-box' }}
          />
          <span style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '1px', color: '#fbbf24' }}>AURA GOLD</span>
        </div>
        
        <div>
          {/* BOTÓN OFICIAL DE SOLANA CON COMPORTAMIENTO NATIVO REPARADO */}
          <WalletMultiButton style={{ 
            backgroundColor: connected ? '#10b981' : '#fbbf24', 
            color: '#060b13', 
            fontWeight: 'bold', 
            borderRadius: '8px', 
            fontFamily: 'sans-serif',
            padding: '12px 24px',
            fontSize: '14px'
          }} />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>
          Portal Oficial de Preventa <span style={{ color: '#fbbf24' }}>Aura Gold (ARG)</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '30px' }}>
          Adquiere tus tokens de forma directa y asegura tu posición antes del lanzamiento oficial en exchanges.
        </p>

        {/* CONTENEDOR MÓDULO DE COMPRA */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '0.5px' }}>Módulo de Compra</h2>
          
          {/* SELECTOR DE MONEDA */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', textAlign: 'left', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Selecciona tu moneda:</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCurrency('USDT')} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: currency === 'USDT' ? '#065f46' : '#1e293b', color: currency === 'USDT' ? '#34d399' : '#94a3b8', transition: '0.2s' }}>
                USDT
              </button>
              <button onClick={() => setCurrency('SOL')} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: currency === 'SOL' ? '#5b21b6' : '#1e293b', color: currency === 'SOL' ? '#a78bfa' : '#94a3b8', transition: '0.2s' }}>
                SOL
              </button>
            </div>
          </div>

          {/* INPUT 1: CANTIDAD DE ARG */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Cantidad de tokens ARG deseada:</label>
            <input type="number" value={argAmount} onChange={(e) => setArgAmount(e.target.value)} placeholder="Ej: 10000" style={{ width: '100%', backgroundColor: '#060b13', border: '1px solid #1e293b', padding: '14px', borderRadius: '8px', color: '#ffffff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          {/* INPUT 2: EQUIVALENTE A PAGAR */}
          <div style={{ marginBottom: '30px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total a pagar ({currency}):</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={payAmount} onChange={(e) => handlePayAmountChange(e.target.value)} placeholder="0.00" style={{ width: '100%', backgroundColor: '#060b13', border: '1px solid #1e293b', padding: '14px', borderRadius: '8px', color: '#fbbf24', fontSize: '16px', fontWeight: 'bold', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: '14px', top: '14px', fontWeight: 'bold', color: '#64748b' }}>{currency}</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Precio Unitario Fijo: $0.01 USD por ARG
            </p>
          </div>

          {/* BOTÓN DE COMPRA */}
          <button onClick={handlePurchase} style={{ width: '100%', backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b45309'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d97706'}>
            Adquirir Tokens ARG
          </button>

          {/* CUADRO DEL CONTRATO SOCIAL */}
          <div style={{ marginTop: '24px', backgroundColor: '#0d192d', border: '1px solid #1d4ed8', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>
              📢 Reglas de la Fase 1 y Distribución de Fondos
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <strong>1. Reserva en Tesorería:</strong> Al adquirir tus tokens, tus fondos en SOL se transfieren de forma directa y blindada a nuestra dirección de resguardo oficial. Tu billetera queda inmediatamente registrada en la lista de inversores iniciales.
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <strong>2. Distribución Diferida (Airdrop):</strong> Los tokens ARG adquiridos serán enviados de forma masiva a las billeteras compradoras al finalizar el periodo de recaudación de esta ronda, asegurando la equidad del ecosistema.
            </p>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <footer style={{ marginTop: '50px', borderTop: '1px solid #1e293b', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>MINT ADDRESS (CONTRATO OFICIAL DEL TOKEN):</p>
          <code style={{ fontSize: '12px', color: '#fbbf24', wordBreak: 'break-all', display: 'block', padding: '0 20px' }}>22gYFgCNLcyRrLhrMtBSq3uwRhvfCA7wUGzG8QzCycqc</code>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
            <a href="https://x.com/AuraGoldARG" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px' }}>
              𝕏 / Twitter Oficial
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

// COMPONENTE PRINCIPAL (Configuración e inyección de contexto de Solana)
export default function App() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = 'https://rpc.ankr.com/solana';

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  // IMPORTANTE: Dejamos el flujo nativo desactivando autoConnect para dar libertad al usuario
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <PresaleContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
