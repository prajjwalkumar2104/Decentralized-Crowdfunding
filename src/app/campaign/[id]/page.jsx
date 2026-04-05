"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { contractABI, contractAddress } from "@/lib/contract";

const formatEth = (value) => {
  const asEth = Number(formatEther(value ?? 0n));
  return asEth >= 1000
    ? `${asEth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH`
    : `${asEth.toFixed(3)} ETH`;
};

const truncateAddress = (address) => {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getProgress = (collected, target) => {
  if (!target || target <= 0n) return 0;
  const ratio = Number((collected * 10000n) / target) / 100;
  return Math.min(100, Math.max(0, ratio));
};

const getDeadlineText = (deadline) => {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Number(deadline) - now;
  if (secondsLeft <= 0) return "Ended";

  const days = Math.floor(secondsLeft / (60 * 60 * 24));
  const hours = Math.floor((secondsLeft % (60 * 60 * 24)) / (60 * 60));
  return `${days}d ${hours}h left`;
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const campaignId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw !== "string") return null;
    if (!/^\d+$/.test(raw)) return null;
    return BigInt(raw);
  }, [params]);

  const [donationAmount, setDonationAmount] = useState("");
  const [donationError, setDonationError] = useState("");

  const {
    data: campaign,
    isLoading,
    refetch: refetchCampaign,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getCampaign",
    args: campaignId !== null ? [campaignId] : undefined,
    query: {
      enabled: campaignId !== null,
    },
  });

  const { writeContract, data: donationHash, isPending: isSendingDonation } =
    useWriteContract();

  const {
    isLoading: isConfirmingDonation,
    isSuccess: isDonationSuccess,
    isError: isDonationFailed,
  } = useWaitForTransactionReceipt({
    hash: donationHash,
  });

  useEffect(() => {
    if (!isDonationSuccess) return;
    setDonationAmount("");
    void refetchCampaign();
  }, [isDonationSuccess, refetchCampaign]);

  const handleDonate = () => {
    if (campaignId === null) {
      setDonationError("Invalid campaign id.");
      return;
    }

    const amount = donationAmount.trim();
    if (!amount) {
      setDonationError("Please enter an ETH amount.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setDonationError("Amount must be greater than 0.");
      return;
    }

    try {
      setDonationError("");
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "donateToCampaign",
        args: [campaignId],
        value: parseEther(amount),
      });
    } catch {
      setDonationError("Transaction could not be started.");
    }
  };

  const campaignData = useMemo(() => {
    if (!campaign) return null;

    const [owner, title, description, target, deadline, amountCollected, image, cancelled] = campaign;

    return {
      owner,
      title,
      description,
      target,
      deadline,
      amountCollected,
      image,
      cancelled,
    };
  }, [campaign]);

  if (campaignId === null) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-red-600">Invalid campaign id.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading || !campaignData) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Loading campaign details...</p>
        </div>
      </main>
    );
  }

  const progress = getProgress(campaignData.amountCollected, campaignData.target);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-primary">
            ← Back to Home
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Campaign #{campaignId.toString()}
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-64 w-full bg-muted/30 md:h-80">
            {campaignData.image ? (
              <img
                src={campaignData.image}
                alt={campaignData.title || "Campaign image"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image provided
              </div>
            )}
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[2fr_1fr]">
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {campaignData.title || "Untitled Campaign"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {campaignData.description || "No description provided."}
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <p>
                  <span className="font-semibold text-foreground">Owner: </span>
                  <span className="text-muted-foreground">{truncateAddress(campaignData.owner)}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Deadline: </span>
                  <span className="text-muted-foreground">{getDeadlineText(campaignData.deadline)}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Status: </span>
                  <span className="text-muted-foreground">
                    {campaignData.cancelled ? "Cancelled" : "Active"}
                  </span>
                </p>
              </div>
            </div>

            <aside className="rounded-xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Funding
              </p>
              <p className="mt-3 text-sm text-muted-foreground">Raised</p>
              <p className="text-xl font-bold text-foreground">{formatEth(campaignData.amountCollected)}</p>

              <p className="mt-4 text-sm text-muted-foreground">Target</p>
              <p className="text-xl font-bold text-foreground">{formatEth(campaignData.target)}</p>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{progress.toFixed(2)}% funded</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Support This Campaign</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter an amount in ETH and donate directly to this campaign.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="number"
              min="0"
              step="any"
              value={donationAmount}
              onChange={(e) => {
                setDonationError("");
                setDonationAmount(e.target.value);
              }}
              placeholder="0.01"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleDonate}
              disabled={isSendingDonation || isConfirmingDonation || campaignData.cancelled}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isSendingDonation || isConfirmingDonation ? "Processing..." : "Donate Now"}
            </button>
          </div>

          {campaignData.cancelled && (
            <p className="mt-3 text-xs text-red-600">This campaign is cancelled and cannot accept donations.</p>
          )}
          {donationError && <p className="mt-3 text-xs text-red-600">{donationError}</p>}
          {isDonationFailed && (
            <p className="mt-3 text-xs text-red-600">Donation failed. Please try again.</p>
          )}
          {isDonationSuccess && (
            <p className="mt-3 text-xs text-green-600">Donation successful. Thank you for supporting.</p>
          )}
        </section>
      </div>
    </main>
  );
}
