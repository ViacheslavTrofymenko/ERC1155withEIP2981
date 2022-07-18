export interface networkConfigItem {
  name?: string
  blockConfirmations?: number
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
  31337: {
    name: "localhost",
  },
  3: {
    name: "ropsten,",
  },
}

export const developmentChains = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
export const contractName = "ScribeVerse Nft"
export const contractSymbol = "SVNft"
export const uri = "ipfs://uri"
