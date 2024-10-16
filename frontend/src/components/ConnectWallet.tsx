'use client';
import React from 'react';

import { Button } from '@/components/ui/button';

export default function ConnectWallet({ connectWallet }: any) {
  return (
    <div className='h-screen w-screen'>
      <div className='row justify-content-md-center'>
        <div className='flex flex-col items-start justify-start px-8 pt-32'>
          <div className='text-center text-6xl text-white'>
            <div className='text-6xl text-slate-500'>WELCOME TO FHENIX 2FA</div>
            <div className='text-2xl text-slate-600'>
              A Two factor Authentication App
            </div>
          </div>
          <Button className='mx-48 my-16 p-8 text-2xl' onClick={connectWallet}>
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
