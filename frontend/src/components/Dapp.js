import React, { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider } from "ethers";
import TwoFactorAuth from "../TwoFactorAuth.json"; // Assuming this import exists
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { getPermit } from "fhenixjs";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = "31337";

export const Dapp = () => {
  const [state, setState] = useState({
    selectedAddress: undefined,
    provider: undefined,
    networkError: undefined,
  });
  const [secondarySigner, setSecondarySigner] = useState("");

  const [twoFactorAuth, setTwoFactorAuth] = useState(null);

  const connectWallet = async () => {
    try {
      const [selectedAddress] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      checkNetwork();
      initialize(selectedAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const createFheInstance = async () => {
    const signer = await state.provider.getSigner();
    const permit = await getPermit(
      await twoFactorAuth.getAddress(),
      state.provider,
    );
    console.log(
      "get balance of signer",
      await state.provider.getBalance(state.selectedAddress),
    );
    console.log("Signer Address:", await signer.getAddress());

    console.log("two", twoFactorAuth, permit, state.provider);
    const tx = await twoFactorAuth
      .connect(signer)
      .register(permit, "0x269523e950eaDc3bA5F57a050e4746839cb7Dff1", {
        gasLimit: 30000000,
      });
    await tx.wait();
    // Verify the registration
    console.log("permit", permit, state.provider, "tx", tx);
    const authData = await twoFactorAuth.authData(state.selectedAddress);

    console.log("authData", authData);
  };

  const initialize = useCallback((userAddress) => {
    setState((prevState) => ({ ...prevState, selectedAddress: userAddress }));
    initializeEthers();
  }, []);

  const registerSecondarySigner = async () => {
    createFheInstance();

    console.log(
      "Registered",
      secondarySigner,
      await twoFactorAuth.getAddress(),
      state.selectedAddress,
    );
  };

  const initializeEthers = useCallback(async () => {
    const newProvider = new BrowserProvider(window.ethereum);
    setState((prevState) => ({ ...prevState, provider: newProvider }));
    const signer = await newProvider.getSigner();
    const twoFactorAuth = new ethers.Contract(
      TwoFactorAuth.address,
      TwoFactorAuth.abi,
      signer,
    );
    setTwoFactorAuth(twoFactorAuth);
  }, []);

  const dismissNetworkError = () => {
    setState((prevState) => ({ ...prevState, networkError: undefined }));
  };

  const checkNetwork = async () => {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${HARDHAT_NETWORK_ID.toString(16)}` }],
        });
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
        onChange={(e) => setSecondarySigner(e.target.value)}
      />
      <button onClick={registerSecondarySigner}>Register</button>
      <hr />
    </div>
  );
};
