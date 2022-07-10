import React from 'react';
import BarChart from '../../charts/BarChart';
import './view5.css';
import { useAtomValue } from "jotai/utils";
import { filteredDataState } from './../../store'

const View5 = (props) => {
    const data = useAtomValue(filteredDataState);
    return (
        <div id='view5' className='pane'>
            <div className='header'>Age</div>
            <div style={{ overflowX: 'scroll',overflowY:'hidden' }}>
            <BarChart data={data} width={1000} height={550}/>
            </div>
        </div>
    )

}

export default View5
