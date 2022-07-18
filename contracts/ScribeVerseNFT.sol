//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

error ScribeVerseNft__OnlyCreator();
error ScribeVerseNft__ExceedMaxRoyalty();

contract ScribeVerseNft is ERC1155, IERC2981, Ownable {
  struct RoyaltyReceiver {
    address creator;
    uint16 royaltyBps;
  }

  uint256 private _currentTokenID;

  // Contract name
  string public name;
  // Contract symbol
  string public symbol;

  mapping(uint256 => RoyaltyReceiver) internal royalties;
  // mapping(uint256 => address) private creators;

  event TokenRoyaltySet(uint256 indexed tokenId, address indexed creator, uint16 royaltyBps);

  /**
   * @dev Require msg.sender to be the creator of the token id
   */
  modifier onlyCreator(uint256 _tokenId) {
    if (royalties[_tokenId].creator != msg.sender) revert ScribeVerseNft__OnlyCreator();
    _;
  }

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _uri
  ) ERC1155(_uri) {
    name = _name;
    symbol = _symbol;
  }

  function getTotalAmountOfNfts() external view returns (uint256) {
    return _currentTokenID;
  }

  function getCreator(uint256 tokenId) external view returns (address) {
    return royalties[tokenId].creator;
  }

  function getRoyaltyReceiver(uint256 tokenId) external view returns (RoyaltyReceiver memory) {
    return royalties[tokenId];
  }

  /**
   * @dev Define the fee for the token specify
   * @param _tokenId uint256 token ID to specify
   * @param _royaltyBps amount of Royalty fee in bps (1% == 100)
   */
  function resetTokenRoyalty(uint256 _tokenId, uint16 _royaltyBps) external onlyCreator(_tokenId) {
    royalties[_tokenId] = RoyaltyReceiver(msg.sender, _royaltyBps);
    emit TokenRoyaltySet(_tokenId, msg.sender, _royaltyBps);
  }

  function setURI(string memory newuri) external onlyOwner {
    _setURI(newuri);
  }

  /**
   * @dev Allow any user to mint token
   * @param _royaltyBps amount of fee in bps (1% == 100)
   */
  function mint(uint16 _royaltyBps, bytes memory data) external {
    if (_royaltyBps > 10000) revert ScribeVerseNft__ExceedMaxRoyalty();
    uint256 _tokenId = _getNextTokenID();
    _mint(msg.sender, _tokenId, 1, data);
    royalties[_tokenId] = RoyaltyReceiver({creator: msg.sender, royaltyBps: _royaltyBps});
    _incrementTokenTypeId();
    emit TokenRoyaltySet(_tokenId, msg.sender, _royaltyBps);
  }

  /**
   * @dev Allow any user to mint batch of tokens
   * @param _royaltyBps amount of fee in bps (1% == 100)
   */
  function mintBatch(
    uint16 _royaltyBps,
    uint256 amountsOfNfts,
    bytes memory data
  ) external {
    if (_royaltyBps > 10000) revert ScribeVerseNft__ExceedMaxRoyalty();

    uint256[] memory _tokenIds = new uint256[](amountsOfNfts);
    uint256[] memory _amounts = new uint256[](amountsOfNfts);

    for (uint256 i = 0; i < amountsOfNfts; i++) {
      _tokenIds[i] = _getNextTokenID();
      _amounts[i] = 1;

      royalties[_tokenIds[i]] = RoyaltyReceiver({creator: msg.sender, royaltyBps: _royaltyBps});
      emit TokenRoyaltySet(_tokenIds[i], msg.sender, _royaltyBps);
      _incrementTokenTypeId();
    }
    _mintBatch(msg.sender, _tokenIds, _amounts, data);
  }

  /**
   * @dev Returns royalty info (address to send fee, and fee to send)
   * @param _tokenId uint256 ID of the token to display information
   * @param _salePrice uint256 sold price
   */
  function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
    external
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    receiver = royalties[_tokenId].creator;
    royaltyAmount = (royalties[_tokenId].royaltyBps * _salePrice) / 10000;
  }

  // EIP2981 standard Interface return. Adds to ERC1155 and ERC165 Interface returns.
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC1155, IERC165)
    returns (bool)
  {
    return (interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId));
  }

  /**
   * @dev calculates the next token ID based on value of _currentTokenID
   * @return uint256 for the next token ID
   */
  function _getNextTokenID() private view returns (uint256) {
    return _currentTokenID + 1;
  }

  /**
   * @dev increments the value of _currentTokenID
   */
  function _incrementTokenTypeId() private {
    _currentTokenID++;
  }
}
