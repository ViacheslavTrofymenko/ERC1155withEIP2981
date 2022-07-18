import verify from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  contractName,
  contractSymbol,
  uri,
} from "../helper-hardhat-config"

const deployScribeVerseNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS

  // const chainId: number = network.config.chainId!

  log("----------------------------------------------------")
  log("Deploying ScribeVerseNft and waiting for confirmations...")
  const args: any[] = [contractName, contractSymbol, uri]
  const scribeVerseNft = await deploy("ScribeVerseNft", {
    from: deployer,
    args: args,
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: waitBlockConfirmations || 1,
  })
  log(`ScribeVerseNft deployed at ${scribeVerseNft.address}`)
  log("----------------------------------------------------")
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(scribeVerseNft.address, [])
  }
}

export default deployScribeVerseNft
deployScribeVerseNft.tags = ["all", "scribeVerseNft"]
