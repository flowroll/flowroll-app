import './Header.scss';
import logo from '../logo.svg';
import { useState } from 'react';

function Header(props) {
  const [connecting, setConnecting] = useState(false);

  const connect = () => {
    setConnecting(true);
    props.connect();
  }

  return (
    <header className="header">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo" />
      </div>
      <div className="header-content">


        {props.account && <span style={{color: 'white', float: 'right'}}>{props.account}</span> }
        {!props.account && !connecting && <button className="connect-wallet-btn" onClick={() => connect()}>Connect Wallet</button> }
        {!props.account && connecting && <span style={{color: 'white', float: 'right'}}>Connecting</span>}
        
      </div>
    </header>
  );
}

export default Header;
