//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

error ScribeVerseNft__OnlyCreator();

contract ScribeVerseNft is ERC1155, IERC2981, Ownable {
    struct RoyaltyReceiver {
        address creator;
        uint16 royaltyBps;
    }

    uint256 private _currentTokenID;
    uint16 private constant MAX_ROYALTY_BPS = 1000;

    // Contract name
    string public name;
    // Contract symbol
    string public symbol;

    mapping(uint256 => RoyaltyReceiver) internal royalties;
    mapping(uint256 => address) public creators;

    event TokenRoyaltySet(uint256 tokenId, address creator, uint16 royaltyBps);

    /**
     * @dev Require msg.sender to be the creator of the token id
     */
    modifier onlyCreator(uint256 _tokenId) {
        if (creators[_tokenId] != _msgSender()) revert ScribeVerseNft();
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

    /**
     * @dev Define the fee for the token specify
     * @param _tokenId uint256 token ID to specify
     * @param _royaltyBps amount of Royalty fee in bps (1% == 100)
     */
    function resetTokenRoyalty(uint256 _tokenId, uint16 _royaltyBps)
        external
        onlyCreator(_tokenId)
    {
        royalties[_tokenId] = RoyaltyReceiver(_msgSender(), _royaltyBps);
        emit TokenRoyaltySet(_tokenId, _msgSender(), _royaltyBps);
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Allow any user to mint token
     * @param _royaltyBps amount of fee in bps (1% == 100)
     */
    function mint(bytes memory data, uint16 _royaltyBps) external {
        uint256 _tokenId = _getNextTokenID();
        _mint(_msgSender(), _tokenId, 1, data);
        creators[_tokenId] = _msgSender();
        royalties[_tokenId] = RoyaltyReceiver({creator: _msgSender(), royaltyBps: _royaltyBps});
        _incrementTokenTypeId();
    }

    function mintBatch(
        address to,
        uint256[] memory _tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, _tokenIds, amounts, data);
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
