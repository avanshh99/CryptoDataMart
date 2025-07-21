import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { getPaymentContract } from '../utils/contract';
import toast from 'react-hot-toast';

const usePaymentContract = () => {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        toast.error('MetaMask is not installed');
        return;
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setSigner(web3Provider.getSigner());
      } catch (err) {
        console.error('Wallet connection failed', err);
        toast.error('Wallet connection rejected');
      }
    };

    init();
  }, []);

  const paymentContract = useMemo(() => {
    return signer ? getPaymentContract(signer) : null;
  }, [signer]);

  const buyDataset = async (listingId: number, price: number) => {
    if (!paymentContract) return toast.error('Contract not ready');

    setIsLoading(true);
    try {
      const tx = await paymentContract.buyDataset(listingId, {
        value: ethers.utils.parseUnits(price.toString(), 'wei'),
      });
      await tx.wait();
      toast.success('Dataset purchased successfully!');
    } catch (err: any) {
      console.error('Buy error:', err);
      toast.error(err.reason || err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    buyDataset,
    isLoading,
  };
};

export default usePaymentContract;
