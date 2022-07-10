import React from 'react';
import './view4.css';
import LineChart from '../../charts/LineChart';
import { useAtomValue } from "jotai/utils";
import { activityState } from './../../store'

const View4 = (props) => {
    const width = 1100,
          height = 250;
    const activity = useAtomValue(activityState);
    return (
        <div id='view4' className='pane' >
            <div className='header'>User Acivities</div>
            <div style={{ overflowX: 'scroll',overflowY:'hidden' }}>
                <LineChart data={activity} width={width} height={height}/>
            </div>
        </div>
    )

}

export default View4;
