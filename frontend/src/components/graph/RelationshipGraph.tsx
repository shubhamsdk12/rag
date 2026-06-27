import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../../types';

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode) => void;
  selectedNodeId: string | null;
}

export default function RelationshipGraph({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId,
}: RelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous renders
    d3.select(svgRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create a container group for zooming
    const g = svg.append('g');

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Color definitions
    const colors: Record<string, string> = {
      Patient: '#E5D3B3', // tan/beige
      Provider: '#10B981', // green
      Claim: '#F59E0B', // gold/yellow
      Service: '#14B8A6', // teal/cyan
      Payment: '#EF4444', // red/coral
    };

    // Prepare links with references to node objects
    const linkData = edges.map((d) => ({
      ...d,
      source: d.source,
      target: d.target,
    }));

    // Prepare nodes
    const nodeData = nodes.map((d) => ({ ...d }));

    // Define simulation
    const simulation = d3
      .forceSimulation<any>(nodeData)
      .force(
        'link',
        d3
          .forceLink<any, any>(linkData)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Arrow markers for links
    g.append('defs')
      .selectAll('marker')
      .data(['normal', 'flagged', 'cross_doc'])
      .enter()
      .append('marker')
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24) // offset to end of node circle
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) =>
        d === 'flagged' ? 'var(--accent-red)' : d === 'cross_doc' ? 'var(--accent-purple)' : '#6B7280'
      );

    // Links group
    const link = g
      .append('g')
      .selectAll('line')
      .data(linkData)
      .enter()
      .append('line')
      .attr('stroke', (d) =>
        d.style === 'flagged'
          ? 'var(--accent-red)'
          : d.style === 'cross_doc'
            ? 'var(--accent-purple)'
            : '#9CA3AF'
      )
      .attr('stroke-width', (d) => (d.style === 'cross_doc' ? 2 : 1.5))
      .attr('stroke-dasharray', (d) =>
        d.style === 'flagged' ? '4 4' : d.style === 'cross_doc' ? '2 2' : 'none'
      )
      .attr('marker-end', (d) => `url(#arrow-${d.style})`);

    // Edge Labels
    const edgeLabel = g
      .append('g')
      .selectAll('text')
      .data(linkData)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-muted)')
      .attr('text-anchor', 'middle')
      .text((d) => d.label);

    // Nodes group
    const node = g
      .append('g')
      .selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        onSelectNode(d);
      })
      .call(
        d3
          .drag<SVGGElement, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Outer circle for node selection highlighting
    node
      .append('circle')
      .attr('r', 22)
      .attr('fill', 'transparent')
      .attr('stroke', (d) => (d.id === selectedNodeId ? 'var(--accent-purple)' : 'transparent'))
      .attr('stroke-width', 2);

    // Inner circle
    node
      .append('circle')
      .attr('r', 18)
      .attr('fill', (d) => colors[d.type] || '#9CA3AF')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))');

    // Inside node label (initial letter or key text)
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', '#ffffff')
      .text((d) => d.type.substring(0, 2).toUpperCase());

    // Below node text labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 32)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--text-primary)')
      .text((d) => d.label);

    // Below node properties or identifiers
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 44)
      .attr('font-size', '9px')
      .attr('fill', 'var(--text-muted)')
      .text((d) => {
        if (d.type === 'Patient') return d.properties.patient_id || '';
        if (d.type === 'Claim') return d.properties.claim_id || '';
        if (d.type === 'Provider') return d.properties.npi || '';
        return '';
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      edgeLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, selectedNodeId, onSelectNode]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
