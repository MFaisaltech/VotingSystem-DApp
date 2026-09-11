const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  console.log("-----------------------------------------------");
  console.log("Deploying DecentralizedVoting Smart Contract...");
  console.log("-----------------------------------------------");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  const DecentralizedVoting = await ethers.getContractFactory("DecentralizedVoting");
  const contract = await DecentralizedVoting.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n>>> DecentralizedVoting successfully deployed to: ${contractAddress}\n`);

  // Write contract address & network details to frontend
  const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const network = await ethers.provider.getNetwork();
  const addressPayload = {
    address: contractAddress,
    chainId: Number(network.chainId),
    networkName: network.name || "localhost",
    deployedAt: new Date().toISOString(),
    owner: deployer.address,
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "contractAddress.json"),
    JSON.stringify(addressPayload, null, 2)
  );

  // Copy Contract Artifact ABI to frontend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DecentralizedVoting.sol",
    "DecentralizedVoting.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendContractsDir, "DecentralizedVoting.json"),
      JSON.stringify(artifact, null, 2)
    );
    console.log("✓ Contract ABI and Address exported to frontend/src/contracts/");
  }

  return { contract, contractAddress, deployer };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
