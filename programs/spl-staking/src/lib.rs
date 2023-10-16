mod ins;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer};

use crate::ins::*;

declare_id!("FGwXhUXfWG2gNkrJ5WyLCv7XKCsBq18AKGiRs95KF7qd");

#[program]
pub mod spl_staking {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        name: String,
        token_mint: Pubkey,
        daily_payout_amount: u64,
        reward_bump: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        vault.name = name;
        vault.bump = *ctx.bumps.get("vault").unwrap();
        vault.token_mint = token_mint;
        vault.daily_payout_amount = daily_payout_amount;
        vault.authority = ctx.accounts.authority.key();
        vault.total_reward_amount = 0;
        vault.total_staked_amount = 0;
        vault.reward_bump = reward_bump;

        Ok(())
    }

    pub fn update_vault(
        ctx: Context<UpdateVault>,
        token_mint: Pubkey,
        daily_payout_amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        vault.token_mint = token_mint;
        vault.daily_payout_amount = daily_payout_amount;

        Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;

        user.key = ctx.accounts.authority.key();
        user.bump = *ctx.bumps.get("user").unwrap();
        user.staked_amount = 0;
        user.earned_amount = 0;

        Ok(())
    }

    pub fn fund(ctx: Context<Fund>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        vault.total_reward_amount = vault.total_reward_amount.checked_add(amount).unwrap();

        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.authority_ata.to_account_info(),
                    to: ctx.accounts.reward_vault_ata.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn drain(ctx: Context<Drain>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        vault.total_reward_amount = vault.total_reward_amount.checked_sub(amount).unwrap();
        let bump = vault.bump;
        let name = vault.name.clone();
        let seeds = [b"reward_vault".as_ref(), name.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault_ata.to_account_info(),
                    to: ctx.accounts.authority_ata.to_account_info(),
                    authority: ctx.accounts.reward_vault.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user;

        user.update(vault);

        vault.total_staked_amount = vault.total_staked_amount.checked_add(amount).unwrap();
        user.staked_amount = user.staked_amount.checked_add(amount).unwrap();

        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.staker_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.staker.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64, is_claim: bool) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user;

        user.update(vault);
        if is_claim == true {
            let amount = user.earned_amount;
            vault.total_reward_amount = vault.total_reward_amount.checked_sub(amount).unwrap();
            user.earned_amount = 0;

            let bump = vault.reward_bump;
            let name = vault.name.clone();
            let seeds = [b"reward_vault".as_ref(), name.as_ref(), &[bump]];
            let signer = &[&seeds[..]];

            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.reward_vault_ata.to_account_info(),
                        to: ctx.accounts.staker_ata.to_account_info(),
                        authority: ctx.accounts.reward_vault.to_account_info(),
                    },
                    signer,
                ),
                amount,
            )?;
        } else {
            vault.total_staked_amount = vault.total_staked_amount.checked_sub(amount).unwrap();
            user.staked_amount = user.staked_amount.checked_sub(amount).unwrap();

            let bump = vault.bump;
            let name = vault.name.clone();
            let seeds = [b"vault".as_ref(), name.as_ref(), &[bump]];
            let signer = &[&seeds[..]];

            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_ata.to_account_info(),
                        to: ctx.accounts.staker_ata.to_account_info(),
                        authority: ctx.accounts.vault.to_account_info(),
                    },
                    signer,
                ),
                amount,
            )?;
        }
        Ok(())
    }

    pub fn close_pda(ctx: Context<ClosePda>) -> Result<()> {
        let dest_account_info = ctx.accounts.signer.to_account_info();
        let source_account_info = ctx.accounts.pda.to_account_info();
        let dest_starting_lamports = dest_account_info.lamports();
        **dest_account_info.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(source_account_info.lamports())
            .unwrap();
        **source_account_info.lamports.borrow_mut() = 0;

        Ok(())
    }
}
