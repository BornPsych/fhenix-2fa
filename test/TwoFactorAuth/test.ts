import { createFheInstance } from "../../utils/instance";
import type { Signers } from "../types";
import { shouldBehaveLikeTwoFactorAuth } from "./behavior";
import { deployTwoFactorAuthFixture, getTokensFromFaucet } from "./fixture";
import hre from "hardhat";

describe("TwoFactorAuth Unit Tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    // Get tokens from faucet if we're on localfhenix and don't have a balance
    await getTokensFromFaucet();
    // Deploy test contract
    const { twoFactorAuth, address } = await deployTwoFactorAuthFixture();
    this.twoFactorAuth = twoFactorAuth;

    // Initiate fhenixjs
    this.instance = await createFheInstance(hre, address);

    // Set admin account/signer
    const signers = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.secondary = signers[1];
  });

  describe("TwoFactorAuth", function () {
    shouldBehaveLikeTwoFactorAuth();
  });
});
