import { useDispatch } from 'react-redux';
import { setWalletAddress, disconnectWallet } from '../redux/wallet/walletSlice';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const useWalletLogin = () => {
  const dispatch = useDispatch();

const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        dispatch(setWalletAddress(accounts[0]));
        localStorage.setItem('walletConnected', 'true');
        toast.success(`Connected as: ${accounts[0]}`);
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
    }
  } else {
    alert('MetaMask not installed.');
  }
};

const disconnectWalletHandler = () => {
  dispatch(disconnectWallet());
  localStorage.setItem('walletConnected', 'false'); // ✅ Mark as disconnected
  toast.success('Disconnected!');
};


useEffect(() => {
  const autoConnect = async () => {
    const shouldConnect = localStorage.getItem('walletConnected') === 'true';

    if (window.ethereum && shouldConnect) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length > 0) {
        dispatch(setWalletAddress(accounts[0]));
        toast.success(`Reconnected: ${accounts[0]}`);
      }
    }
  };

  autoConnect();
}, [dispatch]);


  return { connectWallet, disconnectWalletHandler };
};

export default useWalletLogin;
