import React, { useEffect } from 'react';
import draw from './vis';

const BarChart = (props) => {
  useEffect(() => {
    draw(props)
  })

  return (
     <div className='vis-barchart'/>
   )
}

 export default BarChart;
