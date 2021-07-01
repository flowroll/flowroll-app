import AddBoxIcon from '@material-ui/icons/AddBox';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

import { useState } from 'react';

import ModalAddFlow from './ModalAddFlow';
import './Main.scss';

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
      <Card className="flow-card" id={index + '-inflow'}>
        <Card.Body>
        <Card.Title>Sender: {flow.sender}</Card.Title>
        <Card.Text>
          Flow Rate: <span className="inflow-rate">{flow.flowRate.toFixed(3)}/day</span>
        </Card.Text>
      </Card.Body>
      </Card>
    ))
  }

  const renderOutFlows = () => {
    return props.outFlows.map( (flow, index) => (
      <Card className="flow-card" id={index + '-outflow'}>
        <Card.Body>
        <Card.Title>Destination: {flow.receiver}</Card.Title>
        <Card.Text>
          Flow Rate: <span className="outflow-rate">{flow.flowRate.toFixed(3)}/day</span>
        </Card.Text>
      </Card.Body>
      </Card>
    ))
  }
  return (
    <div className="main">
      <h1 className="flows-title">Flows</h1>
      <span className="add-box-icon" onClick={()=> setModalOpen(!modalOpen)}><AddBoxIcon/></span>
      <ModalAddFlow currUser={props.currUser} show={modalOpen} onHide={() => setModalOpen(false)} updateFlows={props.updateFlows}/>
      <div className="filter-block">
        <span>Filters:</span>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.inflow} onClick={() => toggleFilter('inflow')}>Inflow</Button>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.outflow} onClick={() => toggleFilter('outflow')}>Outflow</Button>
      </div>
      {(filters.inflow || !Object.values(filters).includes(true)) && renderInFlows()}
      {(filters.outflow || !Object.values(filters).includes(true)) && renderOutFlows()}
    </div>
  );
}

export default Main;
