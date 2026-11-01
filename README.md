# RadiantFund

RadiantFund is a tokenized, on-chain crowdfunding platform built with Next.js, Wagmi, Hardhat, and Solidity. Campaign creators define a fundraising target, deadline, token economics, and milestone budget. Supporters contribute ETH and automatically receive campaign-specific ERC-20-style tokens.

The application currently targets the **Ethereum Sepolia test network**.

## Contents

- [How it works](#how-it-works)
- [Features](#features)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Installation](#installation)
- [Smart contract workflow](#smart-contract-workflow)
- [Running the application](#running-the-application)
- [Smart contract API](#smart-contract-api)
- [Token model](#token-model)
- [IPFS image uploads](#ipfs-image-uploads)
- [Development commands](#development-commands)
- [Important behavior and limitations](#important-behavior-and-limitations)
- [Security notes](#security-notes)

## How it works

1. A creator connects a browser wallet and opens the campaign creation form.
2. The creator enters campaign details, target amount, deadline, token metadata, token reward rate, and milestones.
3. Campaign and token images are uploaded to Pinata/IPFS.
4. `createCampaignWithToken` deploys a new `CampaignToken` contract and registers the campaign in `CrowdfundingTokenized`.
5. A supporter sends ETH through `donateToCampaign`.
6. The crowdfunding contract records the contribution and mints campaign tokens to the supporter.
7. Investors vote on milestones using voting weight equal to their contribution.
8. Once a milestone has more than 50% of the raised ETH as voting weight, the creator can release its ETH allocation.
9. If the creator cancels a campaign, each contributor can claim a one-time refund.

## Features

### Campaign discovery

- Reads campaign IDs and campaign data directly from the deployed contract.
- Displays active campaigns in a responsive project grid.
- Shows campaign title, description, image, target, amount raised, funding progress, and time remaining.
- Links each campaign to a dedicated detail page at `/campaign/[id]`.
- Excludes cancelled campaigns from the active campaign grid.

### Wallet-based interactions

- Connects to an injected browser wallet such as MetaMask.
- Uses Wagmi and Viem for contract reads, writes, and transaction receipts.
- Supports Sepolia through the configured injected connector and RPC transport.
- Allows creators and investors to perform transactions from their connected public wallet.

### Tokenized campaigns

- Creates one campaign token per campaign with a creator-supplied name and symbol.
- Uses 18 decimals, matching the token implementation.
- Mints tokens automatically when ETH is donated.
- Lets creators configure the number of token units minted per ETH.
- Displays token symbol, token image, token contract address, and estimated investor earnings.

### Milestone-based funding

- Requires at least one milestone for every campaign.
- Stores a title and ETH allocation for each milestone.
- Prevents the total milestone allocation from exceeding the campaign target.
- Allows contributors to vote once per milestone.
- Weights each investor's vote by that investor's total contribution.
- Requires more than 50% of the campaign's total raised amount to approve a milestone before release.
- Allows only the campaign creator to release an approved milestone.

### Contributions, cancellation, and refunds

- Accepts ETH contributions of at least `0.01 ETH`.
- Rejects contributions after the campaign deadline.
- Records contributor addresses and individual donation amounts on-chain.
- Allows only the campaign creator to cancel a campaign.
- Allows each contributor to withdraw their total recorded contribution once after cancellation.
- Protects ETH transfer operations with OpenZeppelin's `ReentrancyGuard`.

### Transparency and analytics

- Shows campaign contributors and contribution amounts.
- Provides a global ETH donation leaderboard aggregated across all campaigns.
- Highlights the connected wallet's leaderboard rank when applicable.
- Shows connected-wallet token earnings across campaigns.
- Provides an address lookup for estimated token earnings on a campaign detail page.
- Reads campaign data, milestones, contributors, and earnings from public contract view functions.

### Decentralized media

- Uploads campaign and token images through a server-side Pinata API route.
- Stores returned IPFS CIDs in the campaign contract.
- Resolves CIDs through the configured Pinata gateway or a custom IPFS gateway.
- Validates that uploads are non-empty image files.

## Project structure

```text
Decentralized-Crowdfunding/
├── contracts/
│   ├── CampaignToken.sol             # Campaign-specific ERC-20-style token
│   └── CrowdfundingTokenized.sol     # Campaign, funding, voting, and refund logic
├── scripts/
│   └── deploy-tokenized-flow.js      # Sepolia deployment script
├── src/
│   ├── app/
│   │   ├── api/pinata/route.ts       # Pinata image upload endpoint
│   │   ├── campaign/[id]/page.jsx    # Campaign details and actions
│   │   ├── createcampaign/page.jsx   # Campaign creation form
│   │   ├── layout.tsx                # Wagmi and React Query providers
│   │   └── page.tsx                  # Home page composition
│   ├── components/                   # Navigation, campaign grid, analytics, and sections
│   ├── lib/
│   │   ├── contract.js               # Contract address and frontend ABI
│   │   ├── ipfs.ts                   # IPFS gateway URL helper
│   │   └── wagmiConfig.js            # Sepolia Wagmi configuration
│   └── types/
│       └── ethereum.d.ts             # Browser wallet type declarations
├── hardhat.config.js
├── next.config.ts
└── package.json
```

## Technology stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Wallet and chain access:** Wagmi 3, Viem 2, Ethers 6
- **Blockchain development:** Hardhat 2, Solidity `0.8.24`
- **Smart contract security utility:** OpenZeppelin Contracts 5
- **Data fetching:** TanStack React Query
- **Media storage:** Pinata/IPFS
- **UI:** Framer Motion, Lucide React, Radix UI utilities

## Prerequisites

- Node.js and npm
- A browser wallet with Sepolia ETH, such as MetaMask
- A Sepolia RPC endpoint
- A deployer private key funded with Sepolia ETH for contract deployment
- Pinata credentials if campaign images will be uploaded

> Never use a production wallet private key for local development or testnet deployment.

## Configuration

Create `.env` for Hardhat deployment:

```dotenv
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
PRIVATE_KEY=0xyour-deployer-private-key
```

Create `.env.local` for the Next.js frontend:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourCrowdfundingTokenizedAddress
NEXT_PUBLIC_RPC_URL=https://your-sepolia-rpc-url

# Use either the JWT option or both API key options.
PINATA_JWT=your-pinata-jwt
# PINATA_API_KEY=your-pinata-api-key
# PINATA_SECRET_API_KEY=your-pinata-secret-api-key

# Optional; defaults to the Pinata gateway.
# NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### Environment variable reference

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `SEPOLIA_RPC_URL` | For deployment | Hardhat | Sepolia JSON-RPC endpoint. |
| `PRIVATE_KEY` | For deployment | Hardhat | Deployer account private key. |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | Next.js | Deployed `CrowdfundingTokenized` address. |
| `NEXT_PUBLIC_RPC_URL` | Recommended | Next.js and fallback Hardhat config | Sepolia JSON-RPC endpoint used by Wagmi. |
| `PINATA_JWT` | One Pinata option | Next.js API | Pinata JWT with file-pinning permission. |
| `PINATA_API_KEY` | Alternative Pinata option | Next.js API | Pinata API key. |
| `PINATA_SECRET_API_KEY` | Alternative Pinata option | Next.js API | Pinata secret key paired with `PINATA_API_KEY`. |
| `NEXT_PUBLIC_IPFS_GATEWAY` | No | Next.js | Gateway prefix used to render stored CIDs. |

Do not expose `PRIVATE_KEY`, `PINATA_JWT`, or Pinata API keys with a `NEXT_PUBLIC_` prefix.

## Installation

```bash
npm install
```

Compile the Solidity contracts:

```bash
npm run hh:compile
```

## Smart contract workflow

Deploy the crowdfunding contract to Sepolia:

```bash
npm run hh:deploy:flow
```

The deployment script:

1. Loads the deployer account from `PRIVATE_KEY`.
2. Deploys `CrowdfundingTokenized`.
3. Prints the deployed address.
4. Leaves campaign-token deployment to `createCampaignWithToken`, so a new token is created for each campaign.

After deployment, set the printed address as `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`, then restart the Next.js server.

## Running the application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available application surfaces:

- `/` - campaign discovery, token earnings, donation leaderboard, mechanics, FAQ, and feedback sections
- `/createcampaign` - create a tokenized campaign
- `/campaign/[id]` - view a campaign, donate, vote, cancel, refund, and inspect milestones
- `/api/pinata` - server-side image upload endpoint

## Smart contract API

### Campaign creation

- `createCampaign(...)` registers a campaign using an existing `CampaignToken`. The token owner must already be the crowdfunding contract.
- `createCampaignWithToken(...)` deploys a new `CampaignToken` owned by the crowdfunding contract and registers the campaign.

Campaign creation validates:

- Target is greater than zero.
- Deadline is in the future.
- Token name and symbol are present for the auto-deployment path.
- Token address is valid and owned by the crowdfunding contract.
- Token image and token rate are present.
- Milestone title and amount arrays have equal, non-zero length.
- Every milestone amount is greater than zero.
- Total milestone allocation does not exceed the target.

### Funding and lifecycle

- `donateToCampaign(uint256 campaignId)` - payable contribution; minimum `0.01 ETH`, before the deadline.
- `cancelCampaign(uint256 campaignId)` - creator-only cancellation.
- `refund(uint256 campaignId)` - one-time refund for a contributor after cancellation.

### Milestones

- `voteMilestone(uint256 campaignId, uint256 milestoneId)` - one vote per investor per milestone.
- `releaseMilestone(uint256 campaignId, uint256 milestoneId)` - creator-only release after the milestone receives more than 50% approval by contribution weight.

### Read functions

- `getCampaigns()` - returns all campaign IDs.
- `getCampaign(uint256 campaignId)` - returns campaign metadata and state.
- `getDonators(uint256 campaignId)` - returns contributor addresses and contribution amounts.
- `getMilestones(uint256 campaignId)` - returns milestone title, amount, vote weight, and release state.
- `getInvestorTokenEarnings(uint256 campaignId, address investor)` - calculates contribution multiplied by the campaign token rate.
- `numberOfCampaigns()` - returns the number of campaigns created.

## Token model

`CampaignToken` is a campaign-specific ERC-20-style contract with:

- 18 decimals
- `name`, `symbol`, and `totalSupply`
- `balanceOf` and `allowance`
- `transfer`, `approve`, and `transferFrom`
- Owner-controlled `mint`
- Owner transfer support

The crowdfunding contract is the token owner for tokens created through `createCampaignWithToken`. For a contribution:

```text
minted token units = contributed wei × tokensPerEth
```

Because token balances use 18 decimals, the frontend campaign form asks for a rate in **tokens per `0.01 ETH`** and converts it to the contract's **tokens per `1 ETH`** value by multiplying by 100.

## IPFS image uploads

The campaign form uploads two images before submitting the blockchain transaction:

1. Campaign image
2. Campaign token image

`POST /api/pinata` expects a multipart form field named `file`. It:

- Requires Pinata JWT credentials or an API key/secret pair.
- Rejects missing, empty, and non-image files.
- Returns the CID, an `ipfs://` URL, and a Pinata gateway URL.
- Stores the CID in the campaign transaction.

If Pinata returns missing-scope errors, create a Pinata key with file-pinning/write permission and update the environment configuration.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production Next.js build. |
| `npm run start` | Start the production server after building. |
| `npm run lint` | Run ESLint. |
| `npm run hh:compile` | Compile Solidity contracts and generate Hardhat artifacts. |
| `npm run hh:deploy:flow` | Deploy `CrowdfundingTokenized` to Sepolia. |

## Important behavior and limitations

- The configured chain is Sepolia only. The wallet, RPC endpoint, deployed contract, and frontend must all use the same network.
- The frontend requires `NEXT_PUBLIC_CONTRACT_ADDRESS`; reads and writes cannot work until it points to a deployed contract.
- The current UI creates campaigns with `createCampaignWithToken`. The lower-level `createCampaign` function is available for integrations using a pre-deployed compatible token.
- Campaign images and token images are required by the current creation form.
- Contributions are not capped at the target amount by the contract; a campaign can receive more than its target.
- A campaign's `amountCollected` is not reduced when a contributor claims a refund.
- Cancellation is permanent. The contract does not allow donations, milestone votes, milestone releases, or repeated refunds after cancellation.
- The contract does not automatically close a campaign when its deadline passes and does not automatically release funds.
- Milestone release sends ETH from the crowdfunding contract balance to the campaign creator. The contract does not enforce milestone ordering or require the target to be reached.
- The leaderboard and earnings views aggregate on-chain data in the browser and may become slower as the number of campaigns and donations grows.
- The wallet button currently manages a local connection display; transaction authorization and contract state are handled by Wagmi and the injected wallet.
- This project has not been presented as a production-audited financial protocol. Use testnet funds until the contracts receive an independent security review.

## Security notes

- Keep all private keys and Pinata secrets in environment files excluded from version control.
- Verify the deployed contract address before using the application.
- Review every wallet transaction before signing.
- Treat campaign tokens as application-specific reward tokens, not as guaranteed financial assets.
- Audit and test the contracts before deploying to a production network.

## License

The Solidity contracts declare the MIT license. Add a repository-level license file if this project is distributed publicly under that license.
