const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    throw new Error(
      "No deployer account found. Set PRIVATE_KEY in .env or .env.local (test wallet only)."
    );
  }
  const [deployer] = signers;

  console.log("Deployer:", deployer.address);

  console.log("1) Deploying crowdfunding contract...");
  const CrowdfundingTokenized = await hre.ethers.getContractFactory("CrowdfundingTokenized");
  const crowdfunding = await CrowdfundingTokenized.deploy();
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("Crowdfunding deployed:", crowdfundingAddress);

  console.log("\n Flow complete:");
  console.log("- Crowdfunding:", crowdfundingAddress);
  console.log("\n Set NEXT_PUBLIC_CONTRACT_ADDRESS to the crowdfunding address in .env.local");
  console.log("Campaign creators will provide token name/symbol and tokens are deployed per campaign on-chain.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
