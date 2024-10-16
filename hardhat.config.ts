// Plugins
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import { ethers } from "ethers";
import "fhenix-hardhat-docker";
import "fhenix-hardhat-plugin";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

// DOTENV_CONFIG_PATH is used to specify the path to the .env file for example in the CI
const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

const TESTNET_CHAIN_ID = 8008135;
const TESTNET_RPC_URL = "https://api.helium.fhenix.zone";
const LOCAL_CHAIN_ID = 412346
const LOCAL_RPC_URL = "http://localhost:42069"

// Generates 10 random wallet addresses
const generateRandomPrivateKey = () => {
  const wallet = ethers.Wallet.createRandom();
  return wallet.privateKey;
};
const randomPrivateKeys = Array(10).fill(null).map(() => generateRandomPrivateKey());


const testnetConfig = {
  chainId: TESTNET_CHAIN_ID,
  url: TESTNET_RPC_URL,
  accounts: randomPrivateKeys
}

const localConfig = {
  chainId: LOCAL_CHAIN_ID,
  url: LOCAL_RPC_URL,
  accounts: [process.env.WALLET_PRIMARY_PRIVATE_KEY as string, ...randomPrivateKeys],
}

const config: HardhatUserConfig = {
  solidity: "0.8.25",
  defaultNetwork: "localfhenix",
  networks: {
    testnet: testnetConfig,
    localfhenix: localConfig
  },
  paths: {
    deployments: resolve(__dirname, "./frontend/src/deployment"),
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;