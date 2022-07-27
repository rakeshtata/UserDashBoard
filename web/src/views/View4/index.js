import React from 'react';
import './view4.css';
import LineChart from '../../charts/LineChart';
import { useAtomValue } from "jotai/utils";
import { activityState, modeState } from './../../store'

const View4 = (props) => {
    const width = 1100,
          height = 250;
    const activity = useAtomValue(activityState);
    const mode = useAtomValue(modeState);
    return (
        <div id='view4' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'} >
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>User Acivities</div>
            <div style={{ overflowX: 'scroll',overflowY:'hidden' }}>
                <LineChart data={activity} mode={mode} width={width} height={height}/>
            </div>
        </div>
    )

}

export default View4;
