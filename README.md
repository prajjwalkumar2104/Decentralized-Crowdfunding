# Decentralized Crowdfunding (Tokenized)

This app supports tokenized crowdfunding where each campaign is tied to an ERC20 token and investors receive minted tokens when they invest ETH.

## Tokenized Flow

1. Deploy crowdfunding contract (`CrowdfundingTokenized`)
2. Creator opens create campaign form
3. Creator sets token name + symbol
4. Crowdfunding deploys a campaign token on-chain
5. Campaign is created with that token address
6. User invests ETH
7. Crowdfunding contract mints tokens to investor

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file for deployment:

```bash
SEPOLIA_RPC_URL=https://...
PRIVATE_KEY=0x...
```

Create `.env.local` for frontend:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## Deploy Contracts

Compile:

```bash
npm run hh:compile
```

Deploy tokenized flow on Sepolia:

```bash
npm run hh:deploy:flow
```

This script deploys only the crowdfunding contract. Campaign tokens are generated per campaign by creator-provided token metadata.

## Run Frontend

```bash
npm run dev
```

Open http://localhost:3000.

## Notes

- On create campaign page, creator provides token name and symbol. No pre-deployed token address is required.
- Token minting happens during `donateToCampaign`.
- Investor list and campaign details are visible per campaign for transparency.
