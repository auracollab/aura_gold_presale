import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface PresaleContentProps {
  rpcEndpoint: string;
}

export default function PresaleContent({ rpcEndpoint }: PresaleContentProps) {
  const { publicKey, sendTransaction, connected, disconnect } = useWallet();
  
  // Estados Financieros y de Oráculo
  const [solPriceUsd, setSolPriceUsd] = useState<number>(140);
  const [loadingPrice, setLoadingPrice] = useState<boolean>(true);
  const [currency, setCurrency] = useState<'USDT' | 'SOL'>('SOL');
  const [argAmount, setArgAmount] = useState<string>('10000');
  const [payAmount, setPayAmount] = useState<string>('100');

  // NOVEDAD FASE 2: Estados Blockchain en Vivo
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [treasurySolBalance, setTreasurySolBalance] = useState<number>(0);
  const HARD_CAP_SOL = 500; // Meta de la Fase 1 de preventa (ejemplo: 500 SOL)

  // Estados de Modales Internos
  const [txStatus, setTxStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [lastSignature, setLastSignature] = useState<string>('');

  // Configuración Constante
  const ARG_PRICE_USD = 0.01;
  const PRESALE_WALLET = new PublicKey('2NjhoA5TKiVKja9Gq8iPht5ya5Ho8yo2AEUbv37aGDTa');
  const MINT_ADDRESS = "22gYFgCNLcyRrLhrMtBSq3uwRhvfCA7wUGzG8QzCycqc";
  
  const LOGO_AURA_GOLD = "https://pbs.twimg.com/profile_images/2033415962737639425/Qynt9rO0_400x400.jpg";
  const LOGO_SOL = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
  const LOGO_USDT = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png";

  // 1. Oráculo de Precios Coingecko
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await res.json();
        if (data.solana?.usd) setSolPriceUsd(data.solana.usd);
      } catch (err) {
        console.error("Error consultando oráculo de precios:", err);
      } finally {
        setLoadingPrice(false);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. NOVEDAD FASE 2: Lectura Dinámica de Saldos (Usuario y Tesorería)
  useEffect(() => {
    const connection = new Connection(rpcEndpoint, 'confirmed');

    async function fetchBlockchainData() {
      try {
        // Consultar balance acumulado en la billetera colectora (Fondo de Preventa)
        const treasuryBal = await connection.getBalance(PRESALE_WALLET);
        setTreasurySolBalance(treasuryBal / 1_000_000_000);

        // Si el usuario está conectado, consultar su saldo actual en tiempo real
        if (connected && publicKey) {
          const userBal = await connection.getBalance(publicKey);
          setUserSolBalance(userBal / 1_000_000_000);
        } else {
          setUserSolBalance(null);
        }
      } catch (err) {
        console.error("Error leyendo datos RPC de la Blockchain:", err);
      }
    }

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 15000); // Actualiza cada 15 segs
    return () => clearInterval(interval);
  }, [connected, publicKey, rpcEndpoint]);

  // 3. Conversor Matemático Bidireccional Automático
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
      setPayAmount((totalCostUsd / solPriceUsd).toFixed(4));
    }
  }, [argAmount, currency, solPriceUsd]);

  const handlePayChange = (val: string) => {
    setPayAmount(val);
    const pay = parseFloat(val);
    if (isNaN(pay) || pay <= 0) {
      setArgAmount('');
      return;
    }
    if (currency === 'USDT') {
      setArgAmount((pay / ARG_PRICE_USD).toFixed(0));
    } else {
      setArgAmount(((pay * solPriceUsd) / ARG_PRICE_USD).toFixed(0));
    }
  };

  // 4. Ejecución del Pago Blindado contra Punto Flotante
  const handlePurchase = async () => {
    if (!connected || !publicKey) {
      setTxStatus('ERROR');
      setModalMessage('Por favor conecta tu wallet de Solana usando el botón superior.');
      return;
    }
    if (currency === 'USDT') {
      setTxStatus('ERROR');
      setModalMessage('La recepción de USDT está en mantenimiento para optimizar gas fees. Por favor utiliza SOL en esta Fase.');
      return;
    }
    const parsedPay = parseFloat(payAmount);
    if (isNaN(parsedPay) || parsedPay <= 0) {
      setTxStatus('ERROR');
      setModalMessage('Monto de pago inválido.');
      return;
    }

    // VALIDACIÓN PREVIA FASE 2: Evitar que intente enviar si no tiene saldo suficiente
    if (userSolBalance !== null && parsedPay > userSolBalance) {
      setTxStatus('ERROR');
      setModalMessage(`Saldo insuficiente. Intentas pagar ${parsedPay} SOL pero tu billetera dispone de ${userSolBalance.toFixed(4)} SOL.`);
      return;
    }

    try {
      setTxStatus('LOADING');
      setModalMessage(`Preparando solicitud para adquirir ${argAmount} ARG. Por favor firma la transacción en tu extensión...`);

      const connection = new Connection(rpcEndpoint, 'confirmed');
      const lamportsCalculated = Math.round(Number((parsedPay * 1_000_000_000).toFixed(0)));

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PRESALE_WALLET,
          lamports: lamportsCalculated,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      setLastSignature(signature);
      setTxStatus('SUCCESS');
      setModalMessage(`¡Reserva confirmada en la Blockchain! Tus fondos se han resguardado con éxito en la tesorería de Aura Gold.`);
    } catch (err: any) {
      console.error(err);
      setTxStatus('ERROR');
      setModalMessage(err.message || 'Transacción cancelada por el usuario.');
    }
  };

  const forcePhantomConnect = async () => {
    try {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        await provider.connect();
        window.location.reload();
      } else {
        setTxStatus('ERROR');
        setModalMessage('Phantom Wallet no detectada. Por favor instala la extensión.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const watchARGToken = async () => {
    try {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        await provider.request({
          method: "wallet_watchAsset",
          params: {
            type: "spl-token",
            options: {
              address: MINT_ADDRESS,
              symbol: "ARG",
              decimals: 9,
              image: LOGO_AURA_GOLD,
            },
          },
        });
      } else {
        setTxStatus('ERROR');
        setModalMessage('Esta función automática está disponible principalmente para extensiones Phantom.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calcular porcentaje de la barra de progreso de preventa
  const progressPercent = Math.min((treasurySolBalance / HARD_CAP_SOL) * 100, 100);

  return (
    <div style={{ 
      backgroundColor: '#030712', 
      color: '#ffffff', 
      minHeight: '100vh', 
      fontFamily: 'sans-serif',
      backgroundImage: 'radial-gradient(circle at 50% 20%, #0f172a 0%, #030712 70%)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* ORÁCULO BANNER */}
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', textAlign: 'center', fontSize: '13px' }}>
        {loadingPrice ? (
          <span style={{ color: '#94a3b8' }}>🔄 Sincronizando oráculo de Solana Mainnet...</span>
        ) : (
          <span style={{ color: '#f59e0b', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            ⚡ SOLANA LIVE PRICE: <span style={{ color: '#10b981' }}>${solPriceUsd.toFixed(2)} USD</span>
          </span>
        )}
      </div>

      {/* NAVBAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={LOGO_AURA_GOLD} alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #fbbf24', boxShadow: '0 0 15px rgba(251,191,36,0.4)' }} />
          <span style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '1.5px', color: '#fbbf24', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>AURA GOLD</span>
        </div>
        
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button 
            onClick={async () => {
              try {
                await disconnect();
                localStorage.removeItem('walletName');
                window.location.reload();
              } catch (e) { console.error(e); }
            }} 
            style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            🔄 Reset Wallet
          </button>

          {!connected && (
            <button onClick={forcePhantomConnect} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#94a3b8', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              Conexión Directa
            </button>
          )}
          <WalletMultiButton style={{ 
            backgroundColor: connected ? '#10b981' : '#fbbf24', 
            color: '#060b13', 
            fontWeight: 'extrabold', 
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            boxShadow: connected ? '0 0 15px rgba(16,185,129,0.3)' : '0 0 15px rgba(251,191,36,0.3)'
          }} />
        </div>
      </header>

      {/* CUERPO CENTRAL */}
      <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
        
        {/* COLUMNA IZQUIERDA: TEXTO, BARRA LIVE Y INFO */}
        <div style={{ flex: '1 1 500px', alignSelf: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '16px', lineHeight: '1.2' }}>
            Portal Oficial de Preventa <br/>
            <span style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.2)' }}>Aura Gold (ARG)</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '25px', lineHeight: '1.6' }}>
            Asegura tus posiciones en la Fase ICO número 1. Tus fondos se procesan mediante contratos de custodia directa hacia la tesorería de resguardo oficial.
          </p>

          {/* NOVEDAD FASE 2: BARRA DE PROGRESO DE RECAUDACIÓN EN VIVO (FOMO WIDGET) */}
          <div style={{ backgroundColor: '#090d16', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>
              <span style={{ color: '#38bdf8' }}>📈 Progreso de Recaudación:</span>
              <span style={{ color: '#fbbf24' }}>{treasurySolBalance.toFixed(2)} / {HARD_CAP_SOL} SOL</span>
            </div>
            {/* Contenedor barra */}
            <div style={{ width: '100%', height: '12px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>Fase 1 completada al {progressPercent.toFixed(1)}%</p>
          </div>

          {/* TARJETA TOKENOMICS */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid rgba(251,191,36,0.15)', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#fbbf24', fontWeight: 'bold', textTransform: 'uppercase' }}>📊 Distribución del Token</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span> Preventa: 40%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#a78bfa' }}></span> Liquidez Raydium: 30%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span> Marketing/CEX: 15%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f43f5e' }}></span> Team Reserva: 15%</div>
            </div>
            <button onClick={watchARGToken} style={{ marginTop: '20px', width: '100%', backgroundColor: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', color: '#a78bfa', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              🦊 Importar ARG Token directo a mi Phantom
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: TARJETA DE COMPRA PREMIUM */}
        <div style={{ flex: '1 1 420px', maxWidth: '460px' }}>
          <div style={{ 
            backgroundColor: '#0b1329', 
            border: '2px solid #fbbf24', 
            borderRadius: '24px', 
            padding: '35px', 
            boxShadow: '0 0 30px rgba(251,191,36,0.15)',
            position: 'relative'
          }}>
            {/* NOVEDAD FASE 2: VISUALIZACIÓN EN VIVO DEL SALDO DEL USUARIO */}
            {connected && userSolBalance !== null && (
              <div style={{ position: 'absolute', top: '15px', right: '25px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>
                Wallet Bal: {userSolBalance.toFixed(4)} SOL
              </div>
            )}

            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '25px', textAlign: 'center' }}>Módulo de Intercambio</h2>
            
            {/* SELECTOR ASSET */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>SELECCIONA MONEDA DE PAGO:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setCurrency('USDT')} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: currency === 'USDT' ? '#065f46' : '#1e293b', color: currency === 'USDT' ? '#34d399' : '#94a3b8' }}>
                  <img src={LOGO_USDT} style={{ width: '18px', height: '18px', borderRadius: '50%' }} alt="USDT" /> USDT
                </button>
                <button onClick={() => setCurrency('SOL')} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: currency === 'SOL' ? '#4c1d95' : '#1e293b', color: currency === 'SOL' ? '#c084fc' : '#94a3b8' }}>
                  <img src={LOGO_SOL} style={{ width: '18px', height: '18px', borderRadius: '50%' }} alt="SOL" /> SOL
                </button>
              </div>
            </div>

            {/* INPUT TOKENS ARG DESEADOS */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>CANTIDAD DE ARG A RECIBIR:</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={argAmount} onChange={(e) => setArgAmount(e.target.value)} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', padding: '16px 50px 16px 16px', borderRadius: '12px', color: '#ffffff', fontSize: '18px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                <img src={LOGO_AURA_GOLD} style={{ position: 'absolute', right: '14px', top: '16px', width: '22px', height: '22px', borderRadius: '50%' }} alt="ARG" />
              </div>
            </div>

            {/* INPUT MONEDA FIJO CALCULADO */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>TOTAL ESTIMADO A PAGAR:</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={payAmount} onChange={(e) => handlePayChange(e.target.value)} style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', padding: '16px 50px 16px 16px', borderRadius: '12px', color: '#fbbf24', fontSize: '18px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                <img src={currency === 'SOL' ? LOGO_SOL : LOGO_USDT} style={{ position: 'absolute', right: '14px', top: '16px', width: '22px', height: '22px', borderRadius: '50%' }} alt="Pay Currency" />
              </div>
              <p style={{ margin: '8px 0 0 4px', fontSize: '11px', color: '#475569' }}>Ratio de Preventa Fijo: $0.01 USD por Token</p>
            </div>

            {/* BOTÓN PRINCIPAL */}
            <button onClick={handlePurchase} style={{ 
              width: '100%', 
              background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)', 
              color: '#ffffff', 
              border: 'none', 
              padding: '18px', 
              borderRadius: '14px', 
              fontSize: '16px', 
              fontWeight: 'extrabold', 
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(217,119,6,0.3)'
            }}>
              {connected ? 'Adquirir Aura Gold' : 'Conecta tu Wallet'}
            </button>
          </div>
        </div>
      </main>

      {/* MODAL INTEGRADO DE NOTIFICACIONES WEB3 */}
      {txStatus !== 'IDLE' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(2, 6, 23, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ 
            backgroundColor: '#0f172a', 
            border: `2px solid ${txStatus === 'SUCCESS' ? '#10b981' : txStatus === 'ERROR' ? '#f43f5e' : '#fbbf24'}`, 
            padding: '35px', 
            borderRadius: '20px', 
            maxWidth: '440px', 
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
          }}>
            {txStatus === 'LOADING' && <h2 style={{ color: '#fbbf24', margin: '0 0 14px 0' }}>⏳ Procesando...</h2>}
            {txStatus === 'SUCCESS' && <h2 style={{ color: '#10b981', margin: '0 0 14px 0' }}>🎉 ¡Reserva Exitosa!</h2>}
            {txStatus === 'ERROR' && <h2 style={{ color: '#f43f5e', margin: '0 0 14px 0' }}>❌ Hubo un Problema</h2>}
            
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 20px 0' }}>{modalMessage}</p>
            
            {txStatus === 'SUCCESS' && lastSignature && (
              <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Firma Blockchain:</span><br/>
                <code style={{ color: '#34d399', wordBreak: 'break-all' }}>{lastSignature}</code>
              </div>
            )}

            {txStatus !== 'LOADING' && (
              <button onClick={() => setTxStatus('IDLE')} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Entendido
              </button>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: '60px', borderTop: '1px solid rgba(51, 65, 85, 0.4)', padding: '30px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px 0' }}>CONTRATO OFICIAL MINT ADDRESS (SOLANA MAINNET):</p>
        <code style={{ fontSize: '12px', color: '#fbbf24', wordBreak: 'break-all' }}>{MINT_ADDRESS}</code>
      </footer>
    </div>
  );
}
