export const contractAddress = "0x0034191DDA43E3104f8BDc54a1cfa206b1184F2c";

export const contractABI = [{
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "campaigns", "outputs": [{ "internalType": "address payable", "name": "owner", "type": "address" },
    { "internalType": "string", "name": "title", "type": "string" },
    { "internalType": "string", "name": "description", "type": "string" },
    { "internalType": "uint256", "name": "target", "type": "uint256" },
    { "internalType": "uint256", "name": "deadline", "type": "uint256" },
    { "internalType": "uint256", "name": "amountCollected", "type": "uint256" },
    { "internalType": "string", "name": "image", "type": "string" },
    { "internalType": "bool", "name": "cancelled", "type": "bool" }],
    "stateMutability": "view", "type": "function"
},

{
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "cancelCampaign", "outputs": [], "stateMutability": "nonpayable", "type": "function"
},

{
    "inputs": [{ "internalType": "string", "name": "_title", "type": "string" },
    { "internalType": "string", "name": "_description", "type": "string" },
    { "internalType": "uint256", "name": "_target", "type": "uint256" },
    { "internalType": "uint256", "name": "_deadline", "type": "uint256" },
    { "internalType": "string", "name": "_image", "type": "string" },
    { "internalType": "string[]", "name": "_milestoneTitles", "type": "string[]" },
    { "internalType": "uint256[]", "name": "_milestoneAmounts", "type": "uint256[]" }],
    "name": "createCampaign", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable", "type": "function"
},

{
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "donateToCampaign", "outputs": [], "stateMutability": "payable", "type": "function"
},


{
    "inputs": [], "name": "getCampaigns", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view", "type": "function"
},

{
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getDonators", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" },
    { "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view", "type": "function"
},

{
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getMilestones", "outputs": [{
        "components": [{ "internalType": "string", "name": "title", "type": "string" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "uint256", "name": "voteWeight", "type": "uint256" },
        { "internalType": "bool", "name": "released", "type": "bool" }],
        "internalType": "struct Crowdfunding.Milestone[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
},

{ "inputs": [], "name": "numberOfCampaigns", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
{
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "refund", "outputs": [], "stateMutability": "nonpayable", "type": "function"
},

{ "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }], "name": "releaseMilestone", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }], "name": "voteMilestone", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]