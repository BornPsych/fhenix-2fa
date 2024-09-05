import { Contract } from "ethers";
import type { TwoFactorAuth } from "../../types"; // Adjust the import based on your contract's type
import hre, { ethers } from "hardhat";

/**
 * Deploys the TwoFactorAuth contract and returns the instance and its address.
 */
export async function deployTwoFactorAuthFixture(): Promise<{
  twoFactorAuth: any;
  address: string;
}> {
  const { deploy } = hre.deployments;

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

  return { twoFactorAuth, address: contract.address };
}

/**
 * Retrieves tokens from the faucet if on the localfhenix network.
 */
export async function getTokensFromFaucet() {
  if (hre.network.name === "localfhenix") {
    const signers = await hre.ethers.getSigners();

    const balance0 = await hre.ethers.provider.getBalance(signers[0].address);
    const balance1 = await hre.ethers.provider.getBalance(signers[1].address);
    const balance2 = await hre.ethers.provider.getBalance(signers[2].address);

    if (balance0.toString() === "0") {
      await hre.fhenixjs.getFunds(signers[0].address);

      const newBalance0 = await hre.ethers.provider.getBalance(
        signers[0].address,
      );

      console.log("Balance of signer 0", newBalance0);
    }

    if (balance1.toString() === "0") {
      await hre.fhenixjs.getFunds(signers[1].address);

      const newBalance1 = await hre.ethers.provider.getBalance(
        signers[1].address,
      );

      console.log("Balance of signer 1", newBalance1);
    }

    if (balance2.toString() === "0") {
      await hre.fhenixjs.getFunds(signers[2].address);

      const newBalance2 = await hre.ethers.provider.getBalance(
        signers[2].address,
      );

      console.log("Balance of signer 2", newBalance2);
    }
  }
}
