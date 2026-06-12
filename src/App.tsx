import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter, 
  TrustWalletAdapter 
} from '@solana/wallet-adapter-wallets';
import PresaleContent from './PresaleContent';

// Estilos globales de Solana Wallet Adapter
import '@solana/wallet-adapter-react-ui/styles.css';

const NODE_RPC_ENDPOINT = 'https://rpc.ankr.com/solana';

export default function App() {
  // Configuración multienlace: esto le dice al modal qué billeteras indexar de forma prioritaria
  // tanto en navegadores de escritorio como en entornos móviles
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(), // Activa el deep linking para Trust Wallet móvil
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={NODE_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <PresaleContent rpcEndpoint={NODE_RPC_ENDPOINT} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
