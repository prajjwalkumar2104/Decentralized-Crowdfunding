"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "ethers";
import { useWriteContract } from "wagmi";
import { contractAddress, contractABI } from "@/lib/contract";

export default function Campaign() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        target: "",
        deadline: "",
        tokenName: "",
        tokenSymbol: "",
        tokensPerPointZeroOneEth: "",
        milestoneTitles: [""],
        milestoneAmounts: [""],
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [tokenImageFile, setTokenImageFile] = useState(null);
    const [tokenImagePreview, setTokenImagePreview] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { writeContract } = useWriteContract();

    useEffect(() => {
        if (!imageFile) {
            setImagePreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    useEffect(() => {
        if (!tokenImageFile) {
            setTokenImagePreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(tokenImageFile);
        setTokenImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [tokenImageFile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrorMessage("");
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleMilestoneChange = (idx, field, value) => {
        setErrorMessage("");
        setForm((prev) => {
            const arr = [...prev[field]];
            arr[idx] = value;
            return { ...prev, [field]: arr };
        });
    };

    const addMilestone = () => {
        setForm((prev) => ({
            ...prev,
            milestoneTitles: [...prev.milestoneTitles, ""],
            milestoneAmounts: [...prev.milestoneAmounts, ""],
        }));
    };

    const removeMilestone = (idx) => {
        setForm((prev) => {
            const titles = prev.milestoneTitles.filter((_, i) => i !== idx);
            const amounts = prev.milestoneAmounts.filter((_, i) => i !== idx);
            return { ...prev, milestoneTitles: titles, milestoneAmounts: amounts };
        });
    };

    const handleImageChange = (e) => {
        setErrorMessage("");
        setImageFile(e.target.files?.[0] ?? null);
    };

    const handleTokenImageChange = (e) => {
        setErrorMessage("");
        setTokenImageFile(e.target.files?.[0] ?? null);
    };

    const uploadImageToPinata = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadResponse = await fetch("/api/pinata", {
            method: "POST",
            body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
            throw new Error(uploadResult?.error || "Image upload failed.");
        }

        return uploadResult.cid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            if (!imageFile) {
                throw new Error("Please choose an image before creating the campaign.");
            }
            if (!tokenImageFile) {
                throw new Error("Please choose a token image.");
            }

            const campaignImageCid = await uploadImageToPinata(imageFile);
            const tokenImageCid = await uploadImageToPinata(tokenImageFile);

            const deadlineUnix = BigInt(
                Math.floor(new Date(form.deadline).getTime() / 1000)
            );
            const nowUnix = BigInt(Math.floor(Date.now() / 1000));
            if (deadlineUnix <= nowUnix) {
                throw new Error("Deadline must be a future date.");
            }

            if (!form.target || Number(form.target) <= 0) {
                throw new Error("Please enter a target greater than 0 ETH.");
            }

            if (!form.tokenName.trim()) throw new Error("Please enter a token name.");
            if (!form.tokenSymbol.trim()) throw new Error("Please enter a token symbol.");
            if (!form.tokensPerPointZeroOneEth || Number(form.tokensPerPointZeroOneEth) <= 0) {
                throw new Error("Please enter a valid token rate (tokens per 0.01 ETH).");
            }

            const ethtarget = parseEther(form.target.toString());
            // Contract stores tokens per 1 ETH; UI captures tokens per 0.01 ETH for easier setup.
            const tokensPerEth = BigInt(form.tokensPerPointZeroOneEth) * BigInt(100);

            if (!form.milestoneTitles.length) {
                throw new Error("Add at least one milestone.");
            }
            if (form.milestoneTitles.some((title) => !String(title || "").trim())) {
                throw new Error("Every milestone must have a title.");
            }

            if (form.milestoneAmounts.some((amt) => !amt || Number(amt) <= 0)) {
                throw new Error("Every milestone amount must be greater than 0 ETH.");
            }

            const milestoneAmountsWei = form.milestoneAmounts.map((amt) =>
                parseEther(amt.toString())
            );

            const totalMilestonesWei = milestoneAmountsWei.reduce((acc, value) => acc + value, BigInt(0));
            if (totalMilestonesWei > ethtarget) {
                throw new Error("Total milestone amount cannot exceed campaign target.");
            }

            writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "createCampaignWithToken",
                args: [
                    form.title,
                    form.description,
                    ethtarget,
                    deadlineUnix,
                    campaignImageCid,
                    form.tokenName.trim(),
                    form.tokenSymbol.trim(),
                    tokenImageCid,
                    tokensPerEth,
                    form.milestoneTitles,
                    milestoneAmountsWei,
                ],
            });

            alert("Campaign created");
            router.push("/");
        } catch (error) {
            console.error("Transaction Error:", error);
            setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl rounded bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">Create Campaign</h1>

            {errorMessage && (
                <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">Target (ETH)</label>
                    <input
                        type="number"
                        name="target"
                        value={form.target}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        required
                        min="0"
                        step="any"
                    />
                </div>

                <div>
                    <label className="block font-medium">Deadline</label>
                    <input
                        type="date"
                        name="deadline"
                        value={form.deadline}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">Will be converted to Unix timestamp for contract</p>
                </div>

                <div>
                    <label className="block font-medium">Token Name</label>
                    <input
                        type="text"
                        name="tokenName"
                        value={form.tokenName}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Example: ACME Equity"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">Creator defines token identity for this campaign.</p>
                </div>

                <div>
                    <label className="block font-medium">Token Symbol</label>
                    <input
                        type="text"
                        name="tokenSymbol"
                        value={form.tokenSymbol}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Example: ACME"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">Short ticker shown in wallets and explorers.</p>
                </div>

                <div>
                    <label className="block font-medium">Token Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleTokenImageChange}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">This image will be pinned to IPFS and linked with the token metadata.</p>
                    {tokenImagePreview && (
                        <img
                            src={tokenImagePreview}
                            alt="Token preview"
                            className="mt-3 h-24 w-24 rounded object-cover"
                        />
                    )}
                </div>

                <div>
                    <label className="block font-medium">Token Rate (per 0.01 ETH)</label>
                    <input
                        type="number"
                        name="tokensPerPointZeroOneEth"
                        value={form.tokensPerPointZeroOneEth}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Example: 1"
                        required
                        min="1"
                        step="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Example: 1 means 0.01 ETH mints 1 token.</p>
                </div>

                <div>
                    <label className="block font-medium">Campaign Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">The file will be uploaded to Pinata IPFS and its CID will be saved on-chain.</p>
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Selected preview"
                            className="mt-3 h-40 w-full rounded object-cover"
                        />
                    )}
                </div>

                <div>
                    <label className="block font-medium">Milestones</label>
                    {form.milestoneTitles.map((title, idx) => (
                        <div key={idx} className="mb-2 flex gap-2">
                            <input
                                type="text"
                                placeholder={`Milestone Title #${idx + 1}`}
                                value={title}
                                onChange={(e) => handleMilestoneChange(idx, "milestoneTitles", e.target.value)}
                                className="flex-1 rounded border px-3 py-2"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount (ETH)"
                                value={form.milestoneAmounts[idx]}
                                onChange={(e) => handleMilestoneChange(idx, "milestoneAmounts", e.target.value)}
                                className="w-32 rounded border px-3 py-2"
                                required
                                min="0"
                                step="any"
                            />
                            {form.milestoneTitles.length > 1 && (
                                <button type="button" onClick={() => removeMilestone(idx)} className="text-red-500">
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addMilestone} className="mt-2 text-blue-500">+ Add Milestone</button>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded bg-blue-600 px-6 py-2 font-semibold text-white disabled:opacity-60"
                >
                    {isSubmitting ? "Creating..." : "Create Campaign"}
                </button>
            </form>
        </div>
    );
}