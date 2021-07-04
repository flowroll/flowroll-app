import AddBoxIcon from '@material-ui/icons/AddBox';
import EditIcon from '@material-ui/icons/Edit';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';

import { useState } from 'react';

import ModalAddOrEditFlow from './ModalAddOrEditFlow';
import './Main.scss';

import ADDRESSES from '../addresses.json';
import FLOW_RATE_CONSTANTS from '../flowRateConstants';

function Main(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    inflow: false,
    outflow: false
  });

  const toggleFilter = (filterName) => {
    console.log(filters)

    setFilters({
      ...filters,
      [filterName]: !filters[filterName]
    })
  }
  

  const renderInFlows = () => {
    return props.inFlows.map( (flow, index) => (
      <Card className="flow-card" id={index + '-inflow'} key={index}>
        <Card.Body>
        <Card.Title>Income <span className="address">FROM: {flow.sender}</span></Card.Title>
        <Card.Text>
          Receiving <span className="inflow-rate">{flow.flowRate ? flow.flowRate.toFixed(4) : "..."} DAI/day</span>
          <br></br>Last updated <span className="saving-amount">{flow.timestamp}</span>
        </Card.Text>
      </Card.Body>
      </Card>
    ))
  }

  const renderOutFlows = () => {
    return props.outFlows.map( (flow, index) => (
      <Card className="flow-card" id={index + '-outflow'} key={index}>
        <Card.Body>
        <Card.Title>Savings <span className="address">TO: {flow.receiver} (flowroll contract)</span></Card.Title>
        <Card.Text>
          Saving <span className="outflow-rate">{flow.flowRate ? flow.flowRate.toFixed(4) : "..."} DAI/day</span>
          <br></br>Total streamed <span className="saving-amount">{props.totalStreamed ? props.totalStreamed : "..." } DAI</span>
          <br></br>Earning interest on <span className="saving-amount">{props.aDaiBalance ? props.aDaiBalance : "..." } DAI</span>
          <br></br>Last updated <span className="saving-amount">{flow.timestamp}</span>
        </Card.Text>
        {flow.receiver === props.flowRollerAddress && <ButtonGroup>
            <Button className="mr-2" onClick={() => props.depositToAAVE()}>Deposit to AAVE</Button>
            <Button onClick={() => props.withdrawFromAAVE()}>Withdraw from AAVE</Button>
          </ButtonGroup>}
      </Card.Body>
      </Card>
    ))
  }

  const getIcon = () => {
    if (props.outFlows.some(flow => flow.isSavings)) {
      return <EditIcon/>;
    }
    else {
      return <AddBoxIcon/>;
    }
  }

  const getTitle = () => {
    if (props.outFlows.some(flow => flow.isSavings)) {
      return "Edit savings flow";
    }
    else {
      return "Create new savings flow";
    }
  }

  return (
    <div className="main">
      <h1 className="flows-title">Flows</h1>
      <span className="add-box-icon" title={getTitle()} onClick={()=> setModalOpen(!modalOpen)}>{getIcon()}</span>
      <ModalAddOrEditFlow 
        currUser={props.currUser} 
        show={modalOpen} onHide={() => setModalOpen(false)} 
        flowRollerAddress={props.flowRollerAddress}
        updateFlows={props.updateFlows}
        sf={props.sf}
        outFlows={props.outFlows}/>
      <div className="filter-block">
        <span>Filters:</span>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.inflow} onClick={() => toggleFilter('inflow')}>IN</Button>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.outflow} onClick={() => toggleFilter('outflow')}>OUT</Button>
      </div>
      {(filters.inflow || !Object.values(filters).includes(true)) && renderInFlows()}
      {(filters.outflow || !Object.values(filters).includes(true)) && renderOutFlows()}
    </div>
  );
}

export default Main;
