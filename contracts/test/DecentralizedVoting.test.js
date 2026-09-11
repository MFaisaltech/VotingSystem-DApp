const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DecentralizedVoting Contract", function () {
  let votingContract;
  let owner, voter1, voter2, voter3, nonOwner;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonOwner] = await ethers.getSigners();

    const DecentralizedVotingFactory = await ethers.getContractFactory("DecentralizedVoting");
    votingContract = await DecentralizedVotingFactory.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully and set the deployer as owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
      expect(await votingContract.electionCount()).to.equal(0n);
    });
  });

  describe("Election Creation", function () {
    it("Should allow the owner to create an election with valid parameters", async function () {
      const now = await time.latest();
      const startTime = now + 100;
      const endTime = startTime + 3600;

      await expect(
        votingContract.createElection(
          "UET Student Council 2026",
          "Annual student body election",
          startTime,
          endTime
        )
      )
        .to.emit(votingContract, "ElectionCreated")
        .withArgs(1n, "UET Student Council 2026", startTime, endTime, owner.address);

      expect(await votingContract.electionCount()).to.equal(1n);

      const election = await votingContract.getElection(1n);
      expect(election.id).to.equal(1n);
      expect(election.title).to.equal("UET Student Council 2026");
      expect(election.candidateCount).to.equal(0n);
      expect(election.totalVotes).to.equal(0n);
      expect(election.exists).to.be.true;
    });

    it("Should reject election creation from non-owner", async function () {
      const now = await time.latest();
      await expect(
        votingContract.connect(nonOwner).createElection("Hack", "Desc", now + 100, now + 500)
      ).to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount");
    });

    it("Should reject empty title or description", async function () {
      const now = await time.latest();
      await expect(
        votingContract.createElection("", "Desc", now + 100, now + 500)
      ).to.be.revertedWithCustomError(votingContract, "EmptyStringNotAllowed");

      await expect(
        votingContract.createElection("Title", "", now + 100, now + 500)
      ).to.be.revertedWithCustomError(votingContract, "EmptyStringNotAllowed");
    });

    it("Should reject invalid time window (end before start or start in past)", async function () {
      const now = await time.latest();
      // start in past
      await expect(
        votingContract.createElection("Title", "Desc", now - 10, now + 500)
      ).to.be.revertedWithCustomError(votingContract, "InvalidElectionTimes");

      // end <= start
      await expect(
        votingContract.createElection("Title", "Desc", now + 500, now + 200)
      ).to.be.revertedWithCustomError(votingContract, "InvalidElectionTimes");
    });
  });

  describe("Candidate Management", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 200;
      endTime = startTime + 3600;

      await votingContract.createElection("Election 1", "Desc", startTime, endTime);
    });

    it("Should allow owner to add candidates before election starts", async function () {
      await expect(
        votingContract.addCandidate(1n, "Ayesha Khan", "Tech & Academics Leader")
      )
        .to.emit(votingContract, "CandidateAdded")
        .withArgs(1n, 1n, "Ayesha Khan");

      await votingContract.addCandidate(1n, "Bilal Tariq", "Campus Life Lead");

      const candidates = await votingContract.getCandidates(1n);
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal("Ayesha Khan");
      expect(candidates[0].id).to.equal(1n);
      expect(candidates[1].name).to.equal("Bilal Tariq");
      expect(candidates[1].id).to.equal(2n);
    });

    it("Should reject candidate creation by non-owner", async function () {
      await expect(
        votingContract.connect(nonOwner).addCandidate(1n, "Hacker", "Bio")
      ).to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount");
    });

    it("Should reject candidate with empty name", async function () {
      await expect(
        votingContract.addCandidate(1n, "", "Bio")
      ).to.be.revertedWithCustomError(votingContract, "InvalidCandidateName");
    });

    it("Should reject adding candidates after election has started", async function () {
      await time.increaseTo(startTime + 1);

      await expect(
        votingContract.addCandidate(1n, "Late Candidate", "Bio")
      ).to.be.revertedWithCustomError(votingContract, "ElectionAlreadyStarted");
    });

    it("Should reject adding candidates to non-existent election", async function () {
      await expect(
        votingContract.addCandidate(99n, "Candidate", "Bio")
      ).to.be.revertedWithCustomError(votingContract, "ElectionDoesNotExist");
    });
  });

  describe("Voting Process & Double Voting Prevention", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 100;
      endTime = startTime + 1000;

      await votingContract.createElection("Tech Council", "Election desc", startTime, endTime);
      await votingContract.addCandidate(1n, "Candidate A", "Platform A");
      await votingContract.addCandidate(1n, "Candidate B", "Platform B");
      await votingContract.addCandidate(1n, "Candidate C", "Platform C");
    });

    it("Should reject vote before election starts", async function () {
      await expect(
        votingContract.connect(voter1).vote(1n, 1n)
      ).to.be.revertedWithCustomError(votingContract, "ElectionNotStarted");
    });

    it("Should allow valid vote during election period and emit VoteCast", async function () {
      await time.increaseTo(startTime + 10);

      await expect(votingContract.connect(voter1).vote(1n, 1n))
        .to.emit(votingContract, "VoteCast")
        .withArgs(1n, 1n, voter1.address);

      expect(await votingContract.hasUserVoted(1n, voter1.address)).to.be.true;
      expect(await votingContract.getUserVote(1n, voter1.address)).to.equal(1n);

      const election = await votingContract.getElection(1n);
      expect(election.totalVotes).to.equal(1n);

      const candidates = await votingContract.getCandidates(1n);
      expect(candidates[0].voteCount).to.equal(1n);
      expect(candidates[1].voteCount).to.equal(0n);
    });

    it("Should strictly prevent double voting by the same wallet", async function () {
      await time.increaseTo(startTime + 10);

      // First vote succeeds
      await votingContract.connect(voter1).vote(1n, 1n);

      // Second vote from same wallet MUST revert
      await expect(
        votingContract.connect(voter1).vote(1n, 2n)
      ).to.be.revertedWithCustomError(votingContract, "AlreadyVoted")
        .withArgs(1n, voter1.address);

      // Verify vote count didn't increase
      const election = await votingContract.getElection(1n);
      expect(election.totalVotes).to.equal(1n);
    });

    it("Should reject vote for invalid candidate ID", async function () {
      await time.increaseTo(startTime + 10);

      await expect(
        votingContract.connect(voter1).vote(1n, 0n)
      ).to.be.revertedWithCustomError(votingContract, "CandidateDoesNotExist")
        .withArgs(1n, 0n);

      await expect(
        votingContract.connect(voter1).vote(1n, 99n)
      ).to.be.revertedWithCustomError(votingContract, "CandidateDoesNotExist")
        .withArgs(1n, 99n);
    });

    it("Should reject vote after election end time", async function () {
      await time.increaseTo(endTime + 1);

      await expect(
        votingContract.connect(voter1).vote(1n, 1n)
      ).to.be.revertedWithCustomError(votingContract, "ElectionAlreadyEnded");
    });

    it("Should reject vote if election is ended manually", async function () {
      await time.increaseTo(startTime + 10);

      await votingContract.endElection(1n);

      await expect(
        votingContract.connect(voter1).vote(1n, 1n)
      ).to.be.revertedWithCustomError(votingContract, "ElectionAlreadyEnded");
    });
  });

  describe("Results and Winner Computation", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const now = await time.latest();
      startTime = now + 50;
      endTime = startTime + 500;

      await votingContract.createElection("Results Test", "Desc", startTime, endTime);
      await votingContract.addCandidate(1n, "Alice", "Alice bio");
      await votingContract.addCandidate(1n, "Bob", "Bob bio");
      await votingContract.addCandidate(1n, "Charlie", "Charlie bio");

      await time.increaseTo(startTime + 10);
    });

    it("Should compute sole winner accurately on-chain", async function () {
      await votingContract.connect(voter1).vote(1n, 2n); // Bob
      await votingContract.connect(voter2).vote(1n, 2n); // Bob
      await votingContract.connect(voter3).vote(1n, 1n); // Alice

      const [winner, isTie, winningVotes] = await votingContract.getWinner(1n);
      expect(winner.name).to.equal("Bob");
      expect(winner.id).to.equal(2n);
      expect(isTie).to.be.false;
      expect(winningVotes).to.equal(2n);
    });

    it("Should identify a tie accurately on-chain", async function () {
      await votingContract.connect(voter1).vote(1n, 1n); // Alice
      await votingContract.connect(voter2).vote(1n, 2n); // Bob

      const [, isTie, winningVotes] = await votingContract.getWinner(1n);
      expect(isTie).to.be.true;
      expect(winningVotes).to.equal(1n);
    });

    it("Should return correct status transitions (Upcoming, Active, Ended)", async function () {
      const now = await time.latest();
      const s = now + 1000;
      const e = s + 2000;
      await votingContract.createElection("Status Test", "Desc", s, e);

      // Status before start: UPCOMING (0)
      expect(await votingContract.getElectionStatus(2n)).to.equal(0);

      // Advance to active window
      await time.increaseTo(s + 50);
      expect(await votingContract.getElectionStatus(2n)).to.equal(1);

      // Advance past end time: ENDED (2)
      await time.increaseTo(e + 1);
      expect(await votingContract.getElectionStatus(2n)).to.equal(2);
    });
  });

  describe("Admin Controls & Ending Election", function () {
    it("Should allow owner to end election manually and emit ElectionEnded", async function () {
      const now = await time.latest();
      const s = now + 50;
      const e = s + 500;
      await votingContract.createElection("Manual End Test", "Desc", s, e);

      await expect(votingContract.endElection(1n))
        .to.emit(votingContract, "ElectionEnded")
        .withArgs(1n, owner.address, 0n);

      expect(await votingContract.getElectionStatus(1n)).to.equal(2); // ENDED
    });

    it("Should reject non-owner attempting to end election", async function () {
      const now = await time.latest();
      await votingContract.createElection("Test", "Desc", now + 50, now + 500);

      await expect(
        votingContract.connect(nonOwner).endElection(1n)
      ).to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount");
    });
  });
});
