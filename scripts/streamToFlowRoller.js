const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const Web3 = require("web3");

async function main() {
    const sf = new SuperfluidSDK.Framework({
        web3: new Web3(window.ethereum),
      });
    await sf.initialize();

    let address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    let currUser = sf.user({
        address: account,
        token: '0xdd5462a7db7856c9128bc77bd65c2919ee23c6e1' // ETHx Kovan Network Token
      });

      this.setState({ account, web3, currUser});

      await this.printDetails(currUser);

      await currUser.flow({
        recipient: '0x3905A1CfAe9d84fC25DffEF042f10f07Be9A7d06',
        flowRate: '385802469135'
      });
}