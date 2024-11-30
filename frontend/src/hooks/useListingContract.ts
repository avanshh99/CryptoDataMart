import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { fetchListingData, fetchNextListingId } from '../utils/listingContractHelpers';
import { getListingContract } from '../utils/contract';
import toast from 'react-hot-toast';
import { Listing } from '../types/listing';

const useListingContract = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [listingData, setListingData] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [creatingListing, setCreatingListing] = useState<boolean>(false);

  const [fullDatasetLink, setFullDatasetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ipfsLink, setIpfsLink] = useState<string>('');
  const [previewIpfsLink, setPreviewIpfsLink] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [rentPricePerHour, setRentPricePerHour] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        console.log('Ethereum provider initialized');
      } else {
        toast.error('Please install MetaMask to interact with the blockchain.');
      }
    };

    initProvider();
  }, []);

  useEffect(() => {
    if (provider) {
      fetchAllListings();
    }
  }, [provider]);

  const fetchAllListings = useCallback(async () => {
    if (!provider) return;

    setIsLoading(true);

    try {
      const nextListingId = await fetchNextListingId(provider);
      console.log('Next Listing ID:', nextListingId.toString());

      const listingsPromises = [];
      for (let i = 0; i < nextListingId.toNumber(); i++) {
        listingsPromises.push(fetchListingData(provider, i));
      }

      const listings = await Promise.all(listingsPromises);
      console.log('Fetched All Listings:', listings);

      setListingData(listings);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      toast.error('An error occurred while fetching the listings.');
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  const createNewListing = async (
    previewCid: string,
    fullCid: string,
    price: number,
    rentPricePerHour: number,
    tags: string[]
  ) => {
    if (!provider) return;

    setCreatingListing(true);

    const contract = getListingContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.createListing(
        fullCid,
        previewCid,
        price,
        rentPricePerHour,
        tags
      );

      console.log('Transaction sent:', tx);
      await tx.wait();
      console.log('Listing created successfully.');

      toast.success('Listing created successfully.');
      fetchAllListings();
    } catch (err: any) {
      console.error('Error creating listing:', err);
      toast.error('An error occurred while creating the listing.');
    } finally {
      setCreatingListing(false);
    }
  };

  const fetchFullDatasetLink = useCallback(async (datasetId: number) => {
    if (!provider) {
      setError('Provider not initialized');
      return;
    }

    setIsLoading(true);
    setError(null); 

    try {
      const contract = getListingContract(provider); 
      const contractWithSigner = contract.connect(provider.getSigner());

      const ipfsLink = await contractWithSigner.getFullIPFSLink(datasetId);

      const fullUrl = `https://gateway.pinata.cloud/ipfs/${ipfsLink}`;

      setFullDatasetLink(fullUrl); 
    } catch (err: any) {
      setFullDatasetLink(null);
      setError('You do not have access to the full dataset or an error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  return {
    provider,
    listingData,
    isLoading,
    creatingListing,
    ipfsLink,
    setIpfsLink,
    previewIpfsLink,
    setPreviewIpfsLink,
    price,
    setPrice,
    rentPricePerHour,
    setRentPricePerHour,
    tags,
    setTags,
    createNewListing,
    fullDatasetLink,
    error,
    fetchFullDatasetLink
  };
};

export default useListingContract;
