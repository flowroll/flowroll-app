async function main() {
    const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
    const web3 = createAlchemyWeb3("https://eth-goerli.alchemyapi.io/v2/Si8N1a22hFTxvTj33mb6ulebj8PceVlV");
    const blockNumber = await web3.eth.getBlockNumber();
    console.log("The latest block number is " + blockNumber);
   }
main();       
