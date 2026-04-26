"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { contractABI, contractAddress } from "@/lib/contract";

type CampaignTuple = [
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  string,
  string,
  string,
  string,
  bigint,
  boolean,
];

type EarningRow = {
  id: bigint;
  title: string;
  tokenSymbol: string;
  earned: bigint;
  tokensPerEth: bigint;
};

const formatTokenAmount = (value: bigint) => {
  const raw = formatUnits(value, 18);
  const [whole, fraction = ""] = raw.split(".");
  const trimmed = fraction.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
};

const formatEthValue = (valueAsEth: string) => {
  const numeric = Number(valueAsEth);
  if (!Number.isFinite(numeric)) return "0 ETH";
  if (numeric >= 1) return `${numeric.toFixed(4)} ETH`;
  if (numeric > 0) return `${numeric.toFixed(6)} ETH`;
  return "0 ETH";
};

const UserTokenEarnings = () => {
  const { address, isConnected } = useAccount();

  const { data: campaignIds, isLoading: isLoadingIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI as any,
    functionName: "getCampaigns",
  });

  const ids = (campaignIds as bigint[] | undefined) ?? [];

  const { data: earningsResult, isLoading: isLoadingEarnings } = useReadContracts({
    contracts: ids.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: contractABI as any,
      functionName: "getInvestorTokenEarnings",
      args: [id, address as `0x${string}`],
    })),
    query: {
      enabled: ids.length > 0 && Boolean(address),
    },
  });

  const { data: campaignDetails } = useReadContracts({
    contracts: ids.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: contractABI as any,
      functionName: "getCampaign",
      args: [id],
    })),
    query: {
      enabled: ids.length > 0 && Boolean(address),
    },
  });

  const earnings = useMemo(() => {
    if (!address || !earningsResult || !campaignDetails) return [] as EarningRow[];

    const rows: EarningRow[] = [];

    for (let index = 0; index < ids.length; index++) {
      const earningItem = earningsResult[index];
      const campaignItem = campaignDetails[index];

      if (!earningItem || earningItem.status !== "success") continue;
      if (!campaignItem || campaignItem.status !== "success") continue;

      const earned = (earningItem.result as bigint | undefined) ?? BigInt(0);
      if (earned <= BigInt(0)) continue;

      const campaign = campaignItem.result as CampaignTuple;

      rows.push({
        id: ids[index],
        title: campaign[1] || `Campaign #${ids[index].toString()}`,
        tokenSymbol: campaign[8] || "TOKEN",
        earned,
        tokensPerEth: campaign[10] ?? BigInt(0),
      });
    }

    return rows.sort((a, b) => (a.earned > b.earned ? -1 : 1));
  }, [address, campaignDetails, earningsResult, ids]);

  const totalEarned = useMemo(() => {
    return earnings.reduce((acc, row) => acc + row.earned, BigInt(0));
  }, [earnings]);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">Your Earned Tokens</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View all campaign tokens earned by your connected public wallet address.
          </p>

          {!isConnected ? (
            <p className="mt-4 text-sm text-muted-foreground">Connect your wallet to view your earnings.</p>
          ) : isLoadingIds || isLoadingEarnings ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading your token earnings...</p>
          ) : earnings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No token earnings found for this wallet yet.</p>
          ) : (
            <>
              <div className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total Earned (all campaigns): </span>
                <span className="font-semibold text-foreground">{formatTokenAmount(totalEarned)} units</span>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-background">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Campaign</th>
                      <th className="px-3 py-2 font-medium">Token</th>
                      <th className="px-3 py-2 font-medium">1 Token Value</th>
                      <th className="px-3 py-2 font-medium">Earned</th>
                      <th className="px-3 py-2 font-medium">Earned Value</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((row) => {
                      const tokenValueInEth =
                        row.tokensPerEth > BigInt(0)
                          ? (1 / Number(row.tokensPerEth)).toString()
                          : "0";
                      const earnedValueInWei =
                        row.tokensPerEth > BigInt(0)
                          ? row.earned / row.tokensPerEth
                          : BigInt(0);
                      const earnedValueInEth = formatUnits(earnedValueInWei, 18);

                      return (
                        <tr key={row.id.toString()} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2 text-foreground">{row.title}</td>
                          <td className="px-3 py-2 text-foreground">{row.tokenSymbol}</td>
                          <td className="px-3 py-2 text-foreground">{formatEthValue(tokenValueInEth)}</td>
                          <td className="px-3 py-2 text-foreground">
                            {formatTokenAmount(row.earned)} {row.tokenSymbol}
                          </td>
                          <td className="px-3 py-2 text-foreground">{formatEthValue(earnedValueInEth)}</td>
                          <td className="px-3 py-2">
                            <Link href={`/campaign/${row.id.toString()}`} className="text-primary hover:underline">
                              View campaign
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserTokenEarnings;
