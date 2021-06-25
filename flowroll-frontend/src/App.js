import { Component } from 'react';
import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

import './App.scss';
import Header from './components/Header';
import Main from './components/Main';
import Summary from './components/Summary';

import NETWORK_ADDRESSES from './networkAddresses.json';

class App extends Component {
  constructor(props){
    super(props)
    this.state = { 
      account: null,
      web3: null,
      currUser: null,
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
      await sf.initialize();

      if (accounts[0] != undefined) {
        let account = accounts[0];
        
        let currUser = sf.user({
          address: account,
          token: NETWORK_ADDRESSES.kovan // ETHx Kovan Network Token
        });

        this.setState({ account, web3, currUser});

        let details = await currUser.details();

        console.log(`details: ${JSON.stringify(details)}`);

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
        <Summary></Summary>
        <Main currUser={this.state.currUser}></Main>
      </div>
    );
  }
}

export default App;
