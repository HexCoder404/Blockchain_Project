# Architecture & Project Documentation

## 🏗️ System Architecture
The application follows a standard Web3 dApp architecture with enhanced cryptographic security for privacy:

```mermaid
graph TD
    A[Citizen / Admin UI (React + Tailwind)] -->|Web Crypto API| B[Client-Side Encryption (AES-GCM)]
    A -->|Ethers.js RPC| C[Ethereum Blockchain / Sepolia]
    B -->|Encrypted Blob| D[Pinata IPFS]
    D -.->|Returns CID| A
    A -->|Store CID & NameHash| C
    
    style A fill:#e5ebd9,stroke:#647b3d
    style B fill:#fef3c7,stroke:#d97706
    style C fill:#dbeafe,stroke:#2563eb
    style D fill:#fce7f3,stroke:#db2777
```

## 🔄 User Flow (Mutation/Transfer Workflow)
1. **Talathi Registration**: Talathi logs in, uploads an encrypted Survey Map to IPFS, salts & hashes the owner's name, and registers the property (Genesis block).
2. **Owner Initiation**: The current owner of the land goes to the Citizen Dashboard, enters the buyer's wallet and price, uploads an encrypted Sale Deed, and initiates the transfer (Step 1).
3. **Buyer Acceptance**: Buyer logs in and accepts the transfer (Step 2).
4. **Sub-Registrar Approval**: The Sub-Registrar reviews the offline/legal parameters, logs in, and approves the Registration on-chain (Step 3).
5. **30-Day Objection Period**: A mandatory 30-day window begins where anyone can file an objection.
6. **Talathi Certification**: Once 30 days pass with no objections, the Talathi certifies the mutation (Step 4). Ownership is permanently transferred, and the `ownershipHistory` array is appended.

## 🛡️ Security Posture
- **Reentrancy**: Mitigated using OpenZeppelin `ReentrancyGuard` (`nonReentrant` modifier on all state changes).
- **Access Control**: Mitigated via OZ `AccessControl`. Every dashboard route and contract function is strictly bound to `TALATHI_ROLE`, `SUB_REGISTRAR_ROLE`, etc.
- **Front-Running**: The `initiateTransfer` function strictly binds the `buyer` address into the state. Only that specific wallet can call `acceptTransfer`, eliminating front-running hijacking.
- **Integer Issues**: Solved natively by Solidity `^0.8.20`.
- **Zero-Knowledge Privacy**: Only CIDs of AES-GCM symmetrically encrypted documents and `keccak256` salted hashes of names are stored on the public ledger.

## 🚀 Exact Verification Workflow (Manual Testing Guide)

### Step 1: Start the Local Blockchain & Deploy
Open a terminal and run the local Hardhat node:
```bash
cd contracts
npm run node
```
Open a **second** terminal, and deploy the contracts (this will also seed 5 properties and setup your deployer account with ALL roles):
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Step 2: Start the React Frontend
In a **third** terminal:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 3: Connect MetaMask
1. Open your MetaMask extension.
2. Add a custom network for Hardhat:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import the first Hardhat account private key (found in Terminal 1 output) into MetaMask. This account is the "Deployer" and holds all the demo lands and admin roles.
4. Click **Connect Wallet** in the React app.

### Step 4: Test the Roles and Transfers
1. Navigate to the **Citizen Dashboard**. You will see the 5 seeded lands.
2. Click **Sell / Transfer Land** on one of them.
3. Put a random dummy buyer address (e.g., `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).
4. Upload any dummy PDF and enter a password to test the IPFS encryption. Submit the transaction.
5. Watch the Card update to "Active Transfer (Step 1)".
6. (Optional) Switch your MetaMask to the buyer's account to accept it, then back to the Sub-Registrar to approve it!

### Step 5: Test the Cryptographic Verification
1. Click the Document/Extract icon on any of your lands to view the Form 7/12 Extract.
2. Scroll to the bottom to the **Cryptographic Verification** section.
3. Upload the exact same dummy PDF you uploaded earlier, and enter the same password.
4. Click Verify. You will see a green success message proving the local encrypted hash matches the blockchain CID!

---

## 🌍 Vercel Deployment & Etherscan Verification

### Deploying to Vercel
1. Install the Vercel CLI: `npm i -g vercel`
2. Navigate to the frontend: `cd frontend`
3. Run `vercel` and follow the prompts.
4. When asked to set environment variables, ensure you provide:
   - `VITE_PINATA_JWT="your_actual_jwt_here"`

### Verifying on Etherscan (Sepolia)
Once you deploy your contract to Sepolia using `npx hardhat run scripts/deploy.js --network sepolia`, you can verify the source code on Etherscan:
1. Get an API key from Etherscan.io.
2. Add `ETHERSCAN_API_KEY="your_api_key"` to your `contracts/.env`.
3. Update `hardhat.config.js` to include the Etherscan config:
```javascript
etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY
}
```
4. Run:
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

## 🔮 Limitations & Future Scope
- **Key Management**: Currently, the AES encryption relies on user-memorized passwords. In a production environment, a decentralized KMS (Key Management System) or Lit Protocol should be used for threshold cryptography access control.
- **Role Revocation Flow**: Building a UI for the Admin to easily revoke Talathi roles if a private key is compromised.
- **Indexer**: Relying purely on RPC calls (`getLandsByOwner`) is slow at massive scale. Integrating The Graph (subgraphs) would allow instantaneous, complex relational queries (e.g., "Find all disputed lands in Pune").
