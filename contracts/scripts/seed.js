const deploy = require("./deploy");
const { ethers } = require("hardhat");

async function main() {
  const { contract, contractAddress, deployer } = await deploy();
  const signers = await ethers.getSigners();
  const voter1 = signers[1] || deployer;
  const voter2 = signers[2] || deployer;
  const voter3 = signers[3] || deployer;

  console.log("\n===============================================");
  console.log("Seeding Demo Elections & Real Blockchain Data...");
  console.log("===============================================");

  let latestBlock = await ethers.provider.getBlock("latest");
  let now = latestBlock.timestamp;

  // --- ELECTION 1: "UET Student Council 2026" (Active) ---
  console.log("Creating Election 1: UET Student Council 2026...");
  const s1 = now + 30; // Starts in 30 seconds
  const e1 = s1 + 7 * 24 * 3600; // 7 days

  let tx = await contract.createElection(
    "UET Student Council 2026",
    "Official 2026-2027 University Student Council General Election. Elect the presidential and executive leadership to represent student interests, drive campus policy, and oversee university club allocations.",
    s1,
    e1
  );
  await tx.wait();

  // Add 3 candidates
  tx = await contract.addCandidate(
    1,
    "Ayesha Khan",
    "Computer Engineering Senior. Focus on modernizing campus Wi-Fi infrastructure, 24/7 digital library access, and expanding tech society funding."
  );
  await tx.wait();

  tx = await contract.addCandidate(
    1,
    "Bilal Tariq",
    "Mechanical Engineering Junior. Championing athletic facility renovations, campus dining reforms, and expanded student transport shuttle routes."
  );
  await tx.wait();

  tx = await contract.addCandidate(
    1,
    "Zainab Fatima",
    "Electrical Engineering Senior. Passionate about green campus initiatives, solar lighting on campus, and transparent student union budgeting."
  );
  await tx.wait();

  console.log("✓ Election 1 created with 3 candidates.");

  // --- ELECTION 2: "Web3 Innovation Guild Lead" (Active with sample votes) ---
  console.log("\nCreating Election 2: Web3 Innovation Guild Lead...");
  latestBlock = await ethers.provider.getBlock("latest");
  now = latestBlock.timestamp;
  const s2 = now + 30;
  const e2 = s2 + 14 * 24 * 3600; // 14 days

  tx = await contract.createElection(
    "Web3 Innovation Guild Lead",
    "Electing the guild leader responsible for organizing university blockchain hackathons, smart contract security audits, and protocol research grants.",
    s2,
    e2
  );
  await tx.wait();

  tx = await contract.addCandidate(
    2,
    "Hamza Rehman",
    "Full-stack Solidity developer & open-source contributor. Plans to host weekly Ethereum workshops."
  );
  await tx.wait();

  tx = await contract.addCandidate(
    2,
    "Maryam Noor",
    "Zero-knowledge researcher and hackathon mentor. Focuses on research paper circles and dev fellowships."
  );
  await tx.wait();

  console.log("✓ Election 2 created with 2 candidates.");

  // Advance EVM time so Election 1 and 2 are active for voting
  try {
    await ethers.provider.send("evm_increaseTime", [35]);
    await ethers.provider.send("evm_mine");
  } catch {
    // If running on non-hardhat network, skip evm_increaseTime
  }

  // Cast sample votes on Election 2 from test signers if available
  if (signers.length > 2) {
    console.log("Casting initial on-chain votes for Election 2...");
    await contract.connect(voter1).vote(2, 1); // voter1 votes Hamza
    await contract.connect(voter2).vote(2, 2); // voter2 votes Maryam
    await contract.connect(voter3).vote(2, 2); // voter3 votes Maryam
    console.log("✓ 3 on-chain votes recorded on Election 2!");
  }

  // --- ELECTION 3: "Campus AI Safety Board 2025" (Completed / Ended) ---
  console.log("\nCreating Election 3: Campus AI Safety Board 2025 (Concluded)...");
  latestBlock = await ethers.provider.getBlock("latest");
  now = latestBlock.timestamp;
  const s3 = now + 30;
  const e3 = s3 + 1000;

  tx = await contract.createElection(
    "Campus AI Safety Board 2025",
    "Previous term election for faculty-student joint ethics committee overseeing institutional AI deployment.",
    s3,
    e3
  );
  await tx.wait();

  tx = await contract.addCandidate(3, "Dr. Sarah Ahmed", "Associate Professor in Machine Learning & Ethics.");
  await tx.wait();
  tx = await contract.addCandidate(3, "Usman Siddiqui", "Graduate AI Fellow & Policy Researcher.");
  await tx.wait();

  // Advance time past s3 and vote, then end
  try {
    await ethers.provider.send("evm_increaseTime", [35]);
    await ethers.provider.send("evm_mine");
    if (signers.length > 2) {
      await contract.connect(voter1).vote(3, 1);
      await contract.connect(voter2).vote(3, 1);
    }
  } catch {
    // skip
  }

  // Conclude election 3 manually so it serves as a verified completed election
  tx = await contract.endElection(3);
  await tx.wait();
  console.log("✓ Election 3 created, voted on, and marked as Completed (Verified on-chain).");

  console.log("\n===============================================");
  console.log("Seeding Completed Successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("Ready for frontend interaction & testing.");
  console.log("===============================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
