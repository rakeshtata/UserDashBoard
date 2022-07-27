import * as d3 from 'd3';
import './style.css';

const draw = (props) => {
    d3.select('.vis-barchart > *').remove();
    const data = props.data?[...props.data]:[];
    const mode = props.mode;
    const selected = props.selected;
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = props.width - margin.left - margin.right;
    const height = props.height - margin.top - margin.bottom;
    let svg = d3.select('.vis-barchart').append('svg')
            .attr('width',width + margin.left + margin.right)
            .attr('height',height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    // data.forEach(function(d) {
    //     d.age = +d.age;
    // });

    // Scale the range of the data in the domains
    let x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
    let y = d3.scaleLinear()
          .range([height, 0]);
    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.age; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("fill", (d) => mode === 'dark' ? (d.id === selected.id?'#cb2b83':'#75204f') : ( d.id === selected.id?'#65b7f3':'steelblue'))
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.age); })
        .attr("height", function(d) { return height - y(d.age); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axisBlue")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .attr("class", "axisBlue")
        .call(d3.axisLeft(y));
}

export default draw;
