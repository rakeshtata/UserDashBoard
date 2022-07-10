import React, { useEffect } from 'react';
import draw from './vis';

const ScatterPlot = (props) => {

    useEffect(() => {
      draw(props)
    })

    return (
        <div className='vis-scatterplot'/>
    )

}

export default ScatterPlot;
