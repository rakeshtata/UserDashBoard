import React from 'react';
import './view2.css';
import PieChart from '../../charts/PieChart';
import { useAtomValue } from "jotai/utils";
import { filteredDataState } from './../../store'

const View2 = () => {
    const data = useAtomValue(filteredDataState);
    const width = 260;
    const height = 260;
    return (
        <div id='view2' className='pane'>
            <div className='header'>Gender</div>
            <PieChart data={data} width={width} height={height} />
        </div>
    )
}

export default View2;
