import React, { useEffect } from 'react';
import draw from './vis';

const LineChart = (props) => {
    useEffect(() => {
      draw(props);
    })
    return (
        <div className='vis-linechart'/>
    )
}

export default LineChart;
