import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface RadarDataPoint {
  axis: string;
  value: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  width?: number;
  height?: number;
  levels?: number;
  maxValue?: number;
}

export default function RadarChart({
  data,
  width = 300,
  height = 300,
  levels = 5,
  maxValue = 100,
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth / 2, chartHeight / 2);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const angleSlice = (Math.PI * 2) / data.length;

    // Scale for the radius
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxValue]);

    // Draw the background levels
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    for (let j = 0; j < levels; j++) {
      const levelFactor = radius * ((j + 1) / levels);
      axisGrid
        .selectAll(".levels")
        .data(data)
        .enter()
        .append("line")
        .attr("x1", (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y1", (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("x2", (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr("y2", (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "#e2e8f0")
        .style("stroke-width", "1px");
    }

    // Draw the axes
    const axis = axisGrid
      .selectAll(".axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "#cbd5e1")
      .style("stroke-width", "1px")
      .style("stroke-dasharray", "2,2");

    // Labels
    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "9px")
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", "800")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(maxValue * 1.25) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(maxValue * 1.25) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.axis)
      .style("fill", "#64748b");

    // Radar line generator
    const radarLine = d3
      .lineRadial<RadarDataPoint>()
      .radius((d) => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Draw the radar area
    const blobWrapper = g.append("g").attr("class", "radarWrapper");

    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", radarLine(data))
      .style("fill", "#1e293b")
      .style("fill-opacity", 0.15)
      .append("title")
      .text((d) => "Mastery Map");

    blobWrapper
      .append("path")
      .attr("class", "radarStroke")
      .attr("d", radarLine(data))
      .style("stroke-width", "2px")
      .style("stroke", "#1e293b")
      .style("fill", "none")
      .style("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))");

    // Circles
    blobWrapper
      .selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", 4)
      .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("fill", "#1e293b")
      .style("fill-opacity", 0.8)
      .style("stroke", "white")
      .style("stroke-width", "2px");

  }, [data, width, height, levels, maxValue]);

  return (
    <div className="radar-chart-container flex justify-center items-center overflow-visible">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
}
