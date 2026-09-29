const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`LandRegistry deployed to: ${contractAddress}`);

  // Setup roles
  console.log("Setting up roles...");
  const TALATHI_ROLE = await landRegistry.TALATHI_ROLE();
  const SUB_REGISTRAR_ROLE = await landRegistry.SUB_REGISTRAR_ROLE();
  const BANK_ROLE = await landRegistry.BANK_ROLE();

  await landRegistry.grantRole(TALATHI_ROLE, deployer.address);
  await landRegistry.grantRole(SUB_REGISTRAR_ROLE, deployer.address);
  await landRegistry.grantRole(BANK_ROLE, deployer.address);

  // Seed 5 demo land records
  console.log("Seeding 5 demo land records...");
  const parseBytes32String = ethers.encodeBytes32String;
  const demoData = [
    { s: 101, sub: 1, v: "Pune", t: "Haveli", d: "Pune", area: 2000, type: 0 },
    { s: 102, sub: 2, v: "Mumbai", t: "Andheri", d: "Mumbai Suburban", area: 1500, type: 2 },
    { s: 103, sub: 1, v: "Nagpur", t: "Nagpur Rural", d: "Nagpur", area: 3000, type: 0 },
    { s: 104, sub: 5, v: "Nashik", t: "Nashik", d: "Nashik", area: 1200, type: 1 },
    { s: 105, sub: 1, v: "Thane", t: "Thane", d: "Thane", area: 2500, type: 2 },
  ];

  for (let i = 0; i < demoData.length; i++) {
    const d = demoData[i];
    await landRegistry.registerLand(
      d.s, d.sub, d.v, d.t, d.d, d.area, d.type,
      deployer.address, parseBytes32String("Demo Owner " + i), "ipfs://Qmdemo" + i
    );
    console.log(`Registered parcel ${d.s}/${d.sub} in ${d.v}`);
  }

  console.log("Exporting ABI and contract address to frontend...");
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const artifactFile = path.join(__dirname, "../artifacts/contracts/LandRegistry.sol/LandRegistry.json");
  const artifactJson = JSON.parse(fs.readFileSync(artifactFile, "utf-8"));

  const exportData = {
    address: contractAddress,
    abi: artifactJson.abi
  };

  fs.writeFileSync(
    path.join(frontendDir, "LandRegistry.json"),
    JSON.stringify(exportData, null, 2)
  );

  console.log("Deployment and setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
