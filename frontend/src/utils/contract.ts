import { ethers } from "ethers";

import ListingContractABI from "../config/ListingContractABI.json";
import PaymentContractABI from "../config/PaymentContractABI.json";

const listingContractAddress = import.meta.env.VITE_LISTING_CONTRACT_ADDRESS;
const paymentContractAddress = import.meta.env.VITE_PAYMENT_CONTRACT_ADDRESS;

export const getListingContract = (providerOrSigner: ethers.Signer | ethers.providers.Provider) => {
  console.log("ListingContractAddress : ", listingContractAddress);
  return new ethers.Contract(listingContractAddress, ListingContractABI, providerOrSigner);
};

export const getPaymentContract = (providerOrSigner: ethers.Signer | ethers.providers.Provider) => {
  console.log("PaymentContractAddress : ", paymentContractAddress);
  return new ethers.Contract(paymentContractAddress, PaymentContractABI, providerOrSigner);
};