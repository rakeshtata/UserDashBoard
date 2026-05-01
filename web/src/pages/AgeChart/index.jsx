import React from 'react';
import BarChart from '../../components/charts/BarChart';
import './ageChart.css';
import { useAtomValue } from "jotai";
import { filteredDataState, selectedUserState, modeState } from '../../store'

const AgeChart = (props) => {
    const data = useAtomValue(filteredDataState);
    const user = useAtomValue(selectedUserState);
    const mode = useAtomValue(modeState);
    return (
            <div id='ageChart'  className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>Age</div>
            <div className='scroller'>
            <BarChart data={data} selected={user} mode={mode} width={1000} height={550}/>
            </div>
        </div>
    )

}

export default AgeChart
