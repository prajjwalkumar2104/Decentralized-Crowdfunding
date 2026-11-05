import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { contractABI, contractAddress } from "@/lib/contract";

// Create a public Viem client to read from Sepolia
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org";
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignIdParam = searchParams.get("campaignId");

  if (!campaignIdParam || !/^\d+$/.test(campaignIdParam)) {
    return NextResponse.json(
      { error: "Invalid or missing campaignId parameter." },
      { status: 400 }
    );
  }

  const campaignId = BigInt(campaignIdParam);

  try {
    // 1. Fetch on-chain campaign data in parallel
    const [campaignData, donatorsData, milestonesData] = await Promise.all([
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "getCampaign",
        args: [campaignId],
      }) as Promise<[string, string, string, bigint, bigint, bigint, string, string, string, string, bigint, boolean]>,
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "getDonators",
        args: [campaignId],
      }) as Promise<[string[], bigint[]]>,
      publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "getMilestones",
        args: [campaignId],
      }) as Promise<any[]>,
    ]);

    const [
      owner,
      title,
      description,
      target,
      deadline,
      amountCollected,
      image,
      token,
      tokenSymbol,
      tokenImage,
      tokensPerEth,
      cancelled,
    ] = campaignData;

    const [donatorAddresses = [], donatorAmounts = []] = donatorsData || [[], []];

    // 2. Compute the 12 ML Features
    const targetEth = Number(formatEther(target || 1n));
    const collectedEth = Number(formatEther(amountCollected || 0n));
    const funding_progress = targetEth > 0 ? collectedEth / targetEth : 0.0;

    const contributor_count = donatorAddresses.length;
    const uniqueWallets = new Set(donatorAddresses.map((a) => a.toLowerCase()));
    const unique_contributor_count = uniqueWallets.size;

    const ethAmounts = donatorAmounts.map((amt) => Number(formatEther(amt || 0n)));
    const avg_contribution_eth =
      contributor_count > 0
        ? ethAmounts.reduce((a, b) => a + b, 0) / contributor_count
        : 0.0;

    // Standard deviation of donation amounts
    let contribution_std_eth = 0.0;
    if (contributor_count > 1) {
      const variance =
        ethAmounts.reduce((sum, val) => sum + Math.pow(val - avg_contribution_eth, 2), 0) /
        contributor_count;
      contribution_std_eth = Math.sqrt(variance);
    }

    // Top contributor share
    const maxDonationEth = ethAmounts.length > 0 ? Math.max(...ethAmounts) : 0.0;
    const top_contributor_share =
      collectedEth > 0 ? Math.min(1.0, maxDonationEth / collectedEth) : 0.0;

    // Milestones features
    const milestone_count = milestonesData ? milestonesData.length : 0;
    let releasedCount = 0;
    let maxVoteWeight = 0n;

    if (milestonesData && milestonesData.length > 0) {
      milestonesData.forEach((m: any) => {
        const released = Array.isArray(m) ? Boolean(m[3]) : Boolean(m?.released);
        const weight = Array.isArray(m) ? BigInt(m[2] ?? 0n) : BigInt(m?.voteWeight ?? 0n);
        if (released) releasedCount++;
        if (weight > maxVoteWeight) maxVoteWeight = weight;
      });
    }

    const milestone_completion_ratio =
      milestone_count > 0 ? releasedCount / milestone_count : 0.0;

    const voteWeightEth = Number(formatEther(maxVoteWeight));
    const milestone_vote_participation =
      collectedEth > 0 ? Math.min(1.0, voteWeightEth / collectedEth) : 0.0;

    // Days until deadline
    const nowSec = Math.floor(Date.now() / 1000);
    const deadlineSec = Number(deadline || 0n);
    const days_until_deadline = Math.max(0, (deadlineSec - nowSec) / 86400);

    // Creator campaign count (default 1 if single query)
    const creator_campaign_count = 1;

    // 3. Assemble feature payload
    const featurePayload = {
      campaign_id: campaignIdParam,
      funding_progress: Math.min(3.0, funding_progress),
      contributor_count: contributor_count,
      unique_contributor_count: unique_contributor_count,
      avg_contribution_eth: avg_contribution_eth,
      contribution_std_eth: contribution_std_eth,
      top_contributor_share: Math.min(1.0, Math.max(0.0, top_contributor_share)),
      milestone_count: milestone_count,
      milestone_completion_ratio: milestone_completion_ratio,
      milestone_vote_participation: milestone_vote_participation,
      is_cancelled: cancelled ? 1 : 0,
      days_until_deadline: days_until_deadline,
      creator_campaign_count: creator_campaign_count,
    };

    // 4. Call Python FastAPI AI Service
    const aiServiceUrl =
      process.env.AI_SERVICE_URL ||
      process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
      "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${aiServiceUrl}/api/risk-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featurePayload),
        signal: AbortSignal.timeout(4000), // 4 second timeout so frontend is never blocked
      });

      if (!response.ok) {
        throw new Error(`AI service responded with HTTP ${response.status}`);
      }

      const riskData = await response.json();
      return NextResponse.json({
        success: true,
        features: featurePayload,
        assessment: riskData,
      });
    } catch (aiErr: any) {
      console.warn("AI Service unavailable or timed out:", aiErr.message);
      // Graceful fallback: return features with unavailable status
      return NextResponse.json({
        success: false,
        features: featurePayload,
        assessment: null,
        message: "AI risk analysis service is currently offline or unreachable.",
      });
    }
  } catch (err: any) {
    console.error("Error fetching campaign data for risk analysis:", err);
    return NextResponse.json(
      { error: "Failed to read on-chain campaign data.", details: err.message },
      { status: 500 }
    );
  }
}
