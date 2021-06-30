const ALCHEMY_ENDPOINTS = require('../alchemyApiEndpoints.json');

async function main() {
    const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
    const web3 = createAlchemyWeb3(ALCHEMY_ENDPOINTS.kovan);
    const blockNumber = await web3.eth.getBlockNumber();
    console.log("The latest block number is " + blockNumber);
   }
main();       
