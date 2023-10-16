import { useEffect, useState } from 'react';
import { UserData, VaultData } from 'types';

const useEarnedReward = (user?: UserData, vault?: VaultData) => {
  const [earned, setEarned] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (!user || !vault) {
        setEarned(0);
        return;
      }
      let earned = user.earnedAmount.toNumber();
      let now = Math.floor(new Date().getTime() / 1000);
      earned = earned + (now - user.lastUpdateTime.toNumber()) * vault.dailyPayoutAmount.toNumber() * user.stakedAmount.toNumber() / vault.totalStakedAmount.toNumber() / 86400;
      setEarned(earned);
    }, 1000);

    return () => clearInterval(id);
  }, [user, vault]);

  return earned;
}

export default useEarnedReward;