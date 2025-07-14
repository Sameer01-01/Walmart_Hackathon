// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EnergyMarketplace is ERC721, ReentrancyGuard, Ownable {
    struct EnergyPackage {
        uint256 id;
        address seller;
        uint256 price;
        uint256 energyAmount;
        bool renewable;
        uint256 validUntil;
        string optimizationMethod;
        bool active;
    }

    mapping(uint256 => EnergyPackage) public packages;
    uint256 private _nextPackageId;
    
    // Events
    event PackageListed(uint256 indexed packageId, address indexed seller, uint256 price);
    event PackageSold(uint256 indexed packageId, address indexed seller, address indexed buyer, uint256 price);
    event PackageUpdated(uint256 indexed packageId, uint256 newPrice);
    event PackageCancelled(uint256 indexed packageId);

    constructor() ERC721("EnergyPackage", "ENRG") {}

    function totalPackages() external view returns (uint256) {
        return _nextPackageId;
    }

    function listPackage(
        uint256 price,
        uint256 energyAmount,
        bool renewable,
        uint256 validityPeriod,
        string memory optimizationMethod
    ) external returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(energyAmount > 0, "Energy amount must be greater than 0");
        require(validityPeriod > 0, "Validity period must be greater than 0");
        require(bytes(optimizationMethod).length > 0, "Optimization method required");

        uint256 packageId = _nextPackageId++;
        
        packages[packageId] = EnergyPackage({
            id: packageId,
            seller: msg.sender,
            price: price,
            energyAmount: energyAmount,
            renewable: renewable,
            validUntil: block.timestamp + validityPeriod,
            optimizationMethod: optimizationMethod,
            active: true
        });

        _safeMint(msg.sender, packageId);
        
        emit PackageListed(packageId, msg.sender, price);
        return packageId;
    }

    function buyPackage(uint256 packageId) external payable nonReentrant {
        EnergyPackage storage package = packages[packageId];
        require(package.active, "Package is not active");
        require(block.timestamp < package.validUntil, "Package has expired");
        require(msg.value >= package.price, "Insufficient payment");
        require(msg.sender != package.seller, "Cannot buy own package");

        address seller = package.seller;
        uint256 price = package.price;

        package.active = false;
        
        _transfer(seller, msg.sender, packageId);
        
        payable(seller).transfer(price);
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit PackageSold(packageId, seller, msg.sender, price);
    }

    function updatePackagePrice(uint256 packageId, uint256 newPrice) external {
        require(_isApprovedOrOwner(msg.sender, packageId), "Not owner of package");
        require(packages[packageId].active, "Package is not active");
        require(newPrice > 0, "Price must be greater than 0");

        packages[packageId].price = newPrice;
        emit PackageUpdated(packageId, newPrice);
    }

    function cancelPackage(uint256 packageId) external {
        require(_isApprovedOrOwner(msg.sender, packageId), "Not owner of package");
        require(packages[packageId].active, "Package is not active");

        packages[packageId].active = false;
        emit PackageCancelled(packageId);
    }

    function getPackage(uint256 packageId) external view returns (
        address seller,
        uint256 price,
        uint256 energyAmount,
        bool renewable,
        uint256 validUntil,
        string memory optimizationMethod,
        bool active
    ) {
        EnergyPackage memory package = packages[packageId];
        return (
            package.seller,
            package.price,
            package.energyAmount,
            package.renewable,
            package.validUntil,
            package.optimizationMethod,
            package.active
        );
    }

    function getActivePackages() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _nextPackageId; i++) {
            if (packages[i].active) {
                count++;
            }
        }

        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _nextPackageId; i++) {
            if (packages[i].active) {
                activeIds[index] = i;
                index++;
            }
        }

        return activeIds;
    }
} 