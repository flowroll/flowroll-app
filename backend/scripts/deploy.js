const hre = require("hardhat");

const MATIC_HOST = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";
const MATIC_CFA = "0x6EeE6060f715257b970700bc2656De21dEdF074C";
const MATIC_DAIX = "0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2";

const GOERLI_HOST = "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9";
const GOERLI_CFA = "0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8";
const GOERLI_DAIX = "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00";
const GOERLI_ETHX = "0x5943F705aBb6834Cad767e6E4bB258Bc48D9C947";

const KOVAN_HOST = "0xF0d7d1D47109bA426B9D8A3Cde1941327af1eea3";
const KOVAN_CFA = "0xECa8056809e7e8db04A8fF6e4E82cD889a46FE2F";
const KOVAN_DAIX = "0xe3cb950cb164a31c66e32c320a800d477019dcff";
const KOVAN_DAI = "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa";
const KOVAN_AAVE_DAI = "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD";
const KOVAN_ETHX = "0xdd5462a7db7856c9128bc77bd65c2919ee23c6e1";
const KOVAN_AAVE_ADDR_PROVIDER = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

const KOVAN_UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
// const KOVAN_UNISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";


async function main() {

  // We get the contract to deploy
  const FlowRoller = await hre.ethers.getContractFactory("FlowRoller");

  const flowRoller = await FlowRoller.deploy(
    KOVAN_HOST,
    KOVAN_CFA,
    KOVAN_DAIX,
    KOVAN_AAVE_DAI,
    KOVAN_AAVE_ADDR_PROVIDER,
    KOVAN_UNISWAP_ROUTER
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
