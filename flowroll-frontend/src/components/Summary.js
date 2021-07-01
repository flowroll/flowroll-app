import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './Summary.scss';

function Summary(props) {
  return (
    <div className="summary-wrapper">
      <div className="inflow-wrapper">
        <h3>Inflow(DAI/day)</h3>
        <p>{props.totalInFlow.toFixed(3)}</p>
      </div>
      <div style={{ width: 100, height: 100 }}>
        <CircularProgressbar value={100*props.totalInFlow/(props.totalInFlow + props.totalOutFlow)}
        text={Number(props.balance).toFixed(4)}
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
        <h3>Outflow(DAI/day)</h3>
        <p>{props.totalOutFlow.toFixed(3)}</p>
      </div>
    </div>
  );
}

export default Summary;
