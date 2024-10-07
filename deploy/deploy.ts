import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import chalk from "chalk";
import type { TwoFactorAuth } from "../types";
const hre = require("hardhat");

const func: DeployFunction = async function () {
  const { fhenixjs, ethers } = hre;
  const { deploy } = hre.deployments;
  const [signer] = await ethers.getSigners();

  if ((await ethers.provider.getBalance(signer.address)).toString() === "0") {
    if (hre.network.name === "localfhenix") {
      await fhenixjs.getFunds(signer.address);
    } else {
      console.log(
        chalk.red("Please fund your account with testnet FHE from https://faucet.fhenix.zone"));
      return;
    }
  }

  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  const contract = await deploy("TwoFactorAuth", {
    from: contractOwner.address,
    log: true,
    args: [contractOwner.address],
  });
  const twoFactorAuth = (await ethers.getContractAt(
    "TwoFactorAuth",
    contract.address,
  )) as unknown as TwoFactorAuth;

  console.log("twoFactorAuth address", await twoFactorAuth.getAddress());

};

export default func;
func.id = "DeployFunction";
func.tags = ["TwoFactorAuth"];
