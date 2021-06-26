import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './Summary.scss';

function Summary() {
  return (
    <div className="summary-wrapper">
      <div className="inflow-wrapper">
        <h3>Inflow(DAI/s)</h3>
        <p>0.13</p>
      </div>
      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar value={66}
        text={'20DAI'}
        styles={buildStyles({
          rotation: 0.5,
          strokeLinecap: 'butt',
          pathColor: '#7EF0B3',
          trailColor: '#F07E7E',
          textColor: '#ffffff',
          textSize: '16px',
        })} />
      </div>
      <div className="outflow-wrapper">
        <h3>Outflow(DAI/s)</h3>
        <p>0.03</p>
      </div>
    </div>
  );
}

export default Summary;
