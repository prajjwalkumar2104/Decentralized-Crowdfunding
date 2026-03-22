"use client";
import { useReadContract } from "wagmi";
import { contractAddress, contractABI } from "@/lib/contract";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Test() {
  const { data: campaignIds, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getCampaigns",
  });

  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) return;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const details = await Promise.all(
        campaignIds.map(async (id) => {
          try {
          
            const campaign = await contract.getCampaign(id);
            return campaign;
            console.log(campaign)
          } catch (e) {
            return null;
          }
        })
      );
      setCampaigns(details.filter(Boolean));
    }
    fetchCampaigns();
  }, [campaignIds]);

  if (isLoading) return <p>Loading...</p>;
  if (!campaignIds || campaignIds.length === 0) return <p>No campaigns found.</p>;

  return (
    <div>
      <h2>All Campaigns</h2>
      <ul>
        {campaigns.map((campaign, idx) => (
          <li key={idx} className="mb-4 p-2 border rounded">
            {Object.entries(campaign).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value?.toString()}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}