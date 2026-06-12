import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter, 
  TrustWalletAdapter 
} from '@solana/wallet-adapter-wallets';
import PresaleContent from './PresaleContent';

// Estilos globales obligatorios del modal de Solana
import '@solana/wallet-adapter-react-ui/styles.css';

// Endpoint oficial alternativo para mitigar errores de límite de cuota (403 Forbidden)
const NODE_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

export default function App() {
  // Configuración de adaptadores compatibles tanto con PC como con dApps navegadores en Móviles
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(), // Habilita la integración profunda para TrustWallet en Android/iOS
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={NODE_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {/* Le pasamos el RPC por propiedad para que PresaleContent lo use en sus consultas en vivo */}
          <PresaleContent rpcEndpoint={NODE_RPC_ENDPOINT} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
