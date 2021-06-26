import './Header.scss';
import logo from '../logo.svg';
function Header(props) {
  return (
    <header className="header">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo" />
      </div>
      <div className="header-content">
        <div className="tokens">
          <p>Dai</p>
        </div>
        {props.account ? <p style={{color: 'white'}}>{props.account}</p> :
          <button className="connect-wallet-btn" onClick={() => props.connect()}>Connect Wallet</button> }
        
      </div>
    </header>
  );
}

export default Header;
