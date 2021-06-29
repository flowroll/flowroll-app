require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-truffle5");
const ALCHEMY_ENDPOINTS = require("./alchemyApiEndpoints.json");

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
  solidity: {
    compilers: [
      {
        "version": "0.7.5"
      },
      {
        "version": "0.6.12"
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_ENDPOINTS.kovan,
        blockNumber: 25774880
      }
    }
  }
};

