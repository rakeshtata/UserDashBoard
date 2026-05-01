import React from 'react';
import './genderChart.css';
import PieChart from '../../components/charts/PieChart';
import { useAtomValue } from "jotai";
import { filteredDataState, modeState } from '../../store'

const GenderChart = () => {
    const data = useAtomValue(filteredDataState);
    const mode = useAtomValue(modeState);
    const width = 260;
    const height = 260;
    return (
        <div id='genderChart' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>Gender</div>
            <PieChart data={data} mode={mode} width={width} height={height} />
        </div>
    )
}

export default GenderChart;
