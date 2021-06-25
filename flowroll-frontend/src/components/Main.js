import AddBoxIcon from '@material-ui/icons/AddBox';
import Button from 'react-bootstrap/Button';
import { useState } from 'react';

import ModalAddFlow from './ModalAddFlow';
import './Main.scss';

function Main() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    inflow: false,
    outflow: false
  });

  const toggleFilter = (filterName) => {
    setFilters({
      ...filters,
      [filterName]: !filters[filterName]
    })
  }

  return (
    <div className="main">
      <h1 className="flows-title">Flows</h1>
      <span className="add-box-icon" onClick={()=> setModalOpen(!modalOpen)}><AddBoxIcon/></span>
      <ModalAddFlow show={modalOpen} onHide={() => setModalOpen(false)}/>
      <div className="filter-block">
        <span>Filters:</span>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.inflow} onClick={() => toggleFilter('inflow')}>Inflow</Button>
        <Button size="sm" variant="outline-primary" className="ml-2" active={filters.outflow} onClick={() => toggleFilter('outflow')}>Outflow</Button>
      </div>
    </div>
  );
}

export default Main;
