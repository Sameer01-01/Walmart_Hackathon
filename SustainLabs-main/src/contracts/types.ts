import { ethers } from 'ethers';

export interface EnergyPackage {
  id: string;
  seller: string;
  price: ethers.BigNumber;
  energyAmount: ethers.BigNumber;
  renewable: boolean;
  validUntil: ethers.BigNumber;
  optimizationMethod: string;
  active: boolean;
}

export interface MarketplaceContract {
  totalPackages: () => Promise<ethers.BigNumber>;

  listPackage: (
    price: ethers.BigNumber,
    energyAmount: ethers.BigNumber,
    renewable: boolean,
    validityPeriod: ethers.BigNumber,
    optimizationMethod: string
  ) => Promise<ethers.ContractTransaction>;

  buyPackage: (packageId: ethers.BigNumber, overrides?: ethers.PayableOverrides) => Promise<ethers.ContractTransaction>;
  
  updatePackagePrice: (
    packageId: ethers.BigNumber,
    newPrice: ethers.BigNumber
  ) => Promise<ethers.ContractTransaction>;
  
  cancelPackage: (packageId: ethers.BigNumber) => Promise<ethers.ContractTransaction>;
  
  getPackage: (packageId: ethers.BigNumber) => Promise<EnergyPackage>;
  
  packages: (packageId: ethers.BigNumber) => Promise<EnergyPackage>;
}

export interface Web3State {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  address: string | null;
  chainId: number | null;
  connected: boolean;
} 