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
        // url: "https://eth-kovan.alchemyapi.io/v2/45x-QiW-4TZFuvdAP7xlmn2hOTFG1JTh",
        // blockNumber: 25787548
      }
    }
  }
};

