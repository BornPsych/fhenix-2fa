// Import helper to check for valid Ethereum addresses
import { BrowserProvider, Contract, isAddress } from 'ethers';
import { FhenixClient, getPermit } from 'fhenixjs';

import { toast } from '@/hooks/use-toast';
import { State } from '@/types/types';

import TwoFactorAuth from '../deployment/localfhenix/TwoFactorAuth.json';

// Wrap in try catch block
export const registerSecondarySigner = async (secondarySigner: string) => {
  const provider: any = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const twoFactorAuth = new Contract(
    TwoFactorAuth.address,
    TwoFactorAuth.abi,
    signer
  );

  // Check if provider is undefined
  if (provider === undefined) {
    toast({
      title: 'Please connect the wallet',
    });
    return;
  }

  if (!isAddress(secondarySigner)) {
    toast({
      title: 'Please enter a valid Ethereum address',
    });
    return;
  }

  // Initialize Fhenix client
  const client = new FhenixClient({ provider });

  // Generate permit using the Fhenix client
  const permit = await client.generatePermit(
    await twoFactorAuth.getAddress(),
    provider,
    signer
  );

  // Register the secondary signer with the generated permit
  try {
    const tx = await twoFactorAuth.register(permit, secondarySigner, {
      gasLimit: 30000000,
    });

    // Wait for the transaction to be mined
    await tx.wait();
  } catch {
    toast({
      title: 'Transaction Failed',
      description:
        'Please check if the Secondary signer is same as primary signer',
    });
  }

  // Retrieve authentication data for the selected address
  const authData = await twoFactorAuth.authData(signer.address);

  // Verify that the registration is completed
  if (authData.secondarySigner === secondarySigner) {
    toast({
      title: 'Secondary Signer Registered Successfully',
    });
  } else {
    toast({
      title: 'Signer Registration Unsuccessful',
      variant: 'destructive',
    });
  }
};

export const requestLogin = async (state: State) => {
  try {
    const provider: any = new BrowserProvider(window.ethereum);
    // Get the signer from the provider
    const signer = await provider.getSigner();
    // Initiate login request transaction
    try {
      const tx = await state.twoFactorAuth.connect(signer).requestLogin();
      // Wait for the transaction to be mined
      await tx.wait();
    } catch {
      toast({
        title: 'Login Request Failed',
        description: 'Try Reregistering the user',
      });
    }
    // Retrieve authentication data after login request
    const authData = await state.twoFactorAuth.authData(state.selectedAddress);
    // Check if the login request has been approved
    if (authData.isApproved === false) {
      toast({
        title: 'Login request is pending for approval.',
      });
    } else {
      toast({
        title: 'Login request approved already.',
      });
    }
  } catch (error) {
    toast({
      title: 'Failed to request login.',
    });
  }
};

export const approveLogin = async (primarySigner: string) => {
  const provider: any = new BrowserProvider(window.ethereum);

  if (!isAddress(primarySigner)) {
    toast({
      title: 'Please enter a valid Ethereum address',
    });
    return;
  }

  const signer = await provider.getSigner();
  const twoFactorAuth = new Contract(
    TwoFactorAuth.address,
    TwoFactorAuth.abi,
    signer
  );

  try {
    const client = new FhenixClient({ provider });

    const tempPassword = await client.encrypt_uint256(
      BigInt(Math.floor(Math.random() * 2 ** 256))
    );

    const tx = await twoFactorAuth.approveLogin(primarySigner, tempPassword, {
      gasLimit: 30000000,
    });

    await tx.wait();

    // Verify the approval status
    const authData = await twoFactorAuth.authData(primarySigner);
    const isApproved = authData.isApproved;

    if (isApproved) {
      toast({
        title: 'Login request has been approved',
      });
    } else {
      toast({
        title: 'Login request failed to approve',
      });
    }
  } catch (error) {
    toast({
      title: 'Login request failed to approve',
    });
  }
};

export const getEncryptedPassword = async (state: State) => {
  const provider: any = new BrowserProvider(window.ethereum);
  // Check if provider is undefined
  if (provider === undefined) {
    toast({
      title: 'Please connect the wallet',
    });
    return;
  }

  try {
    const signer = await provider.getSigner();

    // Get the contract address
    const contractAddress = await state.twoFactorAuth.getAddress();

    // Get the encrypted password
    const encryptedPassword = await state.twoFactorAuth
      .connect(signer)
      .getEncryptedPassword({
        gasLimit: 30000000, // Adjust the gas limit as needed
      });

    const client = new FhenixClient({ provider });
    // Check if client is properly initialized
    if (!client || typeof client.unseal !== 'function') {
      throw new Error('FhenixClient is not properly initialized');
    }
    // Getting the permit to call unseal peroperly
    client.getPermit(await state.twoFactorAuth.getAddress(), signer.address);

    // Unseal the encrypted password
    const tempPassword = client.unseal(contractAddress, encryptedPassword);

    toast({
      title: 'Encrypted Password Retrieved Successfully',
    });

    return tempPassword;
  } catch (error) {
    toast({
      title: 'Error Retrieving Encrypted Password',
      description: 'Unknown error occurred',
      variant: 'destructive',
    });
  }
};

export const addServiceToWhitelist = async (state: State) => {
  // Check if provider is undefined
  if (state.provider === undefined) {
    toast({
      title: 'Please connect the wallet',
    });
    return;
  }

  // Validate Ethereum address for the service
  if (!isAddress(state.ServiceToWhitelist)) {
    toast({
      title: 'Please enter a valid Ethereum address for the service',
    });
    return;
  }

  try {
    const signer = await state.provider.getSigner();

    const permit = await getPermit(
      await state.twoFactorAuth.getAddress(),
      state.provider
    );

    // Add service to whitelist
    const tx = await state.twoFactorAuth.addServiceToWhitelist(
      permit,
      state.ServiceToWhitelist,
      {
        gasLimit: 30000000, // Adjust the gas limit as needed
      }
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Check updated whitelist status
    const updatedWhitelistStatus = await state.twoFactorAuth
      .connect(signer)
      .whitelistedServices(state.ServiceToWhitelist);

    // Verify that the service was added to the whitelist
    if (updatedWhitelistStatus) {
      toast({
        title: 'Service Added to Whitelist Successfully',
      });
    } else {
      toast({
        title: 'Failed to Add Service to Whitelist',
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Error Adding Service to Whitelist',
      description:
        error instanceof Error ? error.message : 'Unknown error occurred',
      variant: 'destructive',
    });
  }
};

export const verifyTempPassword = async (state: State) => {
  // Check if provider is undefined
  if (state.provider === undefined) {
    toast({
      title: 'Please connect the wallet',
    });
    return;
  }

  try {
    const serviceSigner = await state.provider.getSigner();
    const serviceAddress = await serviceSigner.getAddress();
    const provider = state.provider;
    const client = new FhenixClient({ provider });

    // Generate service permit
    const servicePermit = client.getPermit(
      await state.twoFactorAuth.getAddress(),
      provider
    );

    // Encrypt the temporary password for verification
    const encryptedTempPassword = await client.encrypt_uint256(
      BigInt(state.tempPassword as string)
    );

    // Verify the temporary password using the whitelisted service
    const tx = await state.twoFactorAuth
      .connect(serviceSigner)
      .verifyTempPassword(
        servicePermit,
        serviceAddress,
        state.verifyUserAddress,
        encryptedTempPassword,
        {
          gasLimit: 30000000, // Adjust the gas limit as needed
        }
      );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    if (receipt.status) {
      toast({
        title: 'Temporary Password Verified Successfully',
      });
    } else {
      toast({
        title: 'Failed to Verify Temporary Password',
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Error Verifying Temporary Password',
      description:
        error instanceof Error ? error.message : 'Unknown error occurred',
      variant: 'destructive',
    });
  }
};
