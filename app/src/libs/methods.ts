import { BN, Program } from '@project-serum/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { SplStaking } from 'idl/spl_staking';
import { getClosePdaInstruction, getCreateUserInstruction, getDrainInstruction, getFundInstruction, getInitializeVaultInstruction, getStakeInstruction, getUnstakeInstruction, getUpdateVaultInstruction } from './instructions';
import { getUserPda } from './utils';

export async function callCreateUser(
  wallet: WalletContextState,
  program: Program<SplStaking>,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getCreateUserInstruction(program, wallet.publicKey)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function initializeVault(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  dailyPayoutAmount: BN,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getInitializeVaultInstruction(program, wallet.publicKey, name, tokenMint, dailyPayoutAmount)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function updateVault(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  dailyPayoutAmount: BN,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getUpdateVaultInstruction(program, wallet.publicKey, name, tokenMint, dailyPayoutAmount)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function fund(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  amount: BN,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getFundInstruction(program, wallet.publicKey, name, tokenMint, amount)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function drain(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  amount: BN,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getDrainInstruction(program, wallet.publicKey, name, tokenMint, amount)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function stake(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  amount: BN,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();
    const [user] = getUserPda(wallet.publicKey);
    const userData = await program.account.user.fetchNullable(user);

    if (!userData) {
      transaction.add(
        await getCreateUserInstruction(program, wallet.publicKey)
      );
    }

    transaction.add(
      await getStakeInstruction(program, name, wallet.publicKey, tokenMint, amount)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function unstake(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  name: string,
  tokenMint: PublicKey,
  amount: BN,
  isClaim: boolean,
) {
  if (!wallet.publicKey) return;
  try {
    const transaction = new Transaction();

    transaction.add(
      await getUnstakeInstruction(program, name, wallet.publicKey, tokenMint, amount, isClaim)
    );

    const txSignature = await wallet.sendTransaction(transaction, program.provider.connection, { skipPreflight: true });
    await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    return txSignature;
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function callClosePdas(
  wallet: WalletContextState,
  program: Program<SplStaking>,
  pdas: Array<PublicKey>,
) {
  if (!wallet.publicKey || !wallet.signAllTransactions) return;
  try {
    const txns = [];
    let transaction = new Transaction();
    let cnt = 0;
    for (const pda of pdas) {
      transaction.add(
        await getClosePdaInstruction(program, wallet.publicKey, pda)
      );
      cnt++;
      if (cnt % 10 === 0) {
        txns.push(transaction);
        transaction = new Transaction();
      }
    }
    if (cnt % 10 && transaction.instructions.length) txns.push(transaction);
    const recentBlockhash = await (await program.provider.connection.getLatestBlockhash('finalized')).blockhash;
    for (const transaction of txns) {
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = recentBlockhash;
    }
    const signedTxns = await wallet.signAllTransactions(txns);
    const txSignatures = [];
    for (const signedTxn of signedTxns) {
      const txSignature = await program.provider.connection.sendRawTransaction(signedTxn.serialize(), { skipPreflight: true });
      txSignatures.push(txSignature);
    }
    for (const txSignature of txSignatures) {
      await program.provider.connection.confirmTransaction(txSignature, "confirmed");
    }
    return txSignatures;
  } catch (error) {
    console.log(error);
    return;
  }
}