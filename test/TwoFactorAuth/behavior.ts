import { expect } from "chai";
import hre from "hardhat";

export function shouldBehaveLikeTwoFactorAuth(): void {
  let adminPermit: any;
  let tempPassword: any;
  let serviceSigner: any;

  // Test case: Register a user with a secondary signer
  it("should register a user with a secondary signer", async function () {
    const { fhenixjs } = hre;

    // Generate a permit for the admin
    adminPermit = await fhenixjs.generatePermit(
      await this.twoFactorAuth.getAddress(),
      undefined,
      this.signers.admin,
    );

    // Register the user with the secondary s igner
    const tx = await this.twoFactorAuth
      .connect(this.signers.admin)
      .register(adminPermit, this.signers.secondary.address);
    await tx.wait();

    // Verify the registration
    const authData = await this.twoFactorAuth.authData(
      this.signers.admin.address,
    );
    console.log(" should register a user with a secondary signer", authData);
    expect(authData.secondarySigner).to.equal(this.signers.secondary.address);
    expect(authData.userPublicKey).to.equal(adminPermit.publicKey);
  });

  // Test case: Request a login
  it("should request a login", async function () {
    const tx = await this.twoFactorAuth
      .connect(this.signers.admin)
      .requestLogin();
    await tx.wait();

    // Verify the login request status
    const authData = await this.twoFactorAuth.authData(
      this.signers.admin.address,
    );
    console.log(" approve a should request a login", authData);
    expect(authData.isApproved).to.be.false;
  });

  // Test case: Approve a login request
  it("should approve a login request", async function () {
    const tempPassword = await hre.fhenixjs.encrypt_uint256(
      BigInt(Math.floor(Math.random() * 2 ** 256)),
    );

    const tx = await this.twoFactorAuth
      .connect(this.signers.secondary)
      .approveLogin(this.signers.admin.address, tempPassword);
    await tx.wait();

    // Verify the approval status
    const authData = await this.twoFactorAuth.authData(
      this.signers.admin.address,
    );
    console.log(" approve a login request authData", authData);
    expect(authData.isApproved).to.be.true;
  });

  // Test case: Retrieve the encrypted password
  it("should retrieve the encrypted password", async function () {
    const encryptedPassword = await this.twoFactorAuth
      .connect(this.signers.admin)
      .getEncryptedPassword();
    expect(encryptedPassword).to.not.be.empty;
    console.log("hre.fhenixjs", hre.fhenixjs);

    // Unseal the temporary password
    tempPassword = hre.fhenixjs.unseal(
      await this.twoFactorAuth.getAddress(),
      encryptedPassword,
    );
  });

  // Test case: Add a service to the whitelist
  it("should add a service to the whitelist", async function () {
    serviceSigner = (await hre.ethers.getSigners())[2]; // Get a third signer as a random service

    const tx = await this.twoFactorAuth
      .connect(this.signers.admin)
      .addServiceToWhitelist(adminPermit, serviceSigner.address);
    await tx.wait();

    console.log("tx", tx, "serviceSigner", serviceSigner, "serviceSigner.address", serviceSigner.address, "adminPermit", adminPermit)

    // Verify that the service has been whitelisted
    const whitelistedServices = await this.twoFactorAuth.whitelistedServices(
      serviceSigner.address,
    );
    expect(whitelistedServices).to.be.true;
  });

  // Test case: Verify the temporary password
  it("should verify the temporary password", async function () {
    const servicePermit = await hre.fhenixjs.generatePermit(
      await this.twoFactorAuth.getAddress(),
      undefined,
      serviceSigner,
    );

    // Encrypt the temporary password for verification
    const encryptedTempPassword = await hre.fhenixjs.encrypt_uint256(
      tempPassword,
    );

    // Verify the temporary password using the whitelisted service
    const tx = await this.twoFactorAuth
      .connect(serviceSigner)
      .verifyTempPassword(
        servicePermit,
        serviceSigner.address,
        this.signers.admin.address,
        encryptedTempPassword,
      );
    const receipt = await tx.wait();

    expect(receipt.status).to.be.true;
  });
}
