'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PriceGaugeProps {
  hargaReferensi: number;
  hargaProduk: number;
  hargaRataRataApp?: number;
  isMini?: boolean;
}

export const PriceGauge: React.FC<PriceGaugeProps> = ({
  hargaReferensi,
  hargaProduk,
  hargaRataRataApp,
  isMini = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = isMini ? 120 : 300;
    const height = isMini ? 24 : 60;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine scale domain
    // We want to show a range that includes reference, product price, and app average
    const prices = [hargaReferensi, hargaProduk];
    if (hargaRataRataApp) prices.push(hargaRataRataApp);
    
    const minVal = d3.min(prices)! * 0.8;
    const maxVal = d3.max(prices)! * 1.2;

    const xScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([0, innerWidth]);

    // Background track
    svg.append("rect")
      .attr("width", innerWidth)
      .attr("height", isMini ? 4 : 8)
      .attr("y", innerHeight / 2 - (isMini ? 2 : 4))
      .attr("rx", 4)
      .attr("fill", "rgba(255, 255, 255, 0.1)");

    // Determine color
    let color = "var(--gr-price-fair)";
    if (hargaProduk < hargaReferensi) {
      if (hargaProduk >= hargaReferensi * 0.9) {
        color = "var(--gr-price-warn)";
      } else {
        color = "var(--gr-price-unfair)";
      }
    }

    // Reference marker
    svg.append("line")
      .attr("x1", xScale(hargaReferensi))
      .attr("x2", xScale(hargaReferensi))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.5);

    if (!isMini) {
      svg.append("text")
        .attr("x", xScale(hargaReferensi))
        .attr("y", -2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "8px")
        .attr("font-family", "var(--font-mono)")
        .text("REF");
    }

    // Product price dot/marker
    svg.append("circle")
      .attr("cx", xScale(hargaProduk))
      .attr("cy", innerHeight / 2)
      .attr("r", isMini ? 4 : 8)
      .attr("fill", color)
      .attr("filter", `drop-shadow(0 0 4px ${color})`);

    // App average marker if exists
    if (hargaRataRataApp) {
      svg.append("rect")
        .attr("x", xScale(hargaRataRataApp) - 1)
        .attr("y", innerHeight / 2 - (isMini ? 6 : 10))
        .attr("width", 2)
        .attr("height", isMini ? 12 : 20)
        .attr("fill", "var(--gr-live)")
        .attr("opacity", 0.7);
    }

  }, [hargaReferensi, hargaProduk, hargaRataRataApp, isMini]);

  return (
    <div className="flex flex-col">
      <svg ref={svgRef}></svg>
      {!isMini && (
        <div className="flex justify-between mt-1 px-2">
          <span className="font-mono text-[8px] uppercase tracking-widest text-gr-text-primary/40">
            Keadilan Harga
          </span>
          <span className="font-mono text-[8px] uppercase tracking-widest text-gr-text-primary/40">
            {hargaProduk >= hargaReferensi ? 'Fair' : (hargaProduk >= hargaReferensi * 0.9 ? 'Warning' : 'Unfair')}
          </span>
        </div>
      )}
    </div>
  );
};
