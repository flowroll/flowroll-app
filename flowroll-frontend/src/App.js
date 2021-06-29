import { Component } from 'react';
import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

import './App.scss';
import Header from './components/Header';
import Main from './components/Main';
import Summary from './components/Summary';

import NETWORK_ADDRESSES from './networkAddresses.json';
import FLOW_RATE_CONSTANTS from './flowRateConstants';

class App extends Component {
  constructor(props){
    super(props)
    this.state = { 
      account: null,
      web3: null,
      currUser: null,
      inFlows: [],
      totalInFlow: 0,
      outFlows: [],
      totalOutFlow: 0,
      balance: 0
    };

    this.connect = this.connect.bind(this);
  }

  connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum);
      const enabledWeb3 = window.ethereum.enable();
      const netId = await web3.eth.net.getId();
      const chainId = await web3.eth.getChainId();
      const accounts = await web3.eth.getAccounts();

      console.log(accounts);

      const sf = new SuperfluidSDK.Framework({
        web3: new Web3(window.ethereum),
      });

      try {
        await sf.initialize();
      } catch(err){
        console.error('SF failed to initialize')
        console.error(err);
      }

      if (accounts[0] !== undefined) {
        let account = accounts[0];
        
        let currUser = sf.user({
          address: account,
          token: NETWORK_ADDRESSES.kovan // ETHx Kovan Network Token
        });

        const balanceWei = await web3.eth.getBalance(accounts[0]);
        console.log("balanceWei:", balanceWei)
        const balance = web3.utils.fromWei(balanceWei)
        console.log('balance:', balance)

        this.setState({ account, web3, currUser, balance});

        let details = await currUser.details();

        console.log(`details: ${JSON.stringify(details)}`);

        if(details && details.cfa && details.cfa.flows){

          let totalInFlow = 0;
          const inFlows = details.cfa.flows.inFlows.map( flow => {
              const flowRate = Number(flow.flowRate)/FLOW_RATE_CONSTANTS.day;
              totalInFlow = totalInFlow + flowRate;
              return({
                receiver: flow.receiver,
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
                flowRate
              })
          })

          this.setState({
            inFlows, totalInFlow, outFlows, totalOutFlow
          })
        }

      }
      else {
        window.alert('Please login with MetaMask');
      }
    }
    else {
      window.alert('Please install MetaMask');
    }
  }
  
  render() {

   return (
      <div className="App">
        <Header account={this.state.account} connect={() => this.connect()}></Header>
        <Summary balance={this.state.balance} totalInFlow={this.state.totalInFlow} totalOutFlow={this.state.totalOutFlow}></Summary>
        {this.state.currUser && <Main currUser={this.state.currUser}></Main> }
      </div>
    );
  }
}

export default App;
