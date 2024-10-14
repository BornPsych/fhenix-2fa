import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, isAddress } from "ethers";
import TwoFactorAuth from "../deployment/localfhenix/TwoFactorAuth.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { generatePermit, FhenixClient } from "fhenixjs";

// EncryptionTypes, FhenixClient, GenerateSealingKey, SealingKey, generatePermit, getAllPermits, getPermit, getPermitFromLocalstorage, removePermit
// This is the id used for fhenix-2fa
const HARDHAT_NETWORK_ID = "412346";

export const Dapp = () => {
  const [state, setState] = useState({
    selectedAddress: undefined,
    provider: undefined,
    networkError: undefined,
    secondarySigner: undefined,
    twoFactorAuth: undefined,
    client: undefined,
    permit: undefined,
  });

  const connectWallet = async () => {
    try {
      const [selectedAddress] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await addCustomChain(window.ethereum);
      console.log("hello man");
      checkNetwork();
      console.log("himan");
      initialize(selectedAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const initialize = useCallback((userAddress) => {
    setState((prevState) => ({ ...prevState, selectedAddress: userAddress }));
    initializeEthers();
  }, []);

  const registerSecondarySigner = async () => {
    if (isAddress(state.secondarySigner)) {
      console.log("The Ethereum address is valid.");
    } else {
      console.log("The Ethereum address is NOT valid.");
      return;
    }

    const signer = await state.provider.getSigner();
    const provider = state.provider;
    const client = new FhenixClient({ provider });
    const permit = await client.generatePermit(
      await state.twoFactorAuth.getAddress(),
      state.provider,
      signer,
    );
    setState((prevState) => ({
      ...prevState,
      client: client,
    }));
    setState((prevState) => ({
      ...prevState,
      permit: permit,
    }));
    console.log("permit generated", permit, "signer", signer, "client", client);
    const tx = await state.twoFactorAuth
      .connect(signer)
      .register(permit, state.secondarySigner, {
        gasLimit: 30000000,
      });
    await tx.wait();
    console.log(" registerSecondarySigner tx", tx);

    const authData = await state.twoFactorAuth.authData(state.selectedAddress);
    console.log("auth data registerSecondarySigner", authData);
    if (authData.secondarySigner === state.secondarySigner) {
      console.log("Registration is completed");
    }
  };

  const requestLogin = async () => {
    const signer = await state.provider.getSigner();

    const tx = await state.twoFactorAuth.connect(signer).requestLogin();
    await tx.wait();
    console.log("requestLogin tx", tx);

    const authData = await state.twoFactorAuth.authData(state.selectedAddress);
    if (authData.isApproved === false) {
      console.log("request has not been approved yet", authData);
    }
  };

  async function addCustomChain(provider) {
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x64ABA", // This is hex for 412346
            chainName: "Fhenix Local Network",
            nativeCurrency: {
              name: "FHE",
              symbol: "FHE",
              decimals: 18,
            },
            rpcUrls: ["http://localhost:42069"],
          },
        ],
      });
      console.log("Custom chain added successfully");
    } catch (error) {
      console.error("Failed to add custom chain:", error);
    }
  }

  async function switchToCustomChain(provider) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x64ABA" }],
      });
      console.log("Switched to custom chain successfully");
    } catch (error) {
      console.error("Failed to switch to custom chain:", error);
    }
  }

  const approveLogin = async () => {
    try {
      const provider = state.provider;
      const client = new FhenixClient({ provider });
      const signer = await state.provider.getSigner();
      console.log("provider", provider, "client", client, "signer", signer);
      const tempPassword = await client.encrypt_uint256(
        // eslint-disable-next-line no-undef
        BigInt(Math.floor(Math.random() * 2 ** 256)),
      );
      console.log("tempPassword", tempPassword, signer);
      const tx = await state.twoFactorAuth
        .connect(signer)
        .approveLogin(
          "0x6e64a4e75096a2bdf38e7cf147a4c8fff3f5e3f6",
          tempPassword,
          {
            gasLimit: 30000000,
          },
        );
      await tx.wait();
      console.log("transaction complete", tx);
      // Verify the approval status
      const authData = await state.twoFactorAuth.authData(
        state.selectedAddress,
      );
      if (authData.isApproved === true) {
        console.log("request has not been approved yet");
      }
    } catch (error) {
      console.error("An error occurred during login approval:", error);
    }
  };

  const getEncryptedPassword = async () => {
    try {
      const provider = state.provider;
      const client = new FhenixClient({ provider });
      const signer = await state.provider.getSigner();
      console.log("provider", provider, "client", client, "signer", signer);

      const encryptedPassword = await state.twoFactorAuth
        .connect(signer)
        .getEncryptedPassword();
      const contractAddress = await state.twoFactorAuth.getAddress();

      console.log(
        "transaction complete",
        encryptedPassword,
        "contractAddress",
        contractAddress,
        "client",
        client,
      );

      // Check if client is properly initialized
      if (!client || typeof client.unseal !== "function") {
        throw new Error("FhenixClient is not properly initialized");
      } else {
        console.log("client is defined");
      }

      const tempPassword = state.client.unseal(
        contractAddress,
        encryptedPassword,
      );
      console.log("tempPassword", tempPassword);
    } catch (error) {
      console.error("An error occurred during getEncryptedPassword:", error);
    }
  };

  const addServiceToWhitelist = async () => {
    try {
      const signer = await state.provider.getSigner();
      console.log("signer", signer, "state.permit", state.permit);
      const whitelistedServices = await state.twoFactorAuth
        .connect(signer)
        .whitelistedServices("0x65237f09164829a1Ad69b4A05F21E1f8A729EF6e");
      console.log("whitelistedServices", whitelistedServices);

      const tx = await state.twoFactorAuth.addServiceToWhitelist(
        state.permit,
        "0x65237f09164829a1Ad69b4A05F21E1f8A729EF6e",
        {
          gasLimit: 30000000,
        },
      );

      console.log("incomplete tx", tx);
      await tx.wait();
      console.log("transactions", tx);
      const whitelistedServices1 = await state.twoFactorAuth
        .connect(signer)
        .whitelistedServices("0x65237f09164829a1Ad69b4A05F21E1f8A729EF6e");
      console.log("whitelistedServices", whitelistedServices1);
    } catch (error) {
      console.error("An error occurred during addServiceToWhitelist", error);
      if (error.reason) console.error("Error reason:", error.reason);
      if (error.code) console.error("Error code:", error.code);
      if (error.method) console.error("Error method:", error.method);
      if (error.transaction)
        console.error("Error transaction:", error.transaction);
    }
  };

  const initializeEthers = useCallback(async () => {
    const newProvider = new BrowserProvider(window.ethereum);
    setState((prevState) => ({ ...prevState, provider: newProvider }));
    const signer = await newProvider.getSigner();
    const twoFactorAuth = new Contract(
      TwoFactorAuth.address,
      TwoFactorAuth.abi,
      signer,
    );
    setState((prevState) => ({
      ...prevState,
      twoFactorAuth: twoFactorAuth,
    }));
  }, []);

  const dismissNetworkError = () => {
    setState((prevState) => ({ ...prevState, networkError: undefined }));
  };

  const checkNetwork = async () => {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      try {
        await switchToCustomChain(window.ethereum);
      } catch (error) {
        //TODO: Add a notification for connecting wallet since, coinbase is not able to change network.
        console.error("Failed to switch network:", error);
      }
    }
  };

  useEffect(() => {
    const handleAccountsChanged = ([newAddress]) => {
      if (newAddress === undefined) {
        setState((prevState) => ({
          ...prevState,
          selectedAddress: undefined,
        }));
      } else {
        initialize(newAddress);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [initialize]);

  if (window.ethereum === undefined) {
    return <NoWalletDetected />;
  }

  if (!state.selectedAddress) {
    return (
      <ConnectWallet
        connectWallet={connectWallet}
        networkError={state.networkError}
        dismiss={dismissNetworkError}
      />
    );
  }

  return (
    <div className="container p-4">
      <div className="row">
        <div className="col-12">Welcome to Two factor authentication</div>
      </div>
      <div>this is the user address : {state.selectedAddress}</div>
      <div>Register the secondary signer</div>
      <input
        name="secondarySigner"
        onChange={(e) =>
          setState((prevState) => ({
            ...prevState,
            secondarySigner: e.target.value,
          }))
        }
      />
      <button onClick={registerSecondarySigner}>Register</button>
      <button onClick={requestLogin}>Request Login</button>
      <button onClick={approveLogin}>Approve Login</button>
      <button onClick={getEncryptedPassword}>getEncryptedPassword</button>
      <button onClick={addServiceToWhitelist}>addServiceToWhitelist</button>
      <hr />
    </div>
  );
};
