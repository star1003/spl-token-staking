import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export type VaultData = {
  authority: PublicKey,
  tokenMint: PublicKey,
  totalRewardAmount: BN,
  totalStakedAmount: BN,
  dailyPayoutAmount: BN,
  bump: number,
}

export type UserData = {
  key: PublicKey;
  stakedAmount: BN;
  lastUpdateTime: BN;
  earnedAmount: BN;
  bump: number;
}