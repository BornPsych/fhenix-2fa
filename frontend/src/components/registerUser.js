import React, { useState } from "react";
import { ethers } from "ethers";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock functions to simulate blockchain interactions
const mockGeneratePermit = async (address, _, signer) => {
  return {
    publicKey: ethers.Wallet.createRandom().publicKey,
    // Other permit details would go here
  };
};

const mockRegister = async (permit, secondaryAddress) => {
  // Simulate transaction
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    wait: async () => {},
  };
};

const mockGetAuthData = async (address) => {
  return {
    secondarySigner: ethers.Wallet.createRandom().address,
    userPublicKey: ethers.Wallet.createRandom().publicKey,
  };
};

const TwoFactorAuthRegistration = () => {
  const [adminAddress, setAdminAddress] = useState("");
  const [secondaryAddress, setSecondaryAddress] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [authData, setAuthData] = useState(null);

  const handleRegister = async () => {
    try {
      setRegistrationStatus("Generating admin permit...");
      const adminPermit = await mockGeneratePermit(adminAddress, undefined, {});

      setRegistrationStatus("Registering user...");
      const tx = await mockRegister(adminPermit, secondaryAddress);
      await tx.wait();

      setRegistrationStatus("Verifying registration...");
      const newAuthData = await mockGetAuthData(adminAddress);
      setAuthData(newAuthData);

      setRegistrationStatus("Registration successful!");
    } catch (error) {
      setRegistrationStatus(`Registration failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">Two-Factor Auth Registration</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Admin Address"
            value={adminAddress}
            onChange={(e) => setAdminAddress(e.target.value)}
          />
          <Input
            placeholder="Secondary Signer Address"
            value={secondaryAddress}
            onChange={(e) => setSecondaryAddress(e.target.value)}
          />
          <Button onClick={handleRegister} className="w-full">
            Register
          </Button>
          {registrationStatus && (
            <Alert>
              <AlertDescription>{registrationStatus}</AlertDescription>
            </Alert>
          )}
          {authData && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Registration Data:</h3>
              <p>Secondary Signer: {authData.secondarySigner}</p>
              <p>User Public Key: {authData.userPublicKey}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuthRegistration;
