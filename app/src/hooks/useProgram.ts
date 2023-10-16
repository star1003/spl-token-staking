import { AnchorProvider, Program } from '@project-serum/anchor';
import { useState, useEffect } from 'react';
import { IDL, SplStaking } from 'idl/spl_staking';
import idl from 'idl/spl_staking.json';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

const useProgram = () => {
    const anchorWallet = useAnchorWallet();
    const { connection } = useConnection();
    const [program, setProgram] = useState<Program<SplStaking>>();

    useEffect(() => {
        if (!connection || !anchorWallet) return;
        const provider = new AnchorProvider(connection, anchorWallet, { preflightCommitment: "processed" });
        const program = new Program(IDL, idl.metadata.address, provider);
        setProgram(program);
    }, [anchorWallet, connection]);
    
    return program;
};

export default useProgram;