"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart } from "lucide-react";
import { useReadContract } from "wagmi";
import { contractAddress, contractABI } from "@/lib/contract";
import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { getIpfsImageUrl } from "@/lib/ipfs";

type CampaignCard = {
  id: bigint;
  owner: string;
  title: string;
  description: string;
  target: bigint;
  deadline: bigint;
  amountCollected: bigint;
  image: string;
  token: string;
  tokenSymbol: string;
  tokenImage: string;
  tokensPerEth: bigint;
  cancelled: boolean;
};

const formatEth = (value: bigint) => {
  const asEth = Number(formatEther(value));
  return asEth >= 1000 ? `${asEth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH` : `${asEth.toFixed(3)} ETH`;
};

const getProgress = (collected: bigint, target: bigint) => {
  if (target <= BigInt(0)) return 0;
  const ratio = Number((collected * BigInt(10000)) / target) / 100;
  return Math.min(100, Math.max(0, ratio));
};

const getDaysLeft = (deadline: bigint) => {
  const now = Math.floor(Date.now() / 1000);
  const delta = Number(deadline) - now;
  if (delta <= 0) return "Ended";
  const days = Math.ceil(delta / (60 * 60 * 24));
  return `${days}d left`;
};
const ProjectGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const { data: campaignIds, isLoading: loadingIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI as any,
    functionName: "getCampaigns",
  });

  const typedCampaignIds = (campaignIds as bigint[] | undefined) ?? [];

  const { data: campaignsResult, isLoading: loadingCampaigns } = useReadContracts({
    contracts: typedCampaignIds.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: contractABI as any,
      functionName: "getCampaign",
      args: [id],
    })),
    query: {
      enabled: typedCampaignIds.length > 0,
    },
  });

  const campaigns: CampaignCard[] =
    campaignsResult
      ?.map((item, index) => {
        if (item.status !== "success" || !item.result) return null;
        const result = item.result as unknown as [string, string, string, bigint, bigint, bigint, string, string, string, string, bigint, boolean];
        return {
          id: typedCampaignIds[index],
          owner: result[0],
          title: result[1],
          description: result[2],
          target: result[3],
          deadline: result[4],
          amountCollected: result[5],
          image: result[6],
          token: result[7],
          tokenSymbol: result[8],
          tokenImage: result[9],
          tokensPerEth: result[10],
          cancelled: result[11],
        };
      })
      .filter((campaign): campaign is CampaignCard => campaign !== null)
      .filter((campaign) => !campaign.cancelled) ?? [];



  return (
    <section id="projects" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Discover Projects
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Support groundbreaking public goods — every contribution is matched and amplified.
          </p>
        </motion.div>

        {loadingIds || loadingCampaigns ? (
          <p className="text-center text-muted-foreground">Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-center text-muted-foreground">No active campaigns found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((project, i) => {
              const progress = getProgress(project.amountCollected, project.target);
              return (
                <Link href={`/campaign/${project.id.toString()}`} key={project.id.toString()} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.08 * i, duration: 0.5 }}
                    className="glass-card glass-card-hover rounded-1xl overflow-hidden group cursor-pointer transition-all duration-300"
                  >
                    <div className="h-40 relative overflow-hidden bg-muted/30">
                      {project.image ? (
                        <img
                          src={getIpfsImageUrl(project.image)}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 grid-pattern opacity-40" />
                          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-secondary/10" />
                        </>
                      )}

                      <div className="absolute top-3 left-3 text-xs font-medium glass-card rounded-full px-3 py-1 text-foreground">
                        #{project.id.toString()}
                      </div>
                      <div className="absolute top-3 right-3 text-xs font-medium glass-card rounded-full px-3 py-1 text-foreground">
                        {getDaysLeft(project.deadline)}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {project.title || "Untitled Campaign"}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                        {project.description || "No description provided."}
                      </p>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">{progress.toFixed(2)}% funded</span>
                          <span className="text-foreground font-medium">{formatEth(project.target)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-black transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Heart className="h-3.5 w-3.5" />
                          Raised {formatEth(project.amountCollected)}
                        </div>
                        <span className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                          View & Support →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectGrid;
