import { Component } from 'react';
import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

import './App.scss';
import Header from './components/Header';
import Main from './components/Main';
import Summary from './components/Summary';

import * as FlowRoller from './contracts/FlowRoller.json';

import ADDRESSES from './addresses.json';
import FLOW_RATE_CONSTANTS from './flowRateConstants';

class App extends Component {
  constructor(props){
    super(props)
    this.state = { 
      account: null,
      currUser: null,
      inFlows: [],
      totalInFlow: 0,
      outFlows: [],
      totalOutFlow: 0,
      balance: 0,
      flowRoller: null,
      flowRollerAddress: null,
      updateBalanceInterval: null
    };

    this.connect = this.connect.bind(this);
  }

  componentWillUnmount() {
    clearInterval(this.state.updateBalanceInterval)
  }

  connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();

      console.log(accounts);

      const sf = new SuperfluidSDK.Framework({
        web3: new Web3(window.ethereum),
        resolverAddress: ADDRESSES.networks.superfluid_resolver_addr_kovan,
        tokens: ['fDAI']
      });

      try {
        await sf.initialize();
      } catch(err){
        console.error('SF failed to initialize')
        console.error(err);
      }

      if (accounts[0] !== undefined) {
        let account = accounts[0];
        let fDaixAddress = sf.tokens.fDAIx.address;

        let currUser = sf.user({
          address: account,
          token: fDaixAddress
        });

        this.setState({ account, web3, currUser});

        const updateBalanceInterval = setInterval(() => {
          this.updateBalance(web3, sf);
        }, 5000)
        this.updateFlows();
        
        let flowRoller = new this.state.web3.eth.Contract(FlowRoller['abi'], ADDRESSES.contract.kovan);

        console.log(`flowRoller is set: ${flowRoller}`);
    
        this.setState({ updateBalanceInterval, flowRoller, flowRollerAddress: ADDRESSES.contract.kovan});

        // this.mintDaix(sf);
      }
      else {
        window.alert('Please login with MetaMask');
      }
    }
    else {
      window.alert('Please install MetaMask');
    }
  }
  mintDaix = async (sf) => {
    let fDaixAddress = sf.tokens.fDAIx.address;
    const daix = await sf.contracts.ISuperToken.at(fDaixAddress);
    this.setState({daix})
    const daiAddress = await sf.resolver.get("tokens.fDAI");
    const dai = await sf.contracts.TestToken.at(daiAddress);
    console.log('DAIx ', daix.address);;
    console.log('Minting and upgrading...');
    await dai.mint(this.state.account, '1000000000000000000000', { from: this.state.account });
    await dai.approve(daix.address, '1000000000000000000000', { from: this.state.account });
    // await dai.methods.approve(daix.address, amount.toString()).send({ from: this.state.account });
    await daix.upgrade('1000000000000000000000', { from: this.state.account });
    console.log('Done minting and upgrading.');
    let daixBalance = await daix.balanceOf(this.state.account);
    console.log('Your DAIx balance', daixBalance.toString());

  }
  updateBalance = async (web3, sf) => {
    let balanceWei = (await sf.tokens.fDAIx.balanceOf(this.state.account)).toString();
    const balance = web3.utils.fromWei(balanceWei)
    console.log('balance:', balance)
    this.setState({balance});
  }
  updateFlows = async () => {

    let details = await this.state.currUser.details();

    console.log(`details: ${JSON.stringify(details)}`);

    if(details && details.cfa && details.cfa.flows){

      let totalInFlow = 0;
      const inFlows = details.cfa.flows.inFlows.map( flow => {
          const flowRate = Number(flow.flowRate)/FLOW_RATE_CONSTANTS.day;
          totalInFlow = totalInFlow + flowRate;
          return({
            receiver: flow.receiver,
            sender: flow.sender,
            flowRate
          })
        }
      )

      let totalOutFlow = 0;
      const outFlows = details.cfa.flows.outFlows.map( flow => {
        const flowRate = Number(flow.flowRate)/FLOW_RATE_CONSTANTS.day;
        totalOutFlow = totalOutFlow + flowRate;
          return({
            receiver: flow.receiver,
            sender: flow.sender,
            flowRate
          })
      })

      this.setState({
        inFlows, totalInFlow, outFlows, totalOutFlow
      })
    }
  }

  depositToAAVE() {
    if (this.state.flowRoller) {
      console.log(`depositing to AAVE...${this.state.flowRollerAddress}`);

      this.state.flowRoller.methods._depositBalance().send({
        from: this.state.account,
      });
    }
  }

  withdrawFromAAVE() {
    if (this.state.flowRoller) {
      console.log(`withdrawing from AAVE...`);

      this.state.flowRoller.methods._withdraw().send({
        from: this.state.account,
      });
    }
  }
  render() {

   return (
      <div className="App">
        <Header account={this.state.account} connect={() => this.connect()}></Header>
        <Summary balance={this.state.balance} totalInFlow={this.state.totalInFlow} totalOutFlow={this.state.totalOutFlow}></Summary>
        {this.state.currUser && 
          <Main 
          currUser={this.state.currUser} 
          inFlows={this.state.inFlows} 
          outFlows={this.state.outFlows} 
          updateFlows={() => this.updateFlows()}
          depositToAAVE={() => this.depositToAAVE()}
          withdrawFromAAVE={() => this.withdrawFromAAVE()}
          ></Main> }
      </div>
    );
  }
}

export default App;
