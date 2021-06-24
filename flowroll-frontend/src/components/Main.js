import AddBoxIcon from '@material-ui/icons/AddBox';
import './Main.scss';

function Main() {
  return (
    <div className="main">
      <h1 className="flows-title">Flows</h1>
      <span className="add-box-icon"><AddBoxIcon/></span>
      <div className="filter-block">
        <span>Filters:</span>
        <button>Inflow</button>
        <button>Outflow</button>
      </div>
    </div>
  );
}

export default Main;
