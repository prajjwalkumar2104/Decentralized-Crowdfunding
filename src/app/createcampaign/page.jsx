"use client"
import { parseEther } from "ethers";
import React, { useState } from "react";
import { contractAddress, contractABI } from "@/lib/contract";
import { useWriteContract } from "wagmi";
import { useRouter } from 'next/navigation';

export default function Campaign() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        target: 0,
        deadline: 0,
        image: "",
        milestoneTitles: [""],
        milestoneAmounts: [""]
    });

    const router = useRouter();

const { writeContract } = useWriteContract();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleMilestoneChange = (idx, field, value) => {
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
            milestoneAmounts: [...prev.milestoneAmounts, ""]
        }));
    };

    const removeMilestone = (idx) => {
        setForm((prev) => {
            const titles = prev.milestoneTitles.filter((_, i) => i !== idx);
            const amounts = prev.milestoneAmounts.filter((_, i) => i !== idx);
            return { ...prev, milestoneTitles: titles, milestoneAmounts: amounts };
        });
    };
const alertmsg =()=>{
     e.preventDefault();
    alert("Campaing created")
    router.push('/');
    
}
    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
       
        const deadlineUnix = BigInt(
            Math.floor(new Date(form.deadline).getTime() / 1000)
        );

       
        const ethtarget = parseEther(form.target.toString());

        
        const milestoneAmountsWei = form.milestoneAmounts.map((amt) =>
            parseEther(amt.toString())
        );

        writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "createCampaign",
            args: [
                form.title,
                form.description,
                ethtarget,
                deadlineUnix,
                form.image,
                form.milestoneTitles,
                milestoneAmountsWei,
            ],
        });

        console.log(data)
          alert("Campaing created")
    router.push('/');

    } catch (error) {
        console.error("Transaction Error:", error);
    }
};

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Create Campaign</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">Target (ETH)</label>
                    <input
                        type="number"
                        name="target"
                        value={(form.target)}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
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
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Will be converted to Unix timestamp for contract</p>
                </div>
                <div>
                    <label className="block font-medium">Image URL</label>
                    <input
                        type="url"
                        name="image"
                        value={form.image}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium">Milestones</label>
                    {form.milestoneTitles.map((title, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder={`Milestone Title #${idx + 1}`}
                                value={title}
                                onChange={(e) => handleMilestoneChange(idx, "milestoneTitles", e.target.value)}
                                className="flex-1 border rounded px-3 py-2"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount (ETH)"
                                value={form.milestoneAmounts[idx]}
                                onChange={(e) => handleMilestoneChange(idx, "milestoneAmounts", e.target.value)}
                                className="w-32 border rounded px-3 py-2"
                                required
                                min="0"
                                step="any"
                            />
                            {form.milestoneTitles.length > 1 && (
                                <button type="button" onClick={() => removeMilestone(idx)} className="text-red-500">Remove</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addMilestone} className="text-blue-500 mt-2">+ Add Milestone</button>
                </div>
                <button type="submit" onClick={alertmsg}  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold">Create Campaign</button>
            </form>
        </div>
    );
}