"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { contractABI, contractAddress } from "@/lib/contract";

type LeaderboardRow = {
  rank: number;
  wallet: string;
  totalDonated: bigint;
};

const truncateAddress = (address: string) => {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatEthAmount = (value: bigint) => {
  const amount = Number(formatEther(value));
  if (amount >= 1000) {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH`;
  }
  return `${amount.toFixed(4)} ETH`;
};

const EthDonationLeaderboard = () => {
  const { address } = useAccount();

  const { data: campaignIds, isLoading: isLoadingIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI as any,
    functionName: "getCampaigns",
  });

  const ids = (campaignIds as bigint[] | undefined) ?? [];

  const { data: donatorsResult, isLoading: isLoadingDonators } = useReadContracts({
    contracts: ids.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: contractABI as any,
      functionName: "getDonators",
      args: [id],
    })),
    query: {
      enabled: ids.length > 0,
    },
  });

  const leaderboard = useMemo(() => {
    if (!donatorsResult) return [] as LeaderboardRow[];

    const totalsByWallet = new Map<string, { displayWallet: string; total: bigint }>();

    for (const resultItem of donatorsResult) {
      if (!resultItem || resultItem.status !== "success" || !resultItem.result) continue;

      const [wallets, donations] = resultItem.result as [string[], bigint[]];

      if (!Array.isArray(wallets) || !Array.isArray(donations)) continue;

      for (let index = 0; index < wallets.length; index++) {
        const wallet = wallets[index];
        const normalized = wallet.toLowerCase();
        const amount = donations[index] ?? 0n;

        const existing = totalsByWallet.get(normalized);
        if (!existing) {
          totalsByWallet.set(normalized, { displayWallet: wallet, total: amount });
          continue;
        }

        totalsByWallet.set(normalized, {
          displayWallet: existing.displayWallet,
          total: existing.total + amount,
        });
      }
    }

    return Array.from(totalsByWallet.values())
      .sort((a, b) => {
        if (a.total === b.total) return 0;
        return a.total > b.total ? -1 : 1;
      })
      .map((entry, index) => ({
        rank: index + 1,
        wallet: entry.displayWallet,
        totalDonated: entry.total,
      }));
  }, [donatorsResult]);

  const userRow = useMemo(() => {
    if (!address) return null;
    const normalizedAddress = address.toLowerCase();
    return leaderboard.find((row) => row.wallet.toLowerCase() === normalizedAddress) ?? null;
  }, [address, leaderboard]);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">ETH Donation Leaderboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rankings are based on total ETH donated by each public wallet across all campaigns.
          </p>

          {address && userRow && (
            <div className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">Your rank: </span>
              <span className="font-semibold text-foreground">#{userRow.rank}</span>
              <span className="text-muted-foreground"> with </span>
              <span className="font-semibold text-foreground">{formatEthAmount(userRow.totalDonated)}</span>
            </div>
          )}

          {isLoadingIds || isLoadingDonators ? (
            <p className="mt-4 text-sm text-muted-foreground">Calculating leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No donations found yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-background">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Wallet</th>
                    <th className="px-3 py-2 font-medium">Total Donated</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => {
                    const isCurrentUser =
                      Boolean(address) && row.wallet.toLowerCase() === address?.toLowerCase();

                    return (
                      <tr
                        key={row.wallet.toLowerCase()}
                        className={`border-b border-border last:border-b-0 ${
                          isCurrentUser ? "bg-primary/10" : ""
                        }`}
                      >
                        <td className="px-3 py-2 font-semibold text-foreground">#{row.rank}</td>
                        <td className="px-3 py-2 font-mono text-foreground">
                          {truncateAddress(row.wallet)}
                        </td>
                        <td className="px-3 py-2 text-foreground">{formatEthAmount(row.totalDonated)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EthDonationLeaderboard;
