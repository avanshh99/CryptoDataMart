import { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { getListingContract } from '../utils/contract';
import { fetchListingData, fetchNextListingId } from '../utils/listingContractHelpers';
import { Listing } from '../types/listing';
import toast from 'react-hot-toast';

const useListingContract = () => {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [listingData, setListingData] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingListing, setCreatingListing] = useState(false);
  const [fullDatasetLink, setFullDatasetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likedBy, setLikedBy] = useState<Map<number, boolean>>(new Map());

  const [ipfsLink, setIpfsLink] = useState('');
  const [previewIpfsLink, setPreviewIpfsLink] = useState('');
  const [price, setPrice] = useState(0);
  const [rentPricePerHour, setRentPricePerHour] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  // Initialize signer from MetaMask
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        toast.error('MetaMask is not installed');
        return;
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signerInstance = provider.getSigner();
        const address = await signerInstance.getAddress();
        console.log('Connected wallet:', address);
        setSigner(signerInstance);
      } catch (err) {
        console.error('Wallet connection error:', err);
        toast.error('Failed to connect wallet');
      }
    };

    init();
  }, []);

  // Memoize contract
  const contract = useMemo(() => {
    if (!signer) {
      console.warn('Signer not ready for contract');
      return null;
    }
    return getListingContract(signer);
  }, [signer]);

  // Fetch all listings
  const fetchAllListings = useCallback(async () => {
    if (!contract || !signer) {
      console.warn('Contract not ready to fetch listings');
      return;
    }

    setIsLoading(true);
    try {
      const nextListingId = await fetchNextListingId(signer);
      const promises = Array.from({ length: nextListingId.toNumber() }, (_, i) =>
        fetchListingData(signer, i)
      );
      const listings = await Promise.all(promises);
      setListingData(listings);
      await fetchLikedDatasets(listings);
    } catch (err) {
      toast.error('Error fetching listings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer]);

  const fetchLikedDatasets = useCallback(async (listings: Listing[]) => {
    if (!contract || !signer) return;

    try {
      const address = await signer.getAddress();
      const likedMap = new Map<number, boolean>();

      for (const listing of listings) {
        const isLiked = await contract.likedBy(listing.id, address);
        likedMap.set(listing.id, isLiked);
      }

      setLikedBy(likedMap);
    } catch (err) {
      toast.error('Failed to fetch liked datasets');
      console.error(err);
    }
  }, [contract, signer]);

  useEffect(() => {
    if (contract && signer) {
      fetchAllListings();
    }
  }, [contract, signer, fetchAllListings]);

  const likeDataset = async (datasetId: number) => {
    if (!contract) return toast.error('Contract not ready');

    try {
      const tx = await contract.likeDataset(datasetId);
      await tx.wait();
      setLikedBy((prev) => new Map(prev).set(datasetId, true));
    } catch (err) {
      toast.error('Failed to like dataset');
      console.error(err);
    }
  };

  const removeLikeDataset = async (datasetId: number) => {
    if (!contract) return toast.error('Contract not ready');

    try {
      const tx = await contract.removeLikeDataset(datasetId);
      await tx.wait();
      setLikedBy((prev) => new Map(prev).set(datasetId, false));
    } catch (err) {
      toast.error('Failed to remove like');
      console.error(err);
    }
  };

  const createNewListing = async (
    previewCid: string,
    fullCid: string,
    price: number,
    rentPricePerHour: number,
    tags: string[]
  ) => {
    if (!contract) return toast.error('Contract not ready');

    setCreatingListing(true);
    try {
      const tx = await contract.createListing(fullCid, previewCid, price, rentPricePerHour, tags);
      await tx.wait();
      toast.success('Listing created successfully');
      fetchAllListings();
    } catch (err) {
      toast.error('Error creating listing');
      console.error(err);
    } finally {
      setCreatingListing(false);
    }
  };

  const fetchFullDatasetLink = useCallback(async (datasetId: number) => {
    if (!contract) {
      setError('Contract not ready');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const ipfsHash = await contract.getFullIPFSLink(datasetId);
      const fullUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setFullDatasetLink(fullUrl);
    } catch (err) {
      setError('Access denied or error occurred');
      setFullDatasetLink(null);
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  return {
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
    fetchFullDatasetLink,
    likedBy,
    likeDataset,
    removeLikeDataset,
  };
};

export default useListingContract;
