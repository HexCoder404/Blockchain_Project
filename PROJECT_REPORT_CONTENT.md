# Project Report Content

## Recommended Project Title

**Blockchain-Based 7/12 Land Record System (Satbara Utara)**

Use this title in place of **“Chain Trace Supply Chain Management”** on the title page, certificate, approval sheet, table of contents, and declaration pages of the supplied report.

---

## Acknowledgement

We express our sincere gratitude to our project guide, **Prof. Bhagyashri Gawande**, for her guidance, valuable suggestions, and continuous encouragement during the development of this mini-project. Her feedback helped us understand the practical use of blockchain technology beyond cryptocurrency and apply it to a socially relevant problem.

We also thank the Department of Artificial Intelligence and Data Science, New Horizon Institute of Technology and Management, for providing the academic support and facilities required to complete this work. We are grateful to all faculty members, classmates, friends, and family members who supported us during the design, implementation, testing, and documentation of the project.

Finally, we acknowledge the open-source communities behind Ethereum, Solidity, Hardhat, OpenZeppelin, React, Ethers.js, IPFS, and Pinata. Their documentation and software libraries made it possible to build and validate this prototype.

---

## Abstract

The 7/12 extract, commonly known as *Satbara Utara*, is an important Record of Rights used in Maharashtra to represent information about agricultural land, its location, occupancy, area, and related entries. Conventional land-record systems depend on records maintained by authorized offices and centrally managed digital platforms. Although digitization improves access, a land record may still pass through several administrative stages during registration and mutation, making traceability, consistent authorization, document integrity, and independent verification important concerns.

This project presents a **Blockchain-Based 7/12 Land Record System** that models land registration and ownership mutation on an Ethereum-compatible blockchain. Its core is a Solidity smart contract named `LandRegistry`, which stores essential parcel data and enforces role-based actions for the Administrator, Talathi, Sub-Registrar, Bank, and Citizen. A parcel is assigned a deterministic identifier derived from its village, survey number, and subdivision number. The contract records its current owner, salted owner-name hash, area, land type, document Content Identifier (CID), status, encumbrance state, and ownership history. Transfer of ownership follows a controlled workflow consisting of seller initiation, buyer acceptance, Sub-Registrar approval, a 30-day objection period, and final certification by the Talathi. Disputed, frozen, or mortgaged parcels cannot proceed through the normal transfer workflow.

The system combines on-chain and off-chain storage. Sensitive survey maps and sale deeds are encrypted in the user’s browser using PBKDF2-derived AES-256-GCM encryption and uploaded through Pinata to IPFS. Only the resulting CID is stored on the blockchain. The owner’s legal name is represented on-chain by a salted Keccak-256 hash. A React and Vite frontend integrates MetaMask and Ethers.js to provide public land search, role-specific dashboards, printable 7/12 extracts, ownership-history display, QR-based record links, multilingual labels, and local cryptographic document verification.

The prototype was tested on the local Hardhat network with Chain ID 31337. All **11 automated smart-contract tests passed**. Measured Solidity coverage was **98.08% statements, 60% branches, 94.12% functions, and 97.01% lines**. The frontend also completed a production build successfully. These results show that blockchain, role-based smart contracts, encrypted IPFS storage, and wallet-signed transactions can be combined to produce a transparent and tamper-evident prototype for 7/12 land records. The system remains an academic prototype and is not a replacement for legally authoritative government land records.

**Keywords:** Blockchain, Land Registry, 7/12 Extract, Satbara Utara, Smart Contract, Ethereum, IPFS, AES-GCM, Mutation, Role-Based Access Control.

---

# Chapter 1: Introduction

## 1.1 Background

Land records are fundamental to ownership, agricultural administration, taxation, lending, inheritance, and dispute resolution. In Maharashtra, the 7/12 extract is a widely used Record of Rights associated with agricultural land. The state’s Mahabhumi services provide facilities related to digitally signed 7/12 extracts, 8A extracts, mutation records, property cards, archived records, and land maps. A typical search uses administrative and parcel details such as district, taluka, village, and survey or group number.

Digitizing a land record makes it easier to search and distribute, but digitization alone does not automatically produce a complete, independently auditable history. Registration, sale-deed approval, mutation, objections, mortgages, and dispute actions involve different participants. If all changes are maintained only in one centrally administered database, users must trust its administrators, security controls, backup processes, and audit logs. Unauthorized modification, inconsistent copies, missing historical entries, or weak authorization can reduce confidence in a land-record system.

Blockchain technology provides an append-only ledger in which confirmed transactions are cryptographically linked and replicated across participating nodes. An Ethereum smart contract is a program deployed at a blockchain address. It stores state and applies the same rules to every transaction. These properties are useful when multiple parties need a shared record of which action occurred, who authorized it, and in what order.

Storing every land document directly on a public blockchain is impractical because blockchain storage is expensive and transparent. This project therefore uses a hybrid design. Essential parcel fields, workflow state, ownership addresses, hashes, and IPFS references are maintained on-chain. Larger land documents are encrypted before being uploaded to IPFS through Pinata. IPFS uses content identifiers derived from content, so a modified encrypted file produces a different CID. The CID stored in the contract can consequently act as an integrity reference without placing the original document on-chain.

The developed application is named **Blockchain-Based 7/12 Land Record System (Satbara Utara)**. It is a decentralized-application prototype composed of a Solidity smart contract, a local Hardhat blockchain, a React web interface, MetaMask wallet integration, Ethers.js communication, browser-side cryptography, and IPFS document storage. The project translates a land-record workflow into explicit smart-contract states and role checks.

## 1.2 Problem Statement and Objectives

### Problem Statement

How can land-record registration and mutation be represented as a transparent, verifiable, and tamper-evident workflow in which only authorized participants can perform sensitive actions, while private documents and personal names are not stored in plain form on a public blockchain?

### Objectives

The objectives of this mini-project are:

1. To design a Solidity smart contract for registering and managing 7/12 land parcels.
2. To generate a unique parcel identifier from the village, survey number, and subdivision number.
3. To apply role-based access control for Administrator, Talathi, Sub-Registrar, Bank, and Citizen participants.
4. To implement a multi-stage mutation process involving the current owner, proposed buyer, Sub-Registrar, and Talathi.
5. To enforce a 30-day objection period before final mutation certification.
6. To prevent normal transfer of disputed, frozen, or mortgaged parcels.
7. To preserve a chronological on-chain ownership history for every registered parcel.
8. To encrypt survey maps and sale deeds before uploading them to IPFS and store only their CIDs on-chain.
9. To protect an owner’s legal name by storing a salted Keccak-256 hash instead of plain text.
10. To build role-aware React dashboards connected to MetaMask through Ethers.js.
11. To provide public 7/12 search, a printable extract, a QR verification link, and local document-integrity verification.
12. To validate the smart contract through automated tests and measure code coverage.

### Scope of the Project

The project demonstrates the technical feasibility of a blockchain-supported land-record workflow on a local development network. It covers parcel registration, status control, transfer initiation, buyer acceptance at contract level, registration approval, objections, rejection, mutation certification, ownership history, encrypted document references, public search, and document verification. It does not create a legally valid title, connect to official Maharashtra government databases, verify real-world identities, transfer actual money, or replace the legal duties of revenue and registration authorities.

---

# Chapter 2: Literature Review

## 2.1 Review of Related Work

### Zein and Twinomurinzi (2023): Blockchain Technology in Lands Registration

Zein and Twinomurinzi conducted a systematic review of blockchain use in land registration, particularly in lower-income countries. They found considerable interest in blockchain’s transparency and record-management capabilities but comparatively limited real-world implementation. They also identified institutional resistance, shortage of local blockchain skills, unclear consensus choices, and legal and sociotechnical concerns as significant adoption barriers. Their recommendation of incremental implementation is relevant to the present project, which treats blockchain as a prototype verification and workflow layer instead of claiming immediate replacement of a government land administration system.

### Gupta, Das, and Nandi (2019): LandLedger

LandLedger proposed a permissioned blockchain system for accountable and transparent land-property administration involving departments such as revenue, registration, and taxation authorities. It focused on property verification, registration, revocation, and efficient ownership-history checking. The work established that land administration is naturally multi-departmental and benefits from a shared, auditable transaction layer. The present project applies the same multi-party principle to a 7/12 mutation workflow but implements the prototype with an EVM-compatible Solidity contract and explicit Talathi and Sub-Registrar roles.

### Mukne, Pai, Raut, and Ambawade (2019): Hyperledger Fabric and IPFS

Mukne and co-authors combined a permissioned blockchain with IPFS for land-record management. Their design addressed the problem of maintaining a verifiable history while avoiding direct storage of large documents on the ledger. This hybrid pattern strongly influenced the storage architecture of the present project. Here, survey maps and sale deeds are encrypted in the browser, stored through Pinata on IPFS, and referenced from the Ethereum contract by CID.

### Borikar et al. (2023): Secure Digital Repository for Indian Land Records

Borikar and co-authors proposed a blockchain-based, securely shareable repository for the Indian revenue system. Their work emphasized inefficiencies arising from manual procedures, missing information, weak interdepartmental visibility, and long processing times. It supports the use of a blockchain ledger as an integrity and sharing layer for Indian land records. The present project narrows this broader problem to 7/12 parcel registration, controlled mutation, and verifiable encrypted documents.

### Shuaib et al. (2022): Identity Model for Blockchain-Based Land Registry

Shuaib and co-authors reviewed identity problems in blockchain land registries and compared identity models against relevant identity principles. Their review shows that secure identity and authorization remain central challenges even when records are placed on a blockchain. A wallet address alone does not prove a person’s legal identity. The present prototype uses wallet addresses and contract roles to demonstrate authorization but recognizes integration with government identity and credential systems as future work.

### Maharashtra Digital Land-Record Services

The official Mahabhumi portal demonstrates that Maharashtra already provides digital services for Record of Rights documents, including digitally signed 7/12 extracts, 8A extracts, mutation records, property cards, maps, and archived records. This is an important design context: the proposed project should be viewed as an experimental integrity and workflow model that could complement authorized digital services, subject to legal approval and integration, rather than as an informal substitute for them.

## 2.2 Research Gap and Summary

Existing research establishes the potential of blockchain to improve land-record integrity, transparency, and interdepartmental coordination. Several proposals use permissioned ledgers; others connect blockchain with IPFS to keep large documents off-chain. The literature also makes clear that identity, privacy, governance, legal authority, scalability, and user acceptance cannot be solved by blockchain alone.

This mini-project addresses a practical prototype gap by combining the following elements in one working repository:

- a data model tailored to 7/12 parcels through survey number, subdivision number, village, taluka, district, area, land type, encumbrance, and status;
- a deterministic parcel ID based on village and survey details;
- distinct Talathi, Sub-Registrar, Bank, Administrator, owner, and buyer responsibilities;
- a sequential mutation state machine with a mandatory objection interval;
- encrypted IPFS storage for land documents and sale deeds;
- hashed owner names for reduced on-chain disclosure;
- public record search, ownership history, printable extract, QR link, and local CID-based verification; and
- an automated Hardhat test suite that verifies successful and rejected workflows.

The contribution is therefore an integrated academic prototype tailored to the Maharashtra 7/12 context. It demonstrates how legal-administrative stages can be expressed as auditable smart-contract transitions while documenting the technical and institutional work still required for production adoption.

---

# Chapter 3: Implementation

## 3.1 System Architecture

The system follows a hybrid Web3 architecture with four main layers:

1. **Presentation layer:** React 18, Vite, Tailwind CSS, React Router, React i18next, and responsive role-specific pages.
2. **Blockchain interaction layer:** MetaMask provides the user account and signs transactions. Ethers.js v6 creates the provider, signer, and contract instance from the deployed address and ABI.
3. **Smart-contract layer:** `LandRegistry.sol`, compiled with Solidity 0.8.20 and executed on an EVM-compatible network, stores parcel state and enforces authorization and workflow rules.
4. **Document and privacy layer:** The Web Crypto API encrypts files; Pinata uploads the encrypted bytes to IPFS; the contract stores the CID. Owner names are salted and hashed before contract submission.

### Figure 3.1: Proposed System Architecture

Use the following flow to draw the architecture diagram in the report:

```text
Citizen / Talathi / Sub-Registrar
                |
                v
       React + Vite Web App
          /             \
         v               v
MetaMask + Ethers.js   Web Crypto API
         |             PBKDF2 + AES-GCM
         v               |
 Ethereum / Hardhat      v
 LandRegistry Contract  Pinata / IPFS
         ^               |
         |______ CID ____|
```

The frontend sends state-changing requests through MetaMask. Each accepted request becomes a blockchain transaction. Before a land document is uploaded, the browser derives an AES key from the entered password using PBKDF2 with SHA-256 and 100,000 iterations. It then encrypts the file with AES-256-GCM. The encrypted bytes are uploaded to IPFS, and the returned `ipfs://` CID is included in the contract call.

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Smart contract | Solidity 0.8.20 | Parcel data, roles, transfer rules, objections, and history |
| Contract libraries | OpenZeppelin AccessControl and ReentrancyGuard | Role authorization and protection against nested reentrant calls |
| Development network | Hardhat, Chain ID 31337 | Local compilation, deployment, testing, time manipulation, and demo accounts |
| Blockchain client | Ethers.js v6 | Contract reads, transactions, role checks, hashing, and provider access |
| Wallet | MetaMask | Account selection and transaction signing |
| Frontend | React 18 and Vite 5 | Component-based user interface and production build |
| Styling | Tailwind CSS | Responsive layout, dark mode, and print presentation |
| Storage | IPFS through Pinata | Off-chain storage of encrypted survey maps and sale deeds |
| Cryptography | Web Crypto API and Keccak-256 | AES-GCM file encryption and salted owner-name hashing |
| Localization | i18next | English, Marathi, and Gujarati interface labels |
| Verification | `ipfs-only-hash` and QR code | Local CID recomputation and shareable record link |

### Smart-Contract Data Model

Each parcel is stored in a `LandParcel` structure containing:

- survey number and subdivision number;
- village, taluka, and district;
- area in square metres;
- land type: Agricultural, Non-Agricultural, or Residential;
- current owner wallet address;
- salted hash of the owner’s legal name;
- IPFS CID of the encrypted property document;
- encumbrance: None or Mortgaged;
- status: Active, Disputed, or Frozen; and
- creation timestamp.

A `TransferRequest` contains the proposed buyer, encrypted sale-deed CID, price, transfer state, initiation time, and objection flag. The states are `None`, `Initiated`, `Accepted`, and `Registered`. Separate mappings associate a parcel with its record, owner with parcel IDs, parcel with ownership history, and parcel with its active transfer request.

### Parcel Identification

The contract calculates a parcel ID as:

```text
parcelId = keccak256(abi.encodePacked(village, surveyNumber, subNumber))
```

The frontend uses the same packed encoding and Keccak-256 operation during public search. A matching input therefore leads to the same `bytes32` parcel identifier used by the smart contract.

### Access Control and Security Controls

OpenZeppelin `AccessControl` provides `DEFAULT_ADMIN_ROLE`, `TALATHI_ROLE`, `SUB_REGISTRAR_ROLE`, and `BANK_ROLE`. The deployer initially receives the administrator role and may grant other roles. `registerLand` and `certifyMutation` are restricted to the Talathi role. `approveRegistration` is restricted to the Sub-Registrar. `freezeLand` is restricted to the administrator. A disputed status may be set by an administrator, Talathi, or Sub-Registrar.

The owner initiates a transfer, while only the buyer address fixed in the request may accept it. This prevents another wallet from replacing the intended buyer. State-changing workflow functions use `ReentrancyGuard`. Solidity 0.8.20 provides checked arithmetic. Custom errors reduce gas use and clearly represent rejected conditions such as `NotOwner`, `NotBuyer`, `ParcelAlreadyExists`, `InvalidTransferState`, `EncumbrancePresent`, and `ObjectionPresent`.

Privacy is reduced through data minimization. The legal owner name is not submitted as plain text; the system stores `keccak256(name + salt)`. Documents are encrypted before upload. However, wallet addresses, hashes, CIDs, parcel fields, workflow events, and timestamps remain visible to blockchain observers. The design therefore provides pseudonymity and encrypted content rather than complete anonymity.

## 3.2 Modules and Workflow

### Smart-Contract Functions

| Function | Authorized caller | Description |
|---|---|---|
| `getParcelId` | Public | Computes the deterministic parcel ID |
| `registerLand` | Talathi | Creates a new parcel and its initial ownership entry |
| `getLand` | Public | Returns stored parcel details |
| `getLandsByOwner` | Public view | Returns parcel IDs held by a wallet |
| `markDisputed` | Talathi, Sub-Registrar, or Admin | Marks a parcel as disputed |
| `freezeLand` | Admin | Freezes a parcel |
| `initiateTransfer` | Current owner | Creates a transfer request with buyer, price, and sale-deed CID |
| `acceptTransfer` | Named buyer | Accepts an initiated transfer |
| `approveRegistration` | Sub-Registrar | Approves an accepted sale registration |
| `fileObjection` | Any address | Records an objection during the 30-day window |
| `certifyMutation` | Talathi | Finalizes ownership after approval, time period, and objection checks |
| `rejectTransfer` | Talathi | Deletes the active transfer and emits a rejection reason CID |
| `getOwnershipHistory` | Public view | Returns the sequence of owner wallet addresses |
| `getTransferRequest` | Public view | Returns the active transfer state and details |

### Frontend Modules

| Module | Main capability |
|---|---|
| Landing page | Introduces the application and links to public search |
| Wallet context | Connects MetaMask, switches to Hardhat localhost, discovers roles, and tracks pending transactions |
| Public 7/12 search | Generates a parcel ID from village, survey number, and subdivision number |
| Citizen dashboard | Shows parcels owned by the connected wallet and starts a transfer with an encrypted sale deed |
| Talathi dashboard | Registers land with encrypted documents and certifies a mutation |
| Sub-Registrar dashboard | Approves an accepted sale-deed registration |
| Extract view | Displays parcel details, owner hash, status, ownership timeline, QR link, and print/PDF control |
| Document verification | Re-encrypts a supplied file locally, recomputes its CID, and compares it with the on-chain CID |
| Localization and theme | Provides English, Marathi, Gujarati, light, and dark interface options |

### End-to-End Mutation Workflow

| Step | Participant | Contract action | Result |
|---|---|---|---|
| 1 | Talathi | `registerLand` | Parcel is created as Active and assigned to its first owner |
| 2 | Current owner | `initiateTransfer` | Buyer, price, encrypted sale-deed CID, and timestamp are stored |
| 3 | Proposed buyer | `acceptTransfer` | Transfer state becomes Accepted |
| 4 | Sub-Registrar | `approveRegistration` | Transfer state becomes Registered |
| 5 | Citizen or concerned party | `fileObjection` | Objection flag is set if submitted within 30 days |
| 6A | Talathi | `certifyMutation` | After 30 days with no objection, ownership and owner hash are updated |
| 6B | Talathi | `rejectTransfer` | Active transfer is cancelled and a reason CID is emitted |

On successful mutation, the old owner’s parcel list is updated, the new owner receives the parcel, the new wallet address is appended to ownership history, and the transfer request is deleted. The contract emits events for registration, status changes, transfer initiation, buyer acceptance, Sub-Registrar approval, objections, rejection, and certification. These events provide an auditable transaction trail.

### Document-Verification Workflow

1. The verifier opens the blockchain-backed 7/12 extract.
2. The verifier selects the original local file and enters the upload password.
3. The browser repeats the same key derivation and encryption procedure used during upload.
4. `ipfs-only-hash` calculates the CID locally; the file is not uploaded again.
5. The calculated `ipfs://` CID is compared with the CID stored in the parcel record.
6. A match indicates that the selected file and password reproduce the encrypted object referenced on-chain. A mismatch indicates a different file, an incorrect password, or altered content.

---

# Chapter 4: Result Analysis

## 4.1 Testing, Coverage, and Demonstration

### Automated Smart-Contract Testing

The smart contract was compiled with Solidity 0.8.20 using optimization with 200 runs and tested with Hardhat, Mocha, and Chai. The test command was:

```text
npm test
```

All 11 tests passed.

| Test group | Cases | Result |
|---|---:|---|
| Deployment and role authorization | 2 | All passing |
| Land registration | 3 | All passing |
| Transfer workflow and objections | 4 | All passing |
| Status and encumbrance blocking | 2 | All passing |
| **Total** | **11** | **11 passing** |

The tests verify correct role assignment, rejection of unauthorized role grants, Talathi-only land registration, duplicate-registration prevention, successful end-to-end mutation, objection and rejection handling, enforcement of the 30-day waiting period, rejection of late objections, and blocking of transfers for disputed or frozen parcels.

### Code Coverage

Coverage was measured using `npx hardhat coverage`.

| Solidity file | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `LandRegistry.sol` | 98.08% | 60.00% | 94.12% | 97.01% |

The lower branch percentage indicates that several negative combinations and alternate authorization paths are not yet exercised even though almost all statements and lines execute during the current suite. The uncovered lines reported by the coverage tool are the return path of `getLandsByOwner` and one authorization branch in `markDisputed`. Additional tests should target all roles, non-existent parcels, invalid buyers, encumbered parcels, repeated actions, and every custom error.

### Gas Observations

Hardhat’s gas reporter produced the following average gas use for exercised state-changing functions:

| Function | Average gas observed |
|---|---:|
| `registerLand` | 347,604 |
| `initiateTransfer` | 168,948 |
| `certifyMutation` | 140,572 |
| `approveRegistration` | 60,320 |
| `acceptTransfer` | 60,092 |
| `fileObjection` | 54,572 |
| `rejectTransfer` | 51,036 |
| `markDisputed` | 50,201 |
| `freezeLand` | 50,160 |

These values were measured on the development environment and are not fixed transaction fees. Actual fees depend on the deployed network’s gas price and execution conditions. Registration and mutation certification use more gas because they write multiple parcel, owner-index, and history fields.

### Frontend Build Result

The command `npm run build` completed successfully with Vite. The generated JavaScript bundle was approximately 803.46 kB before gzip and 265.55 kB after gzip. Vite reported a bundle-size warning above 500 kB, which suggests future code splitting and lazy loading for improved startup performance. The warning did not prevent a successful production build.

### Demonstration Procedure

The application can be demonstrated locally as follows:

1. Start a Hardhat node and deploy `LandRegistry.sol` to `http://127.0.0.1:8545` using Chain ID 31337.
2. The deployment script grants the deployer the Talathi, Sub-Registrar, and Bank roles and seeds five demo parcels in Pune, Mumbai, Nagpur, Nashik, and Thane.
3. Start the Vite frontend and connect MetaMask to the Hardhat localhost network.
4. Use the Talathi dashboard to register a parcel. The selected document is encrypted, uploaded to IPFS, and its CID is submitted with the parcel data.
5. Search for the parcel using the public search page and open its 7/12 extract.
6. Connect as the current owner and initiate a sale by selecting a buyer, price, document, and password.
7. Use the intended buyer account to call `acceptTransfer`; then use the Sub-Registrar dashboard to approve registration.
8. Advance the local blockchain time by more than 30 days for demonstration and certify the mutation as the Talathi when no objection exists.
9. Reopen the extract to confirm the new owner and appended ownership-history entry.
10. Upload the original land document and enter the correct password in the verification component. A matching CID produces a successful integrity result.

### Screenshots to Insert

Replace the supply-chain screenshots in the supplied PDF with screenshots from this project and use these captions:

- **Fig. 4.1:** Landing Page of the Blockchain-Based 7/12 Land Record System
- **Fig. 4.2:** Public 7/12 Search Using Village and Survey Details
- **Fig. 4.3:** Citizen Dashboard Showing Blockchain-Based Land Holdings
- **Fig. 4.4:** Talathi Dashboard for Encrypted Land Registration
- **Fig. 4.5:** Sub-Registrar Dashboard for Sale-Deed Approval
- **Fig. 4.6:** Blockchain-Verified Village Form 7/12 Extract
- **Fig. 4.7:** Ownership and Mutation History of a Parcel
- **Fig. 4.8:** Successful Cryptographic Document Verification

### Discussion of Results

The results confirm that the smart contract enforces the main land-workflow rules independently of the frontend. A non-Talathi account cannot register a parcel; duplicate identifiers are rejected; only the current owner can initiate a transfer; only the selected buyer can accept it; and only the Sub-Registrar can approve registration. Mutation certification cannot occur before the waiting period and cannot succeed when an objection is present. A disputed or frozen parcel fails the transferability check.

The hybrid storage design also behaves as intended at prototype level. The blockchain stores compact parcel and workflow data, while document bytes remain outside the contract. Local CID recomputation provides a practical integrity check: changing the file or password changes the encrypted result and therefore the CID. Ownership history is stored as an ordered list of wallet addresses, allowing the extract page to show the current and previous owners without relying on a separate application database.

The evaluation also identifies practical trade-offs. Blockchain writes require gas and user signatures. Public blockchain metadata is visible. IPFS availability depends on continued pinning. Wallet addresses do not independently establish legal identity. Browser-based password handling places responsibility on the user, and a lost password prevents decryption. The prototype therefore demonstrates integrity, authorization logic, and traceability but does not by itself solve legal title, identity proofing, data correctness at entry, or long-term institutional governance.

---

# Chapter 5: Conclusion

## 5.1 Conclusion, Limitations, and Future Scope

### Conclusion

The Blockchain-Based 7/12 Land Record System demonstrates how an Ethereum-compatible smart contract can represent registration and mutation of land parcels as a transparent and auditable sequence of authorized actions. The system assigns deterministic parcel identifiers, records core 7/12 fields, preserves ownership history, restricts administrative functions by role, and prevents transfer of parcels whose state is unsuitable for sale. Its mutation process requires seller initiation, buyer acceptance, Sub-Registrar approval, expiry of the objection period, and Talathi certification before ownership changes.

The project also demonstrates a practical division between blockchain and document storage. Encrypted survey maps and sale deeds are stored on IPFS, while their CIDs provide content-integrity references on-chain. Salted hashes reduce exposure of owner names, and the verification module allows a user to recompute a CID locally. The React interface makes these operations accessible through MetaMask and includes public search, printable extracts, ownership history, QR links, multilingual labels, and role-specific dashboards.

All 11 Solidity tests passed, and the measured coverage was 98.08% statements and 97.01% lines. These results provide confidence in the principal paths of the prototype. The project supports the conclusion that blockchain can strengthen traceability and make unauthorized retrospective changes easier to detect. It does not establish that blockchain records are automatically legally correct: trusted authorities must still verify identities, documents, survey data, and legal eligibility before submitting transactions.

### Limitations

1. The current deployment and interface are configured primarily for the local Hardhat network. Sepolia configuration is present, but a production government deployment has not been completed.
2. The prototype has no legal integration with Mahabhumi, the Revenue Department, the Registration and Stamps Department, courts, banks, cadastral maps, Aadhaar, or other authorized identity services.
3. Buyer acceptance, objection filing, transfer rejection, dispute marking, and freezing exist in the smart contract but do not yet have complete dedicated frontend workflows. The Bank role is detected, but its dashboard and mortgage-management functions are incomplete.
4. The contract defines an encumbrance field, but it currently has no function for an authorized bank to add or remove a mortgage.
5. Wallet possession is treated as control of an account; it does not prove the legal identity of the person operating that wallet.
6. The frontend asks for district and taluka during public search, but the parcel ID is computed only from village, survey number, and subdivision number. Duplicate village names across administrative areas could require a stronger canonical identifier.
7. On-chain parcel data, wallet addresses, events, CIDs, and timestamps are public. Hashing a name reduces disclosure but does not guarantee anonymity, especially if the name and salt can be guessed or leaked.
8. The key-derivation code uses a fixed application salt and a password supplied by the user. The encryption design is suitable for demonstration but should undergo professional cryptographic review before real use.
9. The Pinata token is accessed from a Vite environment variable in browser code. A production design should use scoped credentials or a secure backend upload service so a long-lived secret is not delivered to clients.
10. IPFS content remains available only while it is pinned or otherwise provided. Long-term archival policy and redundant institutional pinning are required.
11. The owner-to-parcel list is updated by a linear search during mutation. Large-scale deployment would need indexing and performance optimization.
12. Branch coverage is 60%, so more negative and boundary tests are required. A formal smart-contract security audit has not been performed.

### Future Scope

1. Deploy the contract to Sepolia for public demonstration, then evaluate a permissioned EVM consortium operated by authorized departments for real institutional use.
2. Integrate verifiable government credentials and department-managed wallets so an on-chain address can be connected to a legally recognized role and identity.
3. Add complete frontend workflows for buyer acceptance, public objections, Talathi rejection, dispute management, freezing, role administration, and transaction-status tracking.
4. Implement Bank-role functions to add and clear mortgage encumbrances, with an auditable approval process and possible linkage to authorized lending or CERSAI systems.
5. Use a canonical parcel identifier that includes district, taluka, village code, survey or Gat number, subdivision, and where available ULPIN.
6. Replace user-managed document passwords with a reviewed key-management design such as institutional KMS, hardware-backed keys, attribute-based encryption, or threshold access control.
7. Move Pinata authorization to a secure server or issue short-lived scoped upload credentials. Establish redundant pinning and archival retention policies.
8. Add The Graph or another event indexer for fast search, filters, dashboards, and history retrieval at large scale.
9. Introduce QR-based field verification, mobile-wallet support, notifications, Marathi-first forms, and accessibility testing.
10. Add GIS and cadastral-map integration to visualize parcel boundaries and detect conflicting registrations.
11. Expand the test suite to cover all custom errors and branches, add frontend integration tests, perform fuzz and invariant testing, and commission an independent security audit.
12. Evaluate legal admissibility, privacy compliance, disaster recovery, governance, upgrade procedures, account recovery, user acceptance, and operating cost through a controlled pilot with public authorities.

---

# References

[1] Settlement Commissioner and Director of Land Records, Government of Maharashtra, “Mahabhumi: Portal for Land Records Services.” Available: https://mahabhumi.gov.in/Mahabhumilink/

[2] Ethereum Foundation, “Introduction to Smart Contracts.” Available: https://ethereum.org/developers/docs/smart-contracts/

[3] IPFS Documentation, “Content Identifiers (CIDs).” Available: https://docs.ipfs.tech/concepts/content-addressing/

[4] IPFS Documentation, “Privacy and Encryption.” Available: https://docs.ipfs.tech/concepts/privacy-and-encryption/

[5] OpenZeppelin, “Access Control,” OpenZeppelin Contracts Documentation. Available: https://docs.openzeppelin.com/contracts/5.x/access-control

[6] OpenZeppelin, “ReentrancyGuard,” OpenZeppelin Contracts Documentation. Available: https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard

[7] R. M. Zein and H. Twinomurinzi, “Blockchain Technology in Lands Registration: A Systematic Literature Review,” *eJournal of eDemocracy and Open Government*, vol. 15, no. 2, pp. 1–36, 2023. doi: 10.29379/jedem.v15i2.748.

[8] N. Gupta, M. L. Das, and S. Nandi, “LandLedger: Blockchain-Powered Land Property Administration System,” in *2019 IEEE International Conference on Advanced Networks and Telecommunications Systems (ANTS)*, pp. 1–6, 2019. doi: 10.1109/ANTS47819.2019.9118125.

[9] H. Mukne, P. Pai, S. Raut, and D. Ambawade, “Land Record Management using Hyperledger Fabric and IPFS,” in *2019 10th International Conference on Computing, Communication and Networking Technologies (ICCCNT)*, 2019. doi: 10.1109/ICCCNT45670.2019.8944471.

[10] D. A. Borikar, P. Ekbote, A. Shete, S. Agrawal, and S. Ahmed, “Towards a Secure and Reliable Digital Repository for Land Records in India: A Blockchain-Based Approach,” in *2023 OITS International Conference on Information Technology (OCIT)*, 2023. doi: 10.1109/OCIT59427.2023.10431340.

[11] M. Shuaib, N. H. Hassan, S. Usman, S. Alam, S. Bhatia, D. Koundal, A. Mashat, and A. Belay, “Identity Model for Blockchain-Based Land Registry System: A Comparison,” *Wireless Communications and Mobile Computing*, vol. 2022, Article 5670714, 2022. doi: 10.1155/2022/5670714.

[12] P. D. Ameyaw and W. T. de Vries, “Toward Smart Land Management: Land Acquisition and the Associated Challenges in Ghana. A Look into a Blockchain Digital Land Registry for Prospects,” *Land*, vol. 10, no. 3, Article 239, 2021. doi: 10.3390/land10030239.

---

## Final Editing Notes

- Keep the existing student names, IEN numbers, institute name, academic year, guide name, certificate, approval sheet, and declaration only after checking that they belong to your group.
- Replace every occurrence of the old supply-chain title and terminology.
- Update the table of contents after pasting the text into Word.
- Insert only screenshots captured from the current land-registry application.
- Add the actual deployed contract address and network only if you perform that deployment.
- Describe the system as an academic prototype, not as an authorized government record service.
