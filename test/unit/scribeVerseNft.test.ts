import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { network, deployments, ethers } from "hardhat"
import { BigNumber, BigNumberish } from "ethers"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { ScribeVerseNft } from "../../typechain-types"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Scribe Verse NFT Unit Tests", () => {
      let scribeVerseNft: ScribeVerseNft
      let aliceAccount: SignerWithAddress,
        bobAccount: SignerWithAddress,
        charlieAccount: SignerWithAddress
      let alice: string, bob: string, charlie: string

      before(async () => {
        ;[aliceAccount, bobAccount, charlieAccount] = await ethers.getSigners()
        ;[alice, bob, charlie] = [aliceAccount, bobAccount, charlieAccount].map(
          (account) => account.address
        )
      })

      beforeEach(async () => {
        await deployments.fixture(["scribeVerseNft"])
        scribeVerseNft = await ethers.getContract("ScribeVerseNft")
      })

      describe("Allows user to mint token", () => {
        it("Should be reverted when royalty more than 100%", async () => {
          await expect(scribeVerseNft.mint(11000, "0x")).to.be.revertedWith(
            "ScribeVerseNft__ExceedMaxRoyalty()"
          )
        })

        it("Allows deployer to mint an NFT, and updates appropriately", async () => {
          const txResponse = await scribeVerseNft.mint(1000, "0x")
          await txResponse.wait(1)
          const tokenCounter = await scribeVerseNft.getTotalAmountOfNfts()
          const creator = await scribeVerseNft.getCreator(1)

          assert.equal(tokenCounter.toString(), "1")
          assert.equal(creator, alice)
        })

        it("Allows any user to mint an NFT, and updates appropriately", async () => {
          const txResponse = await scribeVerseNft.connect(bobAccount).mint(1000, "0x")
          await txResponse.wait(1)
          const tokenCounter = await scribeVerseNft.getTotalAmountOfNfts()
          const creator = await scribeVerseNft.getCreator(1)

          assert.equal(tokenCounter.toString(), "1")
          expect(creator).to.be.equal(bob)
        })

        it("Should apply royalty to creator appropriatly", async () => {
          const royaltyBps = 1500
          const txResponse = await scribeVerseNft.mint(royaltyBps, "0x")
          await txResponse.wait(1)
          const royaltyReceiver = await scribeVerseNft.getRoyaltyReceiver(1)
          assert.equal(alice, royaltyReceiver.creator)
          assert.equal(royaltyBps, royaltyReceiver.royaltyBps)
        })

        it("Should be emitted event TransferSingle", async () => {
          const royaltyBps = 1000
          const tokenId = 1
          await expect(scribeVerseNft.mint(royaltyBps, "0x"))
            .to.emit(scribeVerseNft, "TokenRoyaltySet")
            .withArgs(tokenId, alice, royaltyBps)
        })
      })

      describe("Allows user to mint batch of tokens", () => {
        it("Should be reverted when royalty more than 100%", async () => {
          await expect(scribeVerseNft.mintBatch(11000, 5, "0x")).to.be.revertedWith(
            "ScribeVerseNft__ExceedMaxRoyalty()"
          )
        })

        it("Allows deployer mint batch of tokens, and updates appropriately", async () => {
          const royaltyBps = 2000
          const amountsOfNfts = 15
          const txResponse = await scribeVerseNft.mintBatch(royaltyBps, amountsOfNfts, "0x")
          await txResponse.wait(1)
          const tokenCounter = await scribeVerseNft.getTotalAmountOfNfts()
          const royaltyReceiver = await scribeVerseNft.getRoyaltyReceiver(1)
          const royaltyReceiver2 = await scribeVerseNft.getRoyaltyReceiver(5)

          assert.equal(tokenCounter.toString(), `${amountsOfNfts}`)
          assert.equal(alice, royaltyReceiver.creator)
          assert.equal(royaltyBps, royaltyReceiver.royaltyBps)
          assert.equal(royaltyBps, royaltyReceiver2.royaltyBps)
        })

        it("Allows any user mint batch of tokens, and updates appropriately", async () => {
          const royaltyBps = 2000
          const amountsOfNfts = 5
          const txResponse = await scribeVerseNft
            .connect(bobAccount)
            .mintBatch(royaltyBps, amountsOfNfts, "0x")
          await txResponse.wait(1)
          const tokenCounter = await scribeVerseNft.getTotalAmountOfNfts()
          const royaltyReceiver = await scribeVerseNft.getRoyaltyReceiver(1)
          const royaltyReceiver2 = await scribeVerseNft.getRoyaltyReceiver(5)

          assert.equal(tokenCounter.toString(), `${amountsOfNfts}`)
          assert.equal(bob, royaltyReceiver.creator)
          assert.equal(royaltyBps, royaltyReceiver.royaltyBps)
          assert.equal(royaltyBps, royaltyReceiver2.royaltyBps)
        })

        it("Should be emitted event TransferSingle", async () => {
          const royaltyBps = 1000
          const tokenId = 1
          const amountsOfNfts = 5
          await expect(scribeVerseNft.mintBatch(royaltyBps, amountsOfNfts, "0x"))
            .to.emit(scribeVerseNft, "TokenRoyaltySet")
            .withArgs(tokenId, alice, royaltyBps)
        })
      })

      describe("resetTokenRoyalty function", () => {
        it("Creator can call this function", async () => {
          const royaltyBps = 2000
          const newRoyaltyBps = 5000
          const amountsOfNfts = 5
          const txResponse = await scribeVerseNft.mintBatch(royaltyBps, amountsOfNfts, "0x")
          await txResponse.wait(1)

          await scribeVerseNft.resetTokenRoyalty(2, newRoyaltyBps)
          const royaltyReceiver = await scribeVerseNft.getRoyaltyReceiver(2)
          assert.equal(newRoyaltyBps, royaltyReceiver.royaltyBps)
        })

        it("Other users can not call this function", async () => {
          const royaltyBps = 2000
          const newRoyaltyBps = 5000
          const amountsOfNfts = 5
          const txResponse = await scribeVerseNft.mintBatch(royaltyBps, amountsOfNfts, "0x")
          await txResponse.wait(1)

          const resetTokenRoyalty = scribeVerseNft
            .connect(bobAccount)
            .resetTokenRoyalty(2, newRoyaltyBps)
          await expect(resetTokenRoyalty).to.be.revertedWith("ScribeVerseNft__OnlyCreator()")
        })
      })

      describe("Function setURI", () => {
        it("Owner can set new URI address", async () => {
          const newUri = "https://newURI"
          const txResponse = await scribeVerseNft.mint(1000, "0x")
          await txResponse.wait(1)
          await scribeVerseNft.setURI(newUri)
          const uri = await scribeVerseNft.uri(1)
          assert.equal(newUri, uri)
        })

        it("Only owner can set new URI address", async () => {
          const newUri = "https://newURI"
          const txResponse = await scribeVerseNft.mint(1000, "0x")
          await txResponse.wait(1)
          const setUri = scribeVerseNft.connect(bobAccount).setURI(newUri)

          await expect(setUri).to.be.revertedWith("Ownable: caller is not the owner")
        })
      })
      describe("Function royaltyInfo", () => {
        it("Allows any users to get information of royalty", async () => {
          const salePrice = ethers.utils.parseEther("2.5")

          const txResponse = await scribeVerseNft.mint(5000, "0x")
          await txResponse.wait(1)
          const royaltyInfo = await scribeVerseNft.royaltyInfo(1, salePrice)

          const royaltyReceiver = await (await scribeVerseNft.getRoyaltyReceiver(1)).royaltyBps

          const royalty = salePrice.mul(royaltyReceiver).div(10000)

          const royaltyAmount = await royaltyInfo.royaltyAmount

          assert.equal(royalty.toString(), royaltyAmount.toString())
        })
      })

      describe("Function supportsInterface", () => {
        it("Should support interface of ERC1155 and EIP165", async () => {
          const interfaceERC1155 = "0xd9b67a26"
          const interfaceEIP165 = "0x01ffc9a7"
          const ERC1155 = await scribeVerseNft.supportsInterface(interfaceERC1155)
          const EIP165 = await scribeVerseNft.supportsInterface(interfaceEIP165)
          const fake = await scribeVerseNft.supportsInterface("0x01ffcfff")
          assert.equal(ERC1155, true)
          assert.equal(EIP165, true)
          assert.equal(fake, false)
        })
      })
    })
