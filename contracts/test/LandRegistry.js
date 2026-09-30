const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LandRegistry", function () {
    let landRegistry, LandRegistry;
    let owner, admin, talathi, subRegistrar, bank, seller, buyer, objector, addrs;
    
    // Roles hashes
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    let TALATHI_ROLE, SUB_REGISTRAR_ROLE, BANK_ROLE;

    const parseBytes32String = ethers.encodeBytes32String;
    
    before(async function () {
        [owner, admin, talathi, subRegistrar, bank, seller, buyer, objector, ...addrs] = await ethers.getSigners();
        LandRegistry = await ethers.getContractFactory("LandRegistry");
    });

    beforeEach(async function () {
        landRegistry = await LandRegistry.deploy();
        TALATHI_ROLE = await landRegistry.TALATHI_ROLE();
        SUB_REGISTRAR_ROLE = await landRegistry.SUB_REGISTRAR_ROLE();
        BANK_ROLE = await landRegistry.BANK_ROLE();

        await landRegistry.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await landRegistry.connect(admin).grantRole(TALATHI_ROLE, talathi.address);
        await landRegistry.connect(admin).grantRole(SUB_REGISTRAR_ROLE, subRegistrar.address);
        await landRegistry.connect(admin).grantRole(BANK_ROLE, bank.address);
    });

    async function registerTestParcel(survey, sub, ownerAddr) {
        await landRegistry.connect(talathi).registerLand(
            survey, sub, "TestVillage", "TestTaluka", "TestDistrict",
            5000, 0, ownerAddr, parseBytes32String("Owner Name"), "ipfs://cid"
        );
        return await landRegistry.getParcelId("TestVillage", survey, sub);
    }

    describe("Deployment & Roles", function () {
        it("Should assign roles correctly", async function () {
            expect(await landRegistry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await landRegistry.hasRole(TALATHI_ROLE, talathi.address)).to.be.true;
            expect(await landRegistry.hasRole(SUB_REGISTRAR_ROLE, subRegistrar.address)).to.be.true;
            expect(await landRegistry.hasRole(BANK_ROLE, bank.address)).to.be.true;
        });

        it("Should prevent unauthorized role grants", async function () {
            await expect(landRegistry.connect(seller).grantRole(TALATHI_ROLE, buyer.address))
                .to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Land Registration", function () {
        it("Should allow Talathi to register land", async function () {
            const tx = await landRegistry.connect(talathi).registerLand(
                1, 1, "TestVillage", "TestTaluka", "TestDistrict",
                5000, 0, seller.address, parseBytes32String("Owner Name"), "ipfs://cid"
            );
            await expect(tx).to.emit(landRegistry, "LandRegistered");
            
            const parcelId = await landRegistry.getParcelId("TestVillage", 1, 1);
            const land = await landRegistry.getLand(parcelId);
            
            expect(land.currentOwner).to.equal(seller.address);
            expect(land.surveyNumber).to.equal(1);
        });

        it("Should prevent duplicate registration", async function () {
            await registerTestParcel(2, 1, seller.address);
            await expect(registerTestParcel(2, 1, seller.address))
                .to.be.revertedWithCustomError(landRegistry, "ParcelAlreadyExists");
        });

        it("Should prevent non-Talathi from registering", async function () {
            await expect(
                landRegistry.connect(seller).registerLand(3, 1, "V", "T", "D", 100, 0, seller.address, ethers.ZeroHash, "cid")
            ).to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount");
        });

        it("Should expose registered parcel IDs for role dashboards", async function () {
            const parcelId = await registerTestParcel(4, 1, seller.address);
            expect(await landRegistry.getAllParcelIds()).to.deep.equal([parcelId]);
        });

        it("Should reject zero owners and zero-area parcels", async function () {
            await expect(
                landRegistry.connect(talathi).registerLand(5, 1, "V", "T", "D", 100, 0, ethers.ZeroAddress, ethers.ZeroHash, "cid")
            ).to.be.revertedWithCustomError(landRegistry, "InvalidAddress");
            await expect(
                landRegistry.connect(talathi).registerLand(6, 1, "V", "T", "D", 0, 0, seller.address, ethers.ZeroHash, "cid")
            ).to.be.revertedWithCustomError(landRegistry, "InvalidArea");
        });
    });

    describe("Transfer Workflow & Objections", function () {
        let parcelId;
        
        beforeEach(async function () {
            parcelId = await registerTestParcel(10, 1, seller.address);
        });

        it("Should complete a full transfer workflow successfully", async function () {
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "saleDeedCID", 1000))
                .to.emit(landRegistry, "TransferInitiated");
            await expect(landRegistry.connect(buyer).acceptTransfer(parcelId))
                .to.emit(landRegistry, "TransferAccepted");
            await expect(landRegistry.connect(subRegistrar).approveRegistration(parcelId))
                .to.emit(landRegistry, "RegistrationApproved");

            await time.increase(30 * 24 * 60 * 60 + 1);
            await expect(landRegistry.connect(talathi).certifyMutation(parcelId, parseBytes32String("New Owner")))
                .to.emit(landRegistry, "MutationCertified");

            const land = await landRegistry.getLand(parcelId);
            expect(land.currentOwner).to.equal(buyer.address);
            
            const history = await landRegistry.getOwnershipHistory(parcelId);
            expect(history.length).to.equal(2);
            expect(history[0]).to.equal(seller.address);
            expect(history[1]).to.equal(buyer.address);
        });

        it("Should allow objection and rejection", async function () {
            await landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "saleDeedCID", 1000);
            await landRegistry.connect(buyer).acceptTransfer(parcelId);
            await landRegistry.connect(subRegistrar).approveRegistration(parcelId);
            await expect(landRegistry.connect(objector).fileObjection(parcelId, "objectionCID"))
                .to.emit(landRegistry, "ObjectionFiled");

            await time.increase(30 * 24 * 60 * 60 + 1);
            await expect(landRegistry.connect(talathi).certifyMutation(parcelId, parseBytes32String("New Owner")))
                .to.be.revertedWithCustomError(landRegistry, "ObjectionPresent");

            await expect(landRegistry.connect(talathi).rejectTransfer(parcelId, "rejectionCID"))
                .to.emit(landRegistry, "TransferRejected");

            const request = await landRegistry.getTransferRequest(parcelId);
            expect(request.state).to.equal(0);
        });

        it("Should prevent certifying before 30 days", async function () {
            await landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "saleDeedCID", 1000);
            await landRegistry.connect(buyer).acceptTransfer(parcelId);
            await landRegistry.connect(subRegistrar).approveRegistration(parcelId);

            await expect(landRegistry.connect(talathi).certifyMutation(parcelId, parseBytes32String("New Owner")))
                .to.be.revertedWithCustomError(landRegistry, "ObjectionPeriodActive");
        });
        
        it("Should prevent objections after 30 days", async function () {
            await landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "saleDeedCID", 1000);
            await landRegistry.connect(buyer).acceptTransfer(parcelId);
            await landRegistry.connect(subRegistrar).approveRegistration(parcelId);
            await time.increase(30 * 24 * 60 * 60 + 1);
            
            await expect(landRegistry.connect(objector).fileObjection(parcelId, "cid"))
                .to.be.revertedWithCustomError(landRegistry, "ObjectionPeriodExpired");
        });

        it("Should start objections only after Sub-Registrar approval", async function () {
            await landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "saleDeedCID", 1000);
            await expect(landRegistry.connect(objector).fileObjection(parcelId, "cid"))
                .to.be.revertedWithCustomError(landRegistry, "InvalidTransferState");
        });

        it("Should reject invalid buyer addresses and self-transfers", async function () {
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, ethers.ZeroAddress, "cid", 100))
                .to.be.revertedWithCustomError(landRegistry, "InvalidAddress");
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, seller.address, "cid", 100))
                .to.be.revertedWithCustomError(landRegistry, "SelfTransfer");
        });
    });

    describe("Status and Encumbrance Blocking", function () {
        let parcelId;
        
        beforeEach(async function () {
            parcelId = await registerTestParcel(20, 1, seller.address);
        });

        it("Should block transfer if disputed", async function () {
            await landRegistry.connect(talathi).markDisputed(parcelId);
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "cid", 100))
                .to.be.revertedWithCustomError(landRegistry, "InvalidStatus");
        });

        it("Should block transfer if frozen", async function () {
            await landRegistry.connect(admin).freezeLand(parcelId);
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "cid", 100))
                .to.be.revertedWithCustomError(landRegistry, "InvalidStatus");
        });

        it("Should allow a bank to set and clear a mortgage", async function () {
            await expect(landRegistry.connect(bank).setEncumbrance(parcelId, 1))
                .to.emit(landRegistry, "LandEncumbranceChanged");
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "cid", 100))
                .to.be.revertedWithCustomError(landRegistry, "EncumbrancePresent");
            await landRegistry.connect(bank).setEncumbrance(parcelId, 0);
            await expect(landRegistry.connect(seller).initiateTransfer(parcelId, buyer.address, "cid", 100))
                .to.emit(landRegistry, "TransferInitiated");
        });

        it("Should prevent unauthorized encumbrance updates", async function () {
            await expect(landRegistry.connect(seller).setEncumbrance(parcelId, 1))
                .to.be.revertedWithCustomError(landRegistry, "UnauthorizedAccount");
        });
    });
});
