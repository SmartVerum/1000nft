// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

/**
 * @title 1000Token
 * @dev 1000 NFT Token.
 */
contract ThousandToken is ERC721, Ownable {
    using Strings for uint256;

    uint256 constant CUSTOMER_LIMIT = 5;
    uint256 constant SALE_LIMIT_0 = 50;
    uint256 constant SALE_LIMIT_1 = 150;
    uint256 constant SALE_LIMIT_2 = 650;
    uint256 constant SALE_LIMIT_3 = 950;
    uint256 constant TOKENS_LIMIT = 1000;

    string _uriPrefix;
    string _uriSuffix = ".json";
    uint256 _index = 0;

   /**
   * @dev Initializes token with given name, symbol and metadata URI prefix (defaulting the suffix to ".json").
   */
    constructor(string memory name, string memory symbol, string memory uriPrefix) ERC721(name, symbol) {
        _uriPrefix = uriPrefix;
    }

    /**
     * @dev Allows the owner to payout all ETH.
     */
    function payout() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Allows the owner to change format (prefix and suffix) used for producing token URI.
     */
    function setTokenURIFormat(string memory uriPrefix, string memory uriSuffix) public onlyOwner {
        _uriPrefix = uriPrefix;
        _uriSuffix = uriSuffix;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        if (bytes(_uriPrefix).length == 0) {
            return "";
        }

        return string(abi.encodePacked(_uriPrefix, tokenId.toString(), _uriSuffix));
    }

    /**
     * @dev Returns amount of minted tokens.
     */
    function mintedAmount() public view returns (uint256)
    {
        return _index;
    }

    /**
     * @dev Allows to buy token.
     */
    function buyToken() public payable returns (uint256) {
        require(_index < (TOKENS_LIMIT - 1), "ThousandToken: ...and it's gone!");
        require(balanceOf(msg.sender) < CUSTOMER_LIMIT, "ThousandToken: Reached limit of 5 tokens per customer");
        require(msg.value > 0 wei, "ThousandToken: Ethereum payment is required");

        if (_index < SALE_LIMIT_0) {
            require(msg.value >= 0.1 ether, "ThousandToken: Required at least 0.1 ETH");
        } else if (_index < SALE_LIMIT_1) {
            require(msg.value >= 0.25 ether, "ThousandToken: Required at least 0.25 ETH");
        } else if (_index < SALE_LIMIT_2) {
            require(msg.value >= 0.5 ether, "ThousandToken: Required at least 0.5 ETH");
        } else if (_index < SALE_LIMIT_3) {
            require(msg.value >= 1 ether, "ThousandToken: Required at least 1 ETH");
        } else {
            require(msg.value >= 2.5 ether, "ThousandToken: Required at least 2.5 ETH");
        }

        uint256 tokenId = _index;

        _mint(msg.sender, tokenId);

        _index += 1;

        return tokenId;
    }
}
