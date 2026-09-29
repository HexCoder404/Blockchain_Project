// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandRegistry
 * @dev Manages 7/12 Land Records (Satbara Utara) using Role-Based Access Control and multi-step transfers.
 */
contract LandRegistry is AccessControl, ReentrancyGuard {
    // --- Roles ---
    bytes32 public constant TALATHI_ROLE = keccak256("TALATHI_ROLE");
    bytes32 public constant SUB_REGISTRAR_ROLE = keccak256("SUB_REGISTRAR_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");

    // --- Enums ---
    enum LandType { Agricultural, NA, Residential }
    enum Encumbrance { None, Mortgaged }
    enum Status { Active, Disputed, Frozen }
    enum TransferState { None, Initiated, Accepted, Registered }

    // --- Structs ---
    struct LandParcel {
        uint256 surveyNumber;
        uint256 subNumber;
        string village;
        string taluka;
        string district;
        uint256 areaSqM;
        LandType landType;
        address currentOwner;
        bytes32 ownerNameHash;
        string documentCID;
        Encumbrance encumbrance;
        Status status;
        uint256 createdAt;
    }

    struct TransferRequest {
        address buyer;
        string saleDeedCID;
        uint256 price;
        TransferState state;
        uint256 initiatedAt;
        bool hasObjection;
    }

    // --- State Variables ---
    mapping(bytes32 => LandParcel) private _parcels;
    mapping(address => bytes32[]) private _ownerParcels;
    mapping(bytes32 => address[]) private _ownershipHistory;
    mapping(bytes32 => TransferRequest) private _transfers;

    // --- Events ---
    event LandRegistered(bytes32 indexed parcelId, uint256 surveyNumber, uint256 subNumber, string village, address indexed owner);
    event LandStatusChanged(bytes32 indexed parcelId, Status newStatus);
    
    event TransferInitiated(bytes32 indexed parcelId, address indexed seller, address indexed buyer, uint256 price);
    event TransferAccepted(bytes32 indexed parcelId, address indexed buyer);
    event RegistrationApproved(bytes32 indexed parcelId, address indexed subRegistrar);
    event ObjectionFiled(bytes32 indexed parcelId, address indexed objector, string reasonCID);
    event TransferRejected(bytes32 indexed parcelId, address indexed talathi, string reasonCID);
    event MutationCertified(bytes32 indexed parcelId, address indexed oldOwner, address indexed newOwner);

    // --- Custom Errors ---
    error ParcelAlreadyExists(bytes32 parcelId);
    error ParcelDoesNotExist(bytes32 parcelId);
    error UnauthorizedAccount(address account);
    error NotOwner();
    error NotBuyer();
    error InvalidTransferState();
    error EncumbrancePresent();
    error InvalidStatus();
    error ObjectionPeriodActive();
    error ObjectionPeriodExpired();
    error ObjectionPresent();

    /**
     * @dev Modifier to check if a parcel is transferable (exists, active, and unencumbered).
     */
    modifier isTransferable(bytes32 parcelId) {
        LandParcel memory parcel = _parcels[parcelId];
        if (parcel.createdAt == 0) revert ParcelDoesNotExist(parcelId);
        if (parcel.status != Status.Active) revert InvalidStatus();
        if (parcel.encumbrance != Encumbrance.None) revert EncumbrancePresent();
        _;
    }

    /**
     * @dev Constructor sets up the admin role for the deployer.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Internal helper to remove a parcel from an owner's list.
     */
    function _removeOwnerParcel(address owner, bytes32 parcelId) internal {
        bytes32[] storage parcels = _ownerParcels[owner];
        for (uint256 i = 0; i < parcels.length; i++) {
            if (parcels[i] == parcelId) {
                parcels[i] = parcels[parcels.length - 1];
                parcels.pop();
                break;
            }
        }
    }

    /**
     * @dev Generates a unique ID for a land parcel.
     */
    function getParcelId(
        string memory village,
        uint256 surveyNumber,
        uint256 subNumber
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(village, surveyNumber, subNumber));
    }

    /**
     * @notice Registers a new land parcel.
     */
    function registerLand(
        uint256 surveyNumber,
        uint256 subNumber,
        string memory village,
        string memory taluka,
        string memory district,
        uint256 areaSqM,
        LandType landType,
        address currentOwner,
        bytes32 ownerNameHash,
        string memory documentCID
    ) external onlyRole(TALATHI_ROLE) {
        bytes32 parcelId = getParcelId(village, surveyNumber, subNumber);

        if (_parcels[parcelId].createdAt != 0) revert ParcelAlreadyExists(parcelId);

        _parcels[parcelId] = LandParcel({
            surveyNumber: surveyNumber,
            subNumber: subNumber,
            village: village,
            taluka: taluka,
            district: district,
            areaSqM: areaSqM,
            landType: landType,
            currentOwner: currentOwner,
            ownerNameHash: ownerNameHash,
            documentCID: documentCID,
            encumbrance: Encumbrance.None,
            status: Status.Active,
            createdAt: block.timestamp
        });

        _ownerParcels[currentOwner].push(parcelId);
        _ownershipHistory[parcelId].push(currentOwner);

        emit LandRegistered(parcelId, surveyNumber, subNumber, village, currentOwner);
    }

    /**
     * @notice Retrieves details of a specific land parcel.
     */
    function getLand(bytes32 parcelId) external view returns (LandParcel memory) {
        if (_parcels[parcelId].createdAt == 0) revert ParcelDoesNotExist(parcelId);
        return _parcels[parcelId];
    }

    /**
     * @notice Retrieves all parcel IDs owned by a specific address.
     */
    function getLandsByOwner(address owner) external view returns (bytes32[] memory) {
        return _ownerParcels[owner];
    }

    /**
     * @notice Marks a land parcel as disputed.
     */
    function markDisputed(bytes32 parcelId) external {
        if (!hasRole(TALATHI_ROLE, msg.sender) && !hasRole(SUB_REGISTRAR_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccount(msg.sender);
        }
        if (_parcels[parcelId].createdAt == 0) revert ParcelDoesNotExist(parcelId);

        _parcels[parcelId].status = Status.Disputed;
        
        emit LandStatusChanged(parcelId, Status.Disputed);
    }

    /**
     * @notice Freezes a land parcel to prevent further actions.
     */
    function freezeLand(bytes32 parcelId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_parcels[parcelId].createdAt == 0) revert ParcelDoesNotExist(parcelId);

        _parcels[parcelId].status = Status.Frozen;
        
        emit LandStatusChanged(parcelId, Status.Frozen);
    }

    // --- Transfer Workflow (Mutation) ---

    /**
     * @notice (Step 1) Owner initiates a transfer of the land parcel.
     */
    function initiateTransfer(
        bytes32 parcelId, 
        address buyer, 
        string memory saleDeedCID, 
        uint256 price
    ) external nonReentrant isTransferable(parcelId) {
        if (_parcels[parcelId].currentOwner != msg.sender) revert NotOwner();
        if (_transfers[parcelId].state != TransferState.None) revert InvalidTransferState();

        _transfers[parcelId] = TransferRequest({
            buyer: buyer,
            saleDeedCID: saleDeedCID,
            price: price,
            state: TransferState.Initiated,
            initiatedAt: block.timestamp,
            hasObjection: false
        });

        emit TransferInitiated(parcelId, msg.sender, buyer, price);
    }

    /**
     * @notice (Step 2) Buyer accepts the transfer request.
     */
    function acceptTransfer(bytes32 parcelId) external nonReentrant isTransferable(parcelId) {
        TransferRequest storage request = _transfers[parcelId];
        if (request.buyer != msg.sender) revert NotBuyer();
        if (request.state != TransferState.Initiated) revert InvalidTransferState();

        request.state = TransferState.Accepted;
        emit TransferAccepted(parcelId, msg.sender);
    }

    /**
     * @notice (Step 3) Sub-Registrar approves the registration of the sale deed.
     */
    function approveRegistration(bytes32 parcelId) external nonReentrant isTransferable(parcelId) onlyRole(SUB_REGISTRAR_ROLE) {
        TransferRequest storage request = _transfers[parcelId];
        if (request.state != TransferState.Accepted) revert InvalidTransferState();

        request.state = TransferState.Registered;
        emit RegistrationApproved(parcelId, msg.sender);
    }

    /**
     * @notice Files an objection to an ongoing transfer within the 30-day window.
     */
    function fileObjection(bytes32 parcelId, string memory reasonCID) external nonReentrant {
        TransferRequest storage request = _transfers[parcelId];
        if (request.state == TransferState.None) revert InvalidTransferState();
        if (block.timestamp > request.initiatedAt + 30 days) revert ObjectionPeriodExpired();

        request.hasObjection = true;
        emit ObjectionFiled(parcelId, msg.sender, reasonCID);
    }

    /**
     * @notice (Step 4) Talathi certifies the mutation, finalizing the transfer.
     */
    function certifyMutation(bytes32 parcelId, bytes32 newOwnerNameHash) external nonReentrant isTransferable(parcelId) onlyRole(TALATHI_ROLE) {
        TransferRequest storage request = _transfers[parcelId];
        if (request.state != TransferState.Registered) revert InvalidTransferState();
        if (block.timestamp < request.initiatedAt + 30 days) revert ObjectionPeriodActive();
        if (request.hasObjection) revert ObjectionPresent();

        address oldOwner = _parcels[parcelId].currentOwner;
        address newOwner = request.buyer;

        // Update ownership
        _parcels[parcelId].currentOwner = newOwner;
        _parcels[parcelId].ownerNameHash = newOwnerNameHash;
        
        // Update Owner Arrays
        _removeOwnerParcel(oldOwner, parcelId);
        _ownerParcels[newOwner].push(parcelId);
        
        // Update History
        _ownershipHistory[parcelId].push(newOwner);

        // Reset Transfer State
        delete _transfers[parcelId];

        emit MutationCertified(parcelId, oldOwner, newOwner);
    }

    /**
     * @notice Talathi rejects the transfer, usually due to an objection.
     */
    function rejectTransfer(bytes32 parcelId, string memory reasonCID) external nonReentrant onlyRole(TALATHI_ROLE) {
        TransferRequest storage request = _transfers[parcelId];
        if (request.state == TransferState.None) revert InvalidTransferState();
        
        delete _transfers[parcelId];
        
        emit TransferRejected(parcelId, msg.sender, reasonCID);
    }

    /**
     * @notice Returns the full ownership history of a land parcel.
     */
    function getOwnershipHistory(bytes32 parcelId) external view returns (address[] memory) {
        return _ownershipHistory[parcelId];
    }

    /**
     * @notice Returns the active transfer request for a land parcel.
     */
    function getTransferRequest(bytes32 parcelId) external view returns (TransferRequest memory) {
        return _transfers[parcelId];
    }
}
