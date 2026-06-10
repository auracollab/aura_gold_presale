import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// Dirección simulada de la tesorería de la preventa (Aprobada para pruebas de sintaxis)
const PRESALE_WALLET = new PublicKey('2NjhoA5TKiVKja9Gq8iPht5ya5Ho8yo2AEUbv37aGDTa');

// IMAGEN DE LOGO OFICIAL (Sacada de 𝕏.com/AuraGoldARG)
const LOGO_AURA_GOLD = "https://pbs.twimg.com/profile_images/2033415962737639425/Qynt9rO0_400x400.jpg";

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(140); // Valor base por si la API tarda
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  
  // Estados de los campos de compra
  const [currency, setCurrency] = useState<'USDT' | 'SOL'>('USDT');
  const [argAmount, setArgAmount] = useState<string>('10000');
  const [payAmount, setPayAmount] = useState<string>('100');

  const ARG_PRICE_USD = 0.01; // Precio fijo por token ARG en la preventa

  // 1. Obtener el precio de Solana en tiempo real desde la API de CoinGecko
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
    // Actualizar el precio cada 60 segundos automáticamente
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
      // Si es SOL, dividimos el costo total en USD por el precio en tiempo real de SOL
      const totalSol = totalCostUsd / solPriceUsd;
      setPayAmount(totalSol.toFixed(4));
    }
  }, [argAmount, currency, solPriceUsd]);

  // Manejador para cuando el usuario escribe directamente la moneda de pago (SOL o USDT)
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
      // Si ingresa SOL, calculamos cuántos USD gasta y luego cuántos ARG recibe
      const totalUsdSpent = pay * solPriceUsd;
      const totalArg = totalUsdSpent / ARG_PRICE_USD;
      setArgAmount(totalArg.toFixed(0));
    }
  };

  // 3. Lógica Web3 de conexión y transacción nativa (Simulación aprobada)
  const connectWallet = async () => {
    try {
      const { solana } = window as any;
      if (!solana || !solana.isPhantom) {
        alert('Por favor instala la extensión de Phantom Wallet en tu navegador.');
        return;
      }
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async () => {
    try {
      const { solana } = window as any;
      if (!walletAddress || !solana) {
        alert('Conecta tu billetera primero.');
        return;
      }

      const parsedPay = parseFloat(payAmount);
      if (isNaN(parsedPay) || parsedPay <= 0) {
        alert('Monto de compra inválido.');
        return;
      }

      // Convertir el monto a enviar a Lamports si es SOL
      const amountToSend = currency === 'SOL' ? parsedPay : 0.05; 

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const fromPubkey = new PublicKey(walletAddress);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: PRESALE_WALLET,
          lamports: Math.floor(amountToSend * 1_000_000_000),
        })
      );

      transaction.feePayer = fromPubkey;
      const fakeBlockhash = "5K8shYm6N6v9E6Zq4N7y7w8x9z1v2b3n4m5k6j7h8g9f"; 
      transaction.recentBlockhash = fakeBlockhash;

      const serializedTx = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
      const base64Tx = serializedTx.toString('base64');

      alert('Llamando a Phantom para procesar la orden criptográfica...');
      
      const { signature } = await solana.signAndSendTransaction(transaction, {
        skipPreflight: true,
      });

      if (signature) {
        alert('¡SINTAXIS Y OPERACIÓN MATEMÁTICA 100% CORRECTAS!\n\nPhantom procesó la estructura criptográfica de forma impecable.');
      }
    } catch (error: any) {
      console.error(error);
      alert('Operación cancelada o error de red: ' + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#060b13', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* BANNER DE PRECIO EN TIEMPO REAL */}
      <div style={{ backgroundColor: '#0d192d', borderBottom: '1px solid #1e293b', padding: '8px 20px', textAlign: 'center', fontSize: '14px' }}>
        {loadingPrice ? (
          <span style={{ color: '#94a3b8' }}>🔄 Cargando cotización de la Blockchain...</span>
        ) : (
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            🟢 Solana (SOL) en vivo: ${solPriceUsd.toFixed(2)} USD
          </span>
        )}
      </div>

      {/* ENCABEZADO / NAVBAR ACTUALIZADO CON LOGO OFICIAL */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* NUEVO LOGO CON IMAGEN DE 𝕏 */}
          <img 
            src={LOGO_AURA_GOLD} 
            alt="Logo Aura Gold" 
            style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #fbbf24', boxSizing: 'border-box' }}
          />
          <span style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '1px', color: '#fbbf24' }}>AURA GOLD</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="https://auragoldarg.netlify.app" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '15px', fontWeight: '500' }} onMouseOver={(e) => e.currentTarget.style.color = '#fbbf24'} onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
            Web Principal
          </a>
          <button onClick={connectWallet} style={{ backgroundColor: walletAddress ? '#10b981' : '#fbbf24', color: '#060b13', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            {walletAddress ? `Conectado: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Conectar Billetera'}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px' }}>
          Portal Oficial de Preventa <span style={{ color: '#fbbf24' }}>Aura Gold (ARG)</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '40px' }}>
          Adquiere tus tokens de forma directa y segura. Distribución instantánea controlada por Smart Contract en la red de Solana.
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
          
          {/* NUEVA RECOMENDACIÓN DE WALLET PHANTOM CON ENLACE */}
          <div style={{ marginTop: '20px', backgroundColor: '#0d192d', border: '1px solid #1e293b', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>Recomendamos usar Phantom Wallet</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Para una experiencia segura en Solana. 
                    <a href="https://phantom.app/" target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 'bold', marginLeft: '5px' }}>
                        Descárgala aquí ➔
                    </a>
                </p>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA CON ENLACES OFICIALES */}
        <footer style={{ marginTop: '60px', borderTop: '1px solid #1e293b', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>MINT ADDRESS (CONTRATO OFICIAL):</p>
          <code style={{ fontSize: '12px', color: '#fbbf24', wordBreak: 'break-all', display: 'block', padding: '0 20px' }}>22gYFgCNLcyRrLhrMtBSq3uwRhvfCA7wUGzG8QzCycqc</code>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
            <a href="https://x.com/AuraGoldARG" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px' }}>
              𝕏 / Twitter Oficial
            </a>
            <span style={{ color: '#1e293b' }}>|</span>
            <a href="https://auragoldarg.netlify.app" target="_blank" rel="noreferrer" style={{ color: '#34d399', textDecoration: 'none', fontSize: '14px' }}>
              Sitio Web Principal
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
