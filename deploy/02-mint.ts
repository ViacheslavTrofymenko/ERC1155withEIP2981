import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const imagesLocation = "./images/"
const textsLocation = "./words/"

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  text: "",
  attributes: [],
}

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers } = hre
  const { deployer } = await getNamedAccounts()

  const scribeVerseNft = await ethers.getContract("ScribeVerseNft", deployer)
  const scribeVerseMintTx = await scribeVerseNft.mint()
  await scribeVerseMintTx.wait(1)
  console.log(`ScribeVerseNft index 0 tokenURI: ${await scribeVerseNft.tokenURI}`)
}
export default mint
mint.tags = ["all", "mint"]
