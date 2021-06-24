import './Header.scss';
import logo from '../logo.svg';
function Header() {
  return (
    <header className="header">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo" />
      </div>
      <div className="header-content">
        <div className="tokens">
          <p>Dai</p>
        </div>
        <button className="connect-wallet-btn">Connect Wallet</button>
      </div>
    </header>
  );
}

export default Header;
