import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractAddressData from '../contracts/contractAddress.json';
import contractArtifact from '../contracts/DecentralizedVoting.json';

const Web3Context = createContext(null);

const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337);
const FALLBACK_RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractAddressData.address;

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Initialize read-only provider immediately
  const getReadOnlyProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
  }, []);

  // Check if current account is the contract owner
  const verifyOwner = useCallback(async (currentAccount, currentProvider) => {
    if (!currentAccount || !CONTRACT_ADDRESS) {
      setIsOwner(false);
      return;
    }
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, currentProvider);
      const ownerAddress = await contract.owner();
      setIsOwner(ownerAddress.toLowerCase() === currentAccount.toLowerCase());
    } catch (err) {
      console.warn("Could not check contract owner:", err.message);
      setIsOwner(false);
    }
  }, []);

  // Connect browser wallet (MetaMask)
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask or Web3 wallet was not detected. Please install a Web3 wallet extension.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      const userSigner = await browserProvider.getSigner();
      const userAccount = accounts[0];

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(userAccount);
      setChainId(currentChainId);

      const wrong = currentChainId !== EXPECTED_CHAIN_ID;
      setIsWrongNetwork(wrong);

      await verifyOwner(userAccount, browserProvider);
    } catch (err) {
      console.error("Wallet connection error:", err);
      if (err.code === 4001) {
        setError("Connection rejected by user in wallet.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsOwner(false);
  };

  // Switch network helper
  const switchNetwork = async (targetChainId = EXPECTED_CHAIN_ID) => {
    if (!window.ethereum) return;

    const hexChainId = `0x${targetChainId.toString(16)}`;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setIsWrongNetwork(false);
    } catch (switchError) {
      // Chain not added (error code 4902)
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: targetChainId === 31337 ? 'Hardhat Localhost' : 'Ethereum Network',
                rpcUrls: [FALLBACK_RPC_URL],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
          setIsWrongNetwork(false);
        } catch (addError) {
          setError("Failed to add the requested network to wallet.");
        }
      } else {
        setError("Failed to switch network.");
      }
    }
  };

  // Auto-connect if already authorized
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAccount = accounts[0];
        setAccount(newAccount);
        if (provider) {
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
          await verifyOwner(newAccount, provider);
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      const parsedChainId = parseInt(newChainId, 16);
      setChainId(parsedChainId);
      setIsWrongNetwork(parsedChainId !== EXPECTED_CHAIN_ID);
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Initial silent check
    const checkInitialConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_accounts", []);
        if (accounts.length > 0) {
          const network = await browserProvider.getNetwork();
          const currentChainId = Number(network.chainId);
          const userSigner = await browserProvider.getSigner();

          setProvider(browserProvider);
          setSigner(userSigner);
          setAccount(accounts[0]);
          setChainId(currentChainId);
          setIsWrongNetwork(currentChainId !== EXPECTED_CHAIN_ID);
          await verifyOwner(accounts[0], browserProvider);
        }
      } catch (err) {
        console.warn("Silent connection check error:", err);
      }
    };

    checkInitialConnection();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [verifyOwner]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        expectedChainId: EXPECTED_CHAIN_ID,
        provider,
        signer,
        contractAddress: CONTRACT_ADDRESS,
        isOwner,
        isConnected: !!account,
        isConnecting,
        isWrongNetwork,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        getReadOnlyProvider,
        clearError: () => setError(null),
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
