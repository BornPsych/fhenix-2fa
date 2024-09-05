import type { FheInstance } from "../utils/instance";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

// Define the structure of the AuthData as it is used in the contract
export interface AuthData {
  lastRequestTime: number; // Timestamp of the last login request
  secondarySigner: string; // Address of the secondary signer
  isApproved: boolean; // Indicates if the login request is approved
  lastApprovalTime: number; // Timestamp of the last approval
  encryptedPassword: string; // Encrypted temporary password (as a string)
  userPublicKey: string; // Public key of the user for encryption
  passwordUsed: boolean; // Indicates if the temporary password has been used
  validUntil: number; // Timestamp until which the password is valid
}

// Define the Fixture type for the TwoFactorAuth contract
type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    twoFactorAuth: any;
    instance: FheInstance; // Instance of the FHE library
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>; // Load fixture function
    signers: Signers; // Signers for testing
  }
}

// Define the Signers interface
export interface Signers {
  admin: SignerWithAddress; // Admin signer
  secondary: SignerWithAddress; // Secondary signer
}
