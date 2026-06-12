import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import PresaleContent from './PresaleContent';

// Estilos globales de Solana Wallet Adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Endpoint RPC Premium de Rescate (Inmune a bloqueos 403)
const NODE_RPC_ENDPOINT = 'https://rpc.ankr.com/solana';

export default function App() {
  // Dejar vacío para usar el estándar global inyectado (Solana Wallet Standard)
  const wallets = useMemo(() => [], []);

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
