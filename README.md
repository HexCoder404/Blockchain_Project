# Blockchain-based 7/12 Land Record System (Satbara Utara)

A decentralized application for managing 7/12 land records transparently and securely using Ethereum/EVM-compatible blockchain technology.

## 📂 Project Structure (Monorepo)

- `/contracts`: Hardhat environment for Solidity smart contracts.
- `/frontend`: React + Vite frontend application interacting with the blockchain.

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Install Dependencies
Navigate to the root directory and install all dependencies (this uses npm workspaces to install for both `contracts` and `frontend`):

```bash
npm install
```

### 2. Smart Contracts Setup

Navigate to the `contracts` directory:
```bash
cd contracts
```

Configure your environment variables (the `.env` file is already created for you in this directory):
```env
# Edit contracts/.env with your real Alchemy/Infura RPC URL and Private Key
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
PRIVATE_KEY="your_private_key_here"
```

Run a local Hardhat node:
```bash
npm run node
```

In a separate terminal, deploy the contracts (once written) to the local node:
```bash
npm run deploy:local
```

### 3. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

Start the Vite development server:
```bash
npm run dev
```

## 🗺️ Roadmap

### Phase 1: Architecture & Setup
- [x] Define monorepo structure.
- [x] Configure Hardhat environment with OpenZeppelin & Ethers.
- [x] Set up React + Vite + Tailwind frontend.

### Phase 2: Smart Contract Development
- [ ] Write `LandRegistry.sol` to represent land records (Survey No, Owner, Area, Encumbrances).
- [ ] Implement Role-Based Access Control (RBAC) - e.g., Talathi/Admin roles for minting/updating records.
- [ ] Write unit tests for contract functionality.
- [ ] Deploy to local node and Sepolia testnet.

### Phase 3: Frontend Integration
- [ ] Build UI components using Tailwind CSS (Dashboard, View Record, Add Record).
- [ ] Integrate ethers.js to communicate with the deployed smart contract.
- [ ] Implement Metamask wallet connection.
- [ ] Fetch and display 7/12 document data from the blockchain.

### Phase 4: Advanced Features & Polish
- [ ] Store metadata/documents (e.g., actual PDF scans) on IPFS (using Pinata/Web3.Storage).
- [ ] Implement event listeners to show real-time updates of land record transfers.
- [ ] Audit smart contracts for security vulnerabilities.
- [ ] Deploy frontend to Vercel/Netlify.
