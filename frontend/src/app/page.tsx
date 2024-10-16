'use client';

import { BrowserProvider, Contract } from 'ethers';
import { ClipboardMinus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import {
  addServiceToWhitelist,
  getEncryptedPassword,
  requestLogin,
  verifyTempPassword,
} from '@/lib/contractCalls';
import { addCustomChain, checkNetwork } from '@/lib/utils';
import { State } from '@/types/types';

import ConnectWallet from '../components/ConnectWallet';
import TwoFactorAuth from '../deployment/localfhenix/TwoFactorAuth.json';

export default function Home() {
  const { isConnected, setIsConnected } = useAuth();
  const [state, setState] = useState<State>({
    selectedAddress: undefined,
    provider: undefined,
    twoFactorAuth: undefined,
    tempPassword: undefined,
    ServiceToWhitelist: undefined,
    verifyUserAddress: undefined,
  });

  const { toast } = useToast();

  const initializeEthers = useCallback(async () => {
    const newProvider = new BrowserProvider(window.ethereum);
    setState((prevState) => ({ ...prevState, provider: newProvider }));
    const signer = await newProvider.getSigner();
    const twoFactorAuth = new Contract(
      TwoFactorAuth.address,
      TwoFactorAuth.abi,
      signer
    );
    setState((prevState: any) => ({
      ...prevState,
      twoFactorAuth: twoFactorAuth,
    }));
  }, []);

  const initialize = useCallback((userAddress: string) => {
    setState((prevState) => ({ ...prevState, selectedAddress: userAddress }));
    initializeEthers();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [selectedAddress] = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setIsConnected(true);

        await addCustomChain(window.ethereum);
        checkNetwork();
        initialize(selectedAddress);
      } catch (error) {
        toast({
          title: 'Connect the wallet',
          description: "It seems you don't have any wallet connected",
        });
      }
    }
  };

  useEffect(() => {
    const handleAccountsChanged = ([newAddress]: any) => {
      if (newAddress === undefined) {
        setState((prevState) => ({
          ...prevState,
          selectedAddress: undefined,
        }));
      } else {
        initialize(newAddress);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [initialize]);

  if (!isConnected) {
    return <ConnectWallet connectWallet={connectWallet} />;
  }

  return (
    <div className='h-[90vh] w-screen bg-3dot'>
      <div className='flex flex-col items-start justify-start p-12 text-4xl text-white'>
        <div className='text-8xl text-slate-500'>FHENIX HOMEPAGE</div>
        <div className='text-2xl text-slate-600'>
          Request Login and add Services to whitelist
        </div>
      </div>
      <div className='flex flex-col items-start justify-start gap-8 p-12'>
        <div className='flex flex-row gap-12'>
          <div>
            <Button onClick={() => requestLogin(state)}>Request Login</Button>
          </div>
          <div>
            <Button
              onClick={async () => {
                const tempPassword = await getEncryptedPassword(state);
                setState((prevState: State) => ({
                  ...prevState,
                  tempPassword: String(tempPassword),
                }));
              }}
            >
              Get Encryption Password
            </Button>
          </div>
        </div>
        <div className='flex flex-row gap-6'>
          <div className='w-72 text-ellipsis rounded-lg border border-white bg-slate-500/80 p-2 contain-content'>
            {state.tempPassword != undefined ? (
              state.tempPassword
            ) : (
              <span className='text-slate-900'>
                Temporary password appears here
              </span>
            )}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(state.tempPassword as string);
              toast({
                title: 'Temporary password copied to clipboard',
              });
            }}
          >
            <div className='w-auto text-ellipsis border border-white bg-slate-500 p-2 contain-content hover:bg-slate-500/80'>
              <ClipboardMinus />
            </div>
          </button>
        </div>
        <div className='mt-32 flex flex-col gap-6 border border-white bg-slate-600/20 p-6'>
          <div className='flex flex-row gap-4'>
            <Input
              className='w-96'
              name='ServiceToWhitelist'
              placeholder='Address of 3rd party to be whitelisted'
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  ServiceToWhitelist: e.target.value,
                }))
              }
            />
            <Button onClick={() => addServiceToWhitelist(state)}>
              Add Service To whitelist
            </Button>
          </div>
          <hr />
          <div className='flex flex-row gap-4'>
            <Input
              className='w-96'
              name='ServiceToWhitelist'
              placeholder='Address of admin'
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  verifyUserAddress: e.target.value,
                }))
              }
            />
            <Input
              className='w-96'
              name='tempPassword'
              placeholder='Temperory Password'
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  tempPassword: e.target.value,
                }))
              }
            />
            <Button onClick={() => verifyTempPassword(state)}>
              Verify Temporary Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
