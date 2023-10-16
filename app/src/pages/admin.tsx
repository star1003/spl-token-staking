/* eslint-disable react-hooks/exhaustive-deps */
import { BN } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_MINT } from 'config';
import useProgram from 'hooks/useProgram';
import { callClosePdas, drain, fund, initializeVault, updateVault } from 'libs/methods';
import { useEffect, useState } from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import useFetchVault from 'hooks/useFetchVault';
import { getMint } from '@solana/spl-token';

export default function Admin() {
  const wallet = useWallet();
  const program = useProgram();
  const [tokenMintAddress, setTokenMintAddress] = useState(TOKEN_MINT);
  const [dailyPayoutAmount, setDailyPayoutAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [reload, setReload] = useState({});
  const [name, setName] = useState("");
  const { vault, decimals } = useFetchVault(reload, name);

  const handleInitializeVault = async () => {
    if (!program) return;
    const mint = new PublicKey(tokenMintAddress);
    let { decimals } = await getMint(program.provider.connection, mint);
    decimals = Math.pow(10, decimals);
    await initializeVault(wallet, program, name, mint, new BN(dailyPayoutAmount * decimals));
    setReload({});
  }

  const handleUpdateVault = async () => {
    if (!program) return;
    const mint = new PublicKey(tokenMintAddress);
    let { decimals } = await getMint(program.provider.connection, mint);
    decimals = Math.pow(10, decimals);
    await updateVault(wallet, program, name, mint, new BN(dailyPayoutAmount * decimals));
    setReload({});
  }

  const handleFund = async () => {
    if (!program || !vault) return;

    await fund(wallet, program, name, vault.tokenMint, new BN(amount * decimals));
    setReload({});
  }

  const handleDrain = async () => {
    if (!program || !vault) return;

    await drain(wallet, program, name, vault.tokenMint, new BN(amount * decimals));
    setReload({});
  }

  const handleCloseAll = async () => {
    if (!program) return;

    const vaults = await program.account.vault.all();
    const users = await program.account.user.all();
    await callClosePdas(wallet, program, [
      ...vaults.map(vault => vault.publicKey),
      ...users.map(user => user.publicKey),
    ]);
    setReload({});
  }

  useEffect(() => {
    if (vault) {
      setTokenMintAddress(vault.tokenMint.toString());
      setDailyPayoutAmount(vault.dailyPayoutAmount.toNumber() / decimals);
    }
  }, [vault, decimals]);

  return (
    <div className='flex flex-col gap-2'>
      <WalletMultiButton />
      Vault Name: <input value={name} onChange={(e) => setName(e.target.value)} type="text" />
      Mint: <input value={tokenMintAddress} onChange={(e) => setTokenMintAddress(e.target.value)} type="text" />
      Daily Payout Amount: <input value={dailyPayoutAmount} onChange={(e) => setDailyPayoutAmount(parseFloat(e.target.value) || 0.0)} type="number" />
      {!vault && <button onClick={handleInitializeVault}>Initialize</button>}
      {vault &&
        <>
          <button onClick={handleUpdateVault}>Update</button>
          Amount: <input value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0.0)} type="number" />
          <button onClick={handleFund}>Fund</button>
          <button onClick={handleDrain}>Drain</button>
          {/* <button onClick={handleCloseAll}>Close All</button> */}
          <div>
            Total Staked: {vault ? vault.totalStakedAmount.toNumber() / decimals : 0}
          </div>
          <div>
            Total Rewards: {vault ? vault.totalRewardAmount.toNumber() / decimals : 0}
          </div>
        </>
      }
    </div>
  )
}