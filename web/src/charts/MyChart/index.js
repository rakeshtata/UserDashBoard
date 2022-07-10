import React, { useEffect } from 'react';
import draw from './vis';

const MyChart = (props) => {
    useEffect(() => {
      draw(props);
    })
    
    return (
        <div className='vis-mychart'/>
    )
}

export default MyChart;
