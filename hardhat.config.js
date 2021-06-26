require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-truffle5");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.5",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-goerli.alchemyapi.io/v2/Si8N1a22hFTxvTj33mb6ulebj8PceVlV",
        blockNumber: 5034475
      }
    }
  }
};

