import { PublicKey } from '@solana/web3.js';
import idl from 'idl/spl_staking.json';

export const getVaultPda = (
  name: string,
  programId: PublicKey = new PublicKey(idl.metadata.address),
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      Buffer.from(name),
    ],
    programId
  );
};

export const getRewardVaultPda = (
  name: string,
  programId: PublicKey = new PublicKey(idl.metadata.address),
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("reward_vault"),
      Buffer.from(name),
    ],
    programId
  );
};


export const getUserPda = (
  user: PublicKey,
  programId: PublicKey = new PublicKey(idl.metadata.address)
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("user"),
      user.toBuffer()
    ],
    programId
  );
};