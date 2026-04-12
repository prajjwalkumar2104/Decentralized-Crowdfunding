require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "";
const rawPrivateKey = process.env.PRIVATE_KEY || "";
const privateKey = rawPrivateKey && !rawPrivateKey.startsWith("0x") ? `0x${rawPrivateKey}` : rawPrivateKey;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: sepoliaRpcUrl,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
