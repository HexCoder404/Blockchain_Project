import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import contractData from '../contracts/LandRegistry.json';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

const LOCAL_CHAIN_ID = '0x7a69'; // 31337
const LOCAL_NETWORK_CONFIG = {
  chainId: LOCAL_CHAIN_ID,
  chainName: 'Hardhat Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
};

const CONTRACT_ERROR_MESSAGES = {
  ParcelAlreadyExists: 'This land parcel is already registered.',
  ParcelDoesNotExist: 'The supplied parcel ID does not exist.',
  UnauthorizedAccount: 'The connected wallet is not authorized for this action.',
  NotOwner: 'Only the current landowner can perform this action.',
  NotBuyer: 'Only the buyer named in this transfer can accept it.',
  InvalidTransferState: 'This transfer is not at the required workflow step.',
  EncumbrancePresent: 'This parcel has an active mortgage or encumbrance.',
  InvalidStatus: 'This parcel is disputed or frozen and cannot be transferred.',
  ObjectionPeriodActive: 'The 30-day objection period is still active. Certification becomes available when its countdown reaches zero.',
  ObjectionPeriodExpired: 'The 30-day objection period has ended.',
  ObjectionPresent: 'This mutation cannot be certified because an objection was filed.',
  InvalidAddress: 'Enter a valid non-zero wallet address.',
  InvalidArea: 'Land area must be greater than zero.',
  SelfTransfer: 'The owner cannot transfer a parcel to the same wallet.',
  AccessControlUnauthorizedAccount: 'The connected wallet does not have the required role.',
};

const findRevertData = (error) => {
  const candidates = [
    error?.data,
    error?.info?.error?.data,
    error?.error?.data,
    error?.cause?.data,
  ];
  return candidates.find((value) => typeof value === 'string' && value.startsWith('0x'));
};

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState('Citizen'); // Default role
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskMissing, setIsMetaMaskMissing] = useState(false);
  const [txPending, setTxPending] = useState(false);

  useEffect(() => {
    if (!window.ethereum) {
      setIsMetaMaskMissing(true);
      return;
    }

    const initProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(initProvider);

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        initConnection();
      } else {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto connect if previously authorized
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          initConnection();
        }
      });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const initConnection = async () => {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await browserProvider.getSigner();
      const _account = await _signer.getAddress();
      
      setSigner(_signer);
      setAccount(_account);

      if (contractData.address && contractData.abi) {
        const _contract = new ethers.Contract(contractData.address, contractData.abi, _signer);
        setContract(_contract);
        await determineRole(_contract, _account);
      }
    } catch (error) {
      console.error("Error initializing connection:", error);
    }
  };

  const determineRole = async (landRegistry, userAddress) => {
    try {
      const TALATHI_ROLE = await landRegistry.TALATHI_ROLE();
      const SUB_REGISTRAR_ROLE = await landRegistry.SUB_REGISTRAR_ROLE();
      const BANK_ROLE = await landRegistry.BANK_ROLE();
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

      if (await landRegistry.hasRole(DEFAULT_ADMIN_ROLE, userAddress)) {
        setRole('Admin');
      } else if (await landRegistry.hasRole(TALATHI_ROLE, userAddress)) {
        setRole('Talathi');
      } else if (await landRegistry.hasRole(SUB_REGISTRAR_ROLE, userAddress)) {
        setRole('SubRegistrar');
      } else if (await landRegistry.hasRole(BANK_ROLE, userAddress)) {
        setRole('Bank');
      } else {
        setRole('Citizen');
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
      setRole('Citizen');
    }
  };



  const switchToLocalhost = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: LOCAL_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [LOCAL_NETWORK_CONFIG],
          });
        } catch (addError) {
          throw new Error("Failed to add Localhost network to MetaMask");
        }
      } else {
        throw new Error("Failed to switch to Localhost network");
      }
    }
  };

  const connect = async () => {
    if (isMetaMaskMissing) {
      toast.error(
        <span>
          MetaMask is not installed.{' '}
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="underline font-bold text-blue-200">
            Install here
          </a>
        </span>, 
        { duration: 5000 }
      );
      return;
    }

    setIsConnecting(true);
    const connectToast = toast.loading('Connecting to MetaMask...');
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await switchToLocalhost();
      await initConnection();
      toast.success('Wallet connected successfully!', { id: connectToast });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to connect wallet.', { id: connectToast });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setRole('Citizen');
    setContract(null);
    toast.success('Wallet disconnected.');
  };

  const executeTransaction = async (transactionPromise, loadingMsg = 'Transaction pending...', successMsg = 'Transaction successful!') => {
    setTxPending(true);
    const txToast = toast.loading(loadingMsg);
    try {
      const tx = await transactionPromise;
      await tx.wait();
      toast.success(successMsg, { id: txToast });
      return tx;
    } catch (error) {
      console.error("Transaction failed:", error);
      let errorMsg = error.reason || error.shortMessage || error.message || "Transaction failed";
      const revertData = findRevertData(error);
      if (contract && revertData) {
        try {
          const decodedError = contract.interface.parseError(revertData);
          errorMsg = CONTRACT_ERROR_MESSAGES[decodedError?.name] || errorMsg;
        } catch (decodeError) {
          console.debug('Could not decode contract error:', decodeError);
        }
      }
      toast.error(errorMsg, { id: txToast });
      throw error;
    } finally {
      setTxPending(false);
    }
  };

  return (
    <WalletContext.Provider 
      value={{
        provider,
        signer,
        contract,
        account,
        role,
        isConnecting,
        isMetaMaskMissing,
        txPending,
        connect,
        disconnect,
        executeTransaction
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
