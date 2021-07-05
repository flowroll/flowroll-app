import { Component } from 'react';
import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

import './App.scss';
import Header from './components/Header';
import Main from './components/Main';
import Summary from './components/Summary';

import * as FlowRoller from './contracts/FlowRoller.json';
import * as ERC20 from './contracts/ERC20.json';

import ADDRESSES from './addresses.json';
import FLOW_RATE_CONSTANTS from './flowRateConstants';

const moment = require('moment');

const ENV = 'kovan'

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
      aDaiBalance: undefined,
      aDaiBalanceWei: undefined,
      aDai: null,
      flowRoller: null,
      flowRollerAddress: null,
      updateBalanceInterval: null,
      sf: null
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
        web3: web3,
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
        let aDai = new web3.eth.Contract(ERC20['default'], ADDRESSES.tokens.aDai);

        let currUser = sf.user({
          address: account,
          token: fDaixAddress
        });

        this.setState({ account, web3, currUser, aDai, sf});

        const updateBalanceInterval = setInterval(() => {
          this.updateBalance(web3, sf);
        }, 5000)
        
        let flowRoller = new this.state.web3.eth.Contract(FlowRoller['abi'], ADDRESSES.contract[ENV]);

        console.log(`flowRoller is set: ${flowRoller}`);
    
        this.setState({ updateBalanceInterval, flowRoller, flowRollerAddress: ADDRESSES.contract[ENV]});

        await this.updateFlows(sf);

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
    let amount = this.state.web3.utils.toWei("10000");
    await dai.mint(this.state.account, amount, { from: this.state.account });
    await dai.approve(daix.address, amount, { from: this.state.account });
    // await dai.methods.approve(daix.address, amount.toString()).send({ from: this.state.account });
    await daix.upgrade(amount, { from: this.state.account });
    console.log('Done minting and upgrading.');
    let daixBalance = await daix.balanceOf(this.state.account);
    console.log('Your DAIx balance', daixBalance.toString());
  }

  updateBalance = async (web3, sf) => {
    let aDaiBalanceWei = await this.state.aDai.methods.balanceOf(this.state.account).call();
    let aDaiBalance = web3.utils.fromWei(aDaiBalanceWei);
    console.log('aDaiBalance:', aDaiBalance)

    let balanceWei = (await sf.tokens.fDAIx.balanceOf(this.state.account)).toString();
    const balance = web3.utils.fromWei(balanceWei)
    console.log('balance:', balance)

    let totalStreamedWei = await this.state.flowRoller.methods._totalStreamedOf(this.state.account).call();
    let totalStreamed = web3.utils.fromWei(totalStreamedWei);
    console.log('totalStreamed:', totalStreamed)

    this.setState({balance, aDaiBalance, aDaiBalanceWei, totalStreamed});

  }

  updateFlows = async (sf) => {
    let details = await this.state.currUser.details();

    console.log(`details: ${JSON.stringify(details)}`);

    if(details && details.cfa && details.cfa.flows){
      let totalInFlow = 0;
      let inFlows = [];

      for (var inflow of details.cfa.flows.inFlows) {
        let flowDetails = await this.state.sf.cfa.getFlow({
          superToken: this.state.sf.tokens.fDAIx.address,
          sender: inflow.sender,
          receiver: inflow.receiver
        });

        console.log(JSON.stringify(flowDetails));

        if (flowDetails) {
          const flowRate = Number(inflow.flowRate)/FLOW_RATE_CONSTANTS.day;
          totalInFlow = totalInFlow + flowRate;
          inFlows.push({
            receiver: inflow.receiver,
            sender: inflow.sender,
            flowRate,
            timestamp: moment(flowDetails.timestamp).format('LLL')
          })
        }
      }

      let totalOutFlow = 0;
      let outFlows = [];

      for (var outFlow of details.cfa.flows.outFlows) {
        let flowDetails = await this.state.sf.cfa.getFlow({
          superToken: this.state.sf.tokens.fDAIx.address,
          sender: outFlow.sender,
          receiver: outFlow.receiver
        });
        console.log(JSON.stringify(flowDetails));

        if (flowDetails) {
          console.log(`flowRollerAddress: ${this.state.flowRollerAddress}`);
          const flowRate = Number(outFlow.flowRate)/FLOW_RATE_CONSTANTS.day;
          totalOutFlow = totalOutFlow + flowRate;
          outFlows.push({
            receiver: outFlow.receiver,
            sender: outFlow.sender,
            flowRate,
            isSavings: outFlow.receiver == this.state.flowRollerAddress,
            timestamp: moment(flowDetails.timestamp).format('LLL')
          })
        }
      }
      this.setState({
        inFlows, totalInFlow, outFlows, totalOutFlow
      })
    }
  }

  depositToAAVE = async () => {
    if (this.state.flowRoller) {
      console.log(`depositing to AAVE...${this.state.flowRollerAddress}`);

      await this.state.flowRoller.methods._depositBalance().send({
        from: this.state.account,
      });
    }
  }

  withdrawFromAAVE = async () =>  {
    if (this.state.aDaiBalance > 0) {
      if (this.state.flowRoller) {
        let amount = this.state.aDaiBalanceWei.toString();
        console.log(`withdrawing from AAVE...${amount}`);

        await this.state.aDai.methods.approve(this.state.flowRollerAddress, amount).send({ from: this.state.account });

        let withdrawn = await this.state.flowRoller.methods._withdraw(amount, ADDRESSES.tokens.aDai).send({
          from: this.state.account,
        });

        console.log(`withdrawn...${withdrawn}`);
      }
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
          aDaiBalance={this.state.aDaiBalance}
          totalStreamed={this.state.totalStreamed}
          updateFlows={() => this.updateFlows()}
          depositToAAVE={() => this.depositToAAVE()}
          withdrawFromAAVE={() => this.withdrawFromAAVE()}
          flowRollerAddress={this.state.flowRollerAddress}
          sf={this.state.sf}
          ></Main> }
      </div>
    );
  }
}

export default App;
