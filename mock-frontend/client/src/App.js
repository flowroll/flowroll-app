import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react';
import * as wethAbi from './contracts/IWETH.json';
import * as FlowRoller from './contracts/FlowRoller.json';
import * as uniswapAbi from './contracts/Uniswap.json';
import { ChainId, Token, WETH, Fetcher, Trade, Route, TokenAmount, TradeType, Percent } from '@uniswap/sdk'
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const truffleContract = require("@truffle/contract");
const Web3 = require("web3");
const ETHX_GOERLI_ADDRESS = '0x5943F705aBb6834Cad767e6E4bB258Bc48D9C947';
const SUPERFLUID_RESOLVER_GOERLI_ADDRESS = '0x3710AB3fDE2B61736B8BB0CE845D6c61F667a78E';

const UNISWAP_KOVAN_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const ETHX_KOVAN_ADDRESS = '0xdd5462a7db7856c9128bc77bd65c2919ee23c6e1';
const SUPERFLUID_RESOLVER_KOVAN_ADDRESS = '0x851d3dd9dc97c1df1DA73467449B3893fc76D85B';
const DAI_KOVAN_ADDRESS = '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa';
const DAIX_KOVAN_ADDRESS = '0xe3cb950cb164a31c66e32c320a800d477019dcff';

class App extends Component {

  constructor() {
    super();
    this.state = { 
      account: '',
      web3: 'undefined',
      currUser: null,
      seth: null,
      ethBalance: 0,
      ethxBalance: 0,
      flowRoller: null,
      flowRollerAddress: null,
      uniswap: null,
     };
  }

  async componentWillMount() {
    await this.createConstantCashFlow();
  }

  async createConstantCashFlow() {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum);
      const enabledWeb3 = window.ethereum.enable();
      const netId = await web3.eth.net.getId();
      const chainId = await web3.eth.getChainId();
      const accounts = await web3.eth.getAccounts();

      console.log(accounts);

      const sf = new SuperfluidSDK.Framework({
        web3: new Web3(window.ethereum),
        resolverAddress: SUPERFLUID_RESOLVER_KOVAN_ADDRESS
      });

      await sf.initialize();

      if (accounts[0] != undefined) {
        let seth = new web3.eth.Contract(wethAbi['default'], ETHX_KOVAN_ADDRESS);
        let uniswap = new web3.eth.Contract(uniswapAbi['default'], UNISWAP_KOVAN_ADDRESS);
        let account = accounts[0];

        let ethBalance = await web3.eth.getBalance(account);
        
        // let ethxBalance = await seth.methods.balanceOf(account).call();
        
        let currUser = sf.user({
          address: account,
          token: ETHX_KOVAN_ADDRESS // ETHx Goerli Network Token
        });

        this.setState({ account, web3, currUser, ethBalance: web3.utils.fromWei(ethBalance, 'ether'), seth, uniswap});

        await this.printDetails(currUser);

      }
      else {
        window.alert('Please login with MetaMask');
      }
    }
    else {
      window.alert('Please install MetaMask');
    }
  }

  async swapETHForDAI(amount) {
    const DAI = new Token(ChainId.KOVAN, DAI_KOVAN_ADDRESS, 18);
    const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);
    const route = new Route([pair], WETH[DAI.chainId]);
    const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], amount.toString()), TradeType.EXACT_INPUT);

    const slippageTolerance = new Percent('50', '10000'); // 50 bips, or 0.50%
    console.log(slippageTolerance);
    console.log(trade.minimumAmountOut(slippageTolerance));
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
    const path = [WETH[DAI.chainId].address, DAI.address];
    const to = this.state.account; // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex

    console.log(amountOutMin);
    console.log(path);
    console.log(to);
    console.log(deadline);
    console.log(value);

    await this.state.uniswap.methods.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline).send( { value, gasPrice: 20e9 }); 
  }

  async streamEthxToAddress(amount) {
    if (this.state.currUser) {
      try {
          await this.state.currUser.flow({
          recipient: this.state.flowRollerAddress,
          flowRate: amount
        });
        
        await this.printDetails(this.state.currUser);
      }
      catch (e) {
        console.log('Error streamEthxToAddress: ', e);
      }
    }
  }

  setFlowRoller(address) {
    let flowRoller = new this.state.web3.eth.Contract(FlowRoller['abi'], address);

    console.log(`flowRoller is set: ${flowRoller}`);

    this.setState({flowRoller, flowRollerAddress: address});
  }

  depositAmountToAAVE(amount) {
    if (this.state.flowRoller) {
      console.log(`depositing to AAVE...${this.state.flowRollerAddress}`);

      this.state.flowRoller.methods._depositBalance().send({
        from: this.state.account,
      });
    }
  }

  async upgradeEth(amount) {
    if (this.state.seth) {
      try {
        await this.state.seth.methods.upgradeByETH().send({
          from: this.state.account,
          value: amount.toString(),
        })
      }
      catch (e) {
        console.log('Error upgradeEth: ', e);
      }
    }
  }

  async printDetails(currUser) {
    let details = await currUser.details();

    console.log(`details: ${JSON.stringify(details)}`);
  }

  render() {
    return (
      <div className='text-monospace'>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Charlie's SuperFluid App</h1>
          <h2>Connected address: {this.state.account}</h2>
          <h2>ETH Balance: {this.state.ethBalance}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <div>
                    <br></br>
                    Upgrade ETH to ETHx
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      let amount = this.upgradeAmount.value;
                      amount = amount * 10**18;
                      this.upgradeEth(amount);
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                       <input
                        id='upgradeAmount'
                        step='0.01'
                        type='number'
                        className='form-control form-control-md'
                        placeholder='amount...'
                        required
                        ref={(input) => { this.upgradeAmount = input }}
                      />
                      </div>
                      <button type='submit' className='btn btn-primary'>Upgrade</button>
                    </form>
                  </div>
                  <div>
                    <br></br>
                    Set FlowRoller Instance with Address
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      let address = this.address.value;
                      this.setFlowRoller(address);
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                      <br></br>
                      <input
                        id='flowRoller address'
                        type='text'
                        className='form-control form-control-md'
                        placeholder='address...'
                        required
                        ref={(input) => { this.address = input }}
                      />
                      </div>
                      <button type='submit' className='btn btn-primary'>Set Flow Roller</button>
                    </form>
                  </div>
                  <div>
                    <br></br>
                    Stream to FlowRoller (default amount: 385802469135)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      let sendAmount = this.sendAmount.value;
                      this.streamEthxToAddress(sendAmount);
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                      <br></br>
                       <input
                        id='sendAmount'
                        step='0.01'
                        type='number'
                        className='form-control form-control-md'
                        placeholder='send amount...'
                        required
                        ref={(input) => { this.sendAmount = input }}
                      />
                      </div>
                      <button type='submit' className='btn btn-primary'>Stream</button>
                    </form>
                  </div>
                  <div>
                    <br></br>
                    Deposit Accumulated To AAVE (-1 if all)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      let depositAmount = this.depositAmount.value;
                      if (depositAmount > -1) {
                        depositAmount = depositAmount * 10**18;
                      }
                      this.depositAmountToAAVE(depositAmount);
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                      <br></br>
                       <input
                        id='depositAmount'
                        step='0.01'
                        type='number'
                        className='form-control form-control-md'
                        placeholder='deposit amount...'
                        required
                        ref={(input) => { this.depositAmount = input }}
                      />
                      </div>
                      <button type='submit' className='btn btn-primary'>Stream</button>
                    </form>
                  </div>
                  <div>
                    <br></br>
                    Swap ETH For DAI
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      let sendAmount = this.sendAmount.value;
                      sendAmount = sendAmount * 10**18;
                      this.swapETHForDAI(sendAmount);
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                      <br></br>
                       <input
                        id='sendAmount'
                        step='0.01'
                        type='number'
                        className='form-control form-control-md'
                        placeholder='swap amount...'
                        required
                        ref={(input) => { this.sendAmount = input }}
                      />
                      </div>
                      <button type='submit' className='btn btn-primary'>Stream</button>
                    </form>
                  </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
