import React from 'react';
import './userActivities.css';
import LineChart from '../../components/charts/LineChart';
import { useAtomValue } from "jotai";
import { activityState, modeState } from '../../store'

const UserActivities = (props) => {
    const width = 1100,
          height = 250;
    const activity = useAtomValue(activityState);
    const mode = useAtomValue(modeState);
    return (
            <div id='userActivities' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'} >
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>User Acivities</div>
            <div style={{ overflowX: 'scroll',overflowY:'hidden' }}>
                <LineChart data={activity} mode={mode} width={width} height={height}/>
            </div>
        </div>
    )

}

export default UserActivities;
