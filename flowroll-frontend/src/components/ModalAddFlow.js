import { Modal } from '@material-ui/core';

function ModalAddFlow(){
//https://material-ui.com/components/modal/
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      {body}
    </Modal>
  )
}