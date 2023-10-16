import { useState, useEffect, useCallback } from 'react';
import { UserData, VaultData } from 'types';
import useProgram from './useProgram';
import { getUserPda, getVaultPda } from 'libs/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddressSync, getMint } from '@solana/spl-token';

const useFetchVault = (reload: {}, name: string) => {
  const [vault, setVault] = useState<VaultData>();
  const [decimals, setDecimals] = useState(1);
  const [user, setUser] = useState<UserData>();
  const [balance, setBalance] = useState(0);
  const program = useProgram();
  const { publicKey } = useWallet();

  const fetchVault = useCallback(async () => {
    if (!program || !publicKey) return;
    try {
      const [vault] = getVaultPda(name);
      const vaultData = await program.account.vault.fetchNullable(vault);

      if (vaultData) {
        const { decimals } = await getMint(program.provider.connection, vaultData.tokenMint);
        setDecimals(Math.pow(10, decimals));
        const ata = getAssociatedTokenAddressSync(vaultData.tokenMint, publicKey);
        const { value: { uiAmount } } = await program.provider.connection.getTokenAccountBalance(ata);
        setBalance(uiAmount || 0);
      }
      setVault(vaultData as VaultData);
      const [user] = getUserPda(publicKey);
      const userData = await program.account.user.fetchNullable(user);
      setUser(userData as UserData);
    } catch (error) {
      console.log(error);
    }
  }, [program, publicKey, name]);

  useEffect(() => {
    fetchVault();
  }, [program, fetchVault, reload, name]);

  return { vault, user, balance, decimals };
};

export default useFetchVault;