import { Component } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import FLOW_RATE_CONSTANTS from '../flowRateConstants';

const CONTRACT_ADDRESS = {
  local: '0xe844dF90c946CecD08076D129E14a3bc04C9f5d5',
  kovan: '0xD67d8A4765C08A3dB744b31a7C49868f2df6ecDe'
}
class ModalAddFlow extends Component {

  constructor(props){
    super(props)
    this.state = {
      flowRate: null
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = {
      flowRate: this.state.flowRate
    }
    console.log(formData)

    //make contract call here
    try {
      const flowRateWeiPerDay = Math.round(Number(this.state.flowRate)*FLOW_RATE_CONSTANTS.day) 
      await this.props.currUser.flow({
        recipient: CONTRACT_ADDRESS.kovan,
        flowRate: flowRateWeiPerDay.toString()
      });

      this.props.updateFlows();
    //if successful close
    this.props.onHide();
    } catch(err){
      console.error(err);
    }
 
  };

  handleFormChange = (event) => {
    this.setState({[event.target.name]: event.target.value});
  }

  render(){
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Create Flow</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form 
        onSubmit={this.handleSubmit}>
          <Form.Group controlId="formFlowRate">
            <Form.Label>Flow Rate (per day)</Form.Label>
            <Form.Control placeholder="0.05" name="flowRate" type="number" step="0.001" onChange={(e)=> this.handleFormChange(e)}/>
          </Form.Group>

          <Button variant="primary" type="submit">
              Create
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
   )
  }
}

export default ModalAddFlow;