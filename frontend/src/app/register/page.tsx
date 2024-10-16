'use client';

import React, { useEffect, useState } from 'react';

import ConnectWallet from '@/components/ConnectWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import { registerSecondarySigner } from '@/lib/contractCalls';
import { addCustomChain, checkNetwork } from '@/lib/utils';

const Register = () => {
  const [secondarySigner, setSecondarySigner] = useState('');
  const { isConnected, setIsConnected } = useAuth();

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [selectedAddress] = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setIsConnected(true);

        await addCustomChain(window.ethereum);
        checkNetwork();
      } catch (error) {
        toast({
          title: 'Connect the wallet',
          description: "It seems you don't have any wallet connected",
        });
      }
    }
  };

  if (!isConnected) {
    return <ConnectWallet connectWallet={connectWallet} />;
  }
  return (
    <div className='h-[95vh] w-screen'>
      <div className='flex flex-col items-start justify-start p-12'>
        <div className='text-8xl text-slate-500'>FHENIX DASHBOARD</div>
        <div className='text-2xl text-slate-600'>
          Register Your Secondary Signer Here
        </div>
      </div>
      <div className='flex flex-row items-start justify-start gap-4 px-12'>
        <Input
          className='w-96'
          name='secondarySigner'
          placeholder='Address of secondary signer....'
          onChange={(e) => setSecondarySigner(e.target.value)}
        />
        <Button
          className=''
          onClick={async () => {
            await registerSecondarySigner(secondarySigner);
          }}
        >
          Register Secondary Signer
        </Button>
      </div>
    </div>
  );
};

export default Register;
