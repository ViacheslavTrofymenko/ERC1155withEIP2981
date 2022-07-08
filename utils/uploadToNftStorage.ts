import { NFTStorage, File } from "nft.storage"
import mime from "mime"
import fs from "fs"
import path from "path"
import "dotenv/config"

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY

/**
 * Reads an text file from `imagePath` and stores an NFT with the given name and description.
 * @param {string} textsPath the path to an text file
 * @param {string} name a name for the NFT
 * @param {string} description a text description for the NFT
 */
async function storeScribeVerseNFT(textsPath) {
    const fullTextsPath = path.resolve(textsPath)
    const files = fs.readdirSync(fullTextsPath)
    let responses = []

    for (const fileIndex in files) {
        const image = await fileFromPath(`${fullTextsPath}/${files[fileIndex]}`)
        const nftstorage = new NFTStorage({ token: NFT_STORAGE_API_KEY })
        const dogName = files[fileIndex].replace(".png", "")
        const response = await nftstorage.store({
            image,
            name: dogName,
            description: `An adorable ${dogName}`,
            // Currently doesn't support attributes 😔
            // attributes: [{ trait_type: "cuteness", value: 100 }],
        })
        responses.push(response)
    }
    return responses

    console.log("NFT data stored!")
    console.log("Metadata URI: ", metadata.url)
}

storeScribeVerseNFT()
function fileFromPath(arg0: string) {
    throw new Error("Function not implemented.")
}
