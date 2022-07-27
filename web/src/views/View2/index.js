import React from 'react';
import './view2.css';
import PieChart from '../../charts/PieChart';
import { useAtomValue } from "jotai/utils";
import { filteredDataState, modeState } from './../../store'

const View2 = () => {
    const data = useAtomValue(filteredDataState);
    const mode = useAtomValue(modeState);
    const width = 260;
    const height = 260;
    return (
        <div id='view2' className={mode === "dark"? 'pane pane_dark' : 'pane pane_light'}>
            <div className={mode === "dark"? 'header header_dark' : 'header header_light'}>Gender</div>
            <PieChart data={data} mode={mode} width={width} height={height} />
        </div>
    )
}

export default View2;
