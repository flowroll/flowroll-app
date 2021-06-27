async function main() {
    const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
    const web3 = createAlchemyWeb3("https://eth-kovan.alchemyapi.io/v2/45x-QiW-4TZFuvdAP7xlmn2hOTFG1JTh");
    const blockNumber = await web3.eth.getBlockNumber();
    console.log("The latest block number is " + blockNumber);
   }
main();       
