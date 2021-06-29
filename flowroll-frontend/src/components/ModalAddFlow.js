import { Component } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';


class ModalAddFlow extends Component {

  constructor(props){
    super(props)
    this.state = {
      flowName: '',
      dstAddress: '',
      flowRate: null
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = {
      flowName: this.state.flowName,
      dstAddress: this.state.dstAddress,
      flowRate: this.state.flowRate
    }
    console.log(formData)

    //make contract call here
    try {
      const flowRateWeiPerDay = this.state.flowRate*18/(60*60*24) 
      await this.props.currUser.flow({
        recipient: '0x3905A1CfAe9d84fC25DffEF042f10f07Be9A7d06',
        flowRate: flowRateWeiPerDay.toString()
      });

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
          <Form.Group controlId="formFlowName">
            <Form.Label>Flow name</Form.Label>
            <Form.Control placeholder="Aave Savings Maximiser" name="flowName" onChange={(e)=> this.handleFormChange(e)}/>
          </Form.Group>

          <Form.Group controlId="formFlowDestAddress">
            <Form.Label>Destination Address</Form.Label>
            <Form.Control placeholder="0x3905A1CfAe9d84fC25DffEF042f10f07Be9A7d06" name="dstAddress" onChange={(e)=> this.handleFormChange(e)}/>
          </Form.Group>

          <Form.Group controlId="formFlowRate">
            <Form.Label>Flow Rate (per day)</Form.Label>
            <Form.Control placeholder="0.05" name="flowRate" type="number" onChange={(e)=> this.handleFormChange(e)}/>
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