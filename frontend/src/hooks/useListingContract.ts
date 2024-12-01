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

  const [likedBy, setLikedBy] = useState<Map<number, boolean>>(new Map()); // Track liked datasets

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
      await fetchLikedDatasets(listings);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      toast.error('An error occurred while fetching the listings.');
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Fetch the liked datasets for the user
  const fetchLikedDatasets = useCallback(async (listings: Listing[]) => {
    if (!provider) return;

    const contract = getListingContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const likedState = new Map<number, boolean>();

      for (const listing of listings) {
        const isLiked = await contractWithSigner.likedBy(listing.id, await signer.getAddress());
        likedState.set(listing.id, isLiked);
      }

      setLikedBy(likedState);
    } catch (err: any) {
      console.error('Error fetching liked datasets:', err);
      toast.error('An error occurred while fetching the liked datasets.');
    }
  }, [provider]);

  const likeDataset = async (datasetId: number) => {
    if (!provider) return;

    const contract = getListingContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.likeDataset(datasetId);
      console.log('Like transaction sent:', tx);
      await tx.wait();
      console.log('Dataset liked successfully.');

      // Update the liked state immediately
      setLikedBy((prev) => new Map(prev).set(datasetId, true));
    } catch (error) {
      console.error('Error liking dataset:', error);
      toast.error('An error occurred while liking the dataset.');
    }
  };

  const removeLikeDataset = async (datasetId: number) => {
    if (!provider) return;

    const contract = getListingContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.removeLikeDataset(datasetId);
      console.log('Remove like transaction sent:', tx);
      await tx.wait();
      console.log('Dataset unliked successfully.');

      // Update the liked state immediately
      setLikedBy((prev) => new Map(prev).set(datasetId, false));
    } catch (error) {
      console.error('Error removing like:', error);
      toast.error('An error occurred while removing the like.');
    }
  };

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
    fetchFullDatasetLink,
    likedBy,  // Liked dataset state
    likeDataset, // Function to like
    removeLikeDataset, // Function to remove like
  };
};

export default useListingContract;
