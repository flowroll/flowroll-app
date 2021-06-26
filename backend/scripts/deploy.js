const hre = require("hardhat");

const MATIC_HOST = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";
const MATIC_CFA = "0x6EeE6060f715257b970700bc2656De21dEdF074C";
const MATIC_DAIX = "0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2";

const GOERLI_HOST = "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9";
const GOERLI_CFA = "0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8";
const GOERLI_DAIX = "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00";
const GOERLI_ETHX = "0x5943F705aBb6834Cad767e6E4bB258Bc48D9C947";

async function main() {

  // We get the contract to deploy
  const FlowRoller = await hre.ethers.getContractFactory("FlowRoller");

  const flowRoller = await FlowRoller.deploy(
    GOERLI_HOST,
    GOERLI_CFA,
    GOERLI_ETHX
    );

  // console.log(JSON.stringify(flowRoller));

  await flowRoller.deployed();

  console.log("FlowRoller deployed to:", flowRoller.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
