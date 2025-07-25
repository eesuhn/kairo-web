import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Note } from '../types';

const getReadableEntityLabel = (label: string): string => {
  const entityLabels: Record<string, string> = {
    PER: 'Person',
    PERSON: 'Person',
    ORG: 'Organization',
    ORGANIZATION: 'Organization',
    LOC: 'Location',
    LOCATION: 'Location',
    GPE: 'Location',
    DATE: 'Date',
    TIME: 'Time',
    MONEY: 'Money',
    PERCENT: 'Percentage',
    field: 'Academic Field',
    task: 'Task',
    product: 'Product',
    algorithm: 'Algorithm',
    metrics: 'Metrics',
    programlang: 'Programming Language',
    conference: 'Conference',
    book: 'Book',
    award: 'Award',
    poem: 'Poem',
    event: 'Event',
    magazine: 'Magazine',
    literarygenre: 'Literary Genre',
    discipline: 'Discipline',
    enzyme: 'Enzyme',
    protein: 'Protein',
    chemicalelement: 'Chemical Element',
    chemicalcompound: 'Chemical Compound',
    astronomicalobject: 'Astronomical Object',
    academicjournal: 'Academic Journal',
    theory: 'Theory',
  };

  return entityLabels[label] || label.charAt(0).toUpperCase() + label.slice(1);
};

interface EntityVisualizationProps {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'note' | 'entity';
  label: string;
  note?: Note;
  entityType?: string;
  count?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  strength: number;
}

export const EntityVisualization: React.FC<EntityVisualizationProps> = ({
  notes,
  onNoteSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(
    null
  );
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 700;

    // Prepare data
    const nodes: Node[] = [];
    const links: Link[] = [];
    const entityTypeNotes = new Map<string, Set<string>>();

    // First pass: count which notes have each entity type
    notes.forEach((note) => {
      note.entities.forEach((entity) => {
        const entityType = entity.label;
        if (
          entityType.toLowerCase() === 'misc' ||
          entityType.toLowerCase() === 'miscellaneous'
        )
          return;

        if (!entityTypeNotes.has(entityType)) {
          entityTypeNotes.set(entityType, new Set());
        }
        entityTypeNotes.get(entityType)!.add(note.id);
      });
    });

    // Create entity nodes only for types that appear in multiple notes
    entityTypeNotes.forEach((noteSet, entityType) => {
      const count = noteSet.size;
      if (count >= 1) {
        nodes.push({
          id: `entity-${entityType}`,
          type: 'entity',
          label: getReadableEntityLabel(entityType),
          count,
          entityType,
        });
      }
    });

    // Second pass: create note nodes and links
    notes.forEach((note) => {
      nodes.push({
        id: `note-${note.id}`,
        type: 'note',
        label:
          note.title.length > 25 ? note.title.slice(0, 25) + '...' : note.title,
        note,
      });

      // Track which entity types we've already linked from this note
      const linkedEntityTypes = new Set<string>();

      note.entities.forEach((entity) => {
        const entityType = entity.label;
        if (
          entityType.toLowerCase() === 'misc' ||
          entityType.toLowerCase() === 'miscellaneous'
        )
          return;

        // Only create link if:
        // 1. This entity type appears in multiple notes (has a node)
        // 2. We haven't already linked this note to this entity type
        if (
          entityTypeNotes.get(entityType)!.size >= 1 &&
          !linkedEntityTypes.has(entityType)
        ) {
          linkedEntityTypes.add(entityType);
          links.push({
            source: `note-${note.id}`,
            target: `entity-${entityType}`,
            strength: 1,
          });
        }
      });
    });

    // Create SVG with zoom behavior
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .call(
        d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          })
      )
      .append('g');

    // Create simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>().radius(40));

    // Create links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#4B5563')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add circles
    node
      .append('circle')
      .attr('r', (d) => (d.type === 'note' ? 15 : 12))
      .attr('fill', (d) => {
        if (d.type === 'note') return '#f032e6';

        const colors: Record<string, string> = {
          PER: '#3B82F6',
          PERSON: '#3B82F6',
          ORG: '#10B981',
          ORGANIZATION: '#10B981',
          LOC: '#8B5CF6',
          LOCATION: '#8B5CF6',
          GPE: '#8B5CF6',
          DATE: '#F59E0B',
          TIME: '#F97316',
          MONEY: '#EAB308',
          PERCENT: '#EC4899',
          field: '#6366F1',
          task: '#06B6D4',
          product: '#14B8A6',
          algorithm: '#8B5CF6',
          metrics: '#F43F5E',
          programlang: '#0EA5E9',
          conference: '#84CC16',
          book: '#D946EF',
          award: '#FACC15',
          poem: '#F472B6',
          event: '#EF4444',
          magazine: '#22C55E',
          literarygenre: '#A855F7',
          discipline: '#3B82F6',
          enzyme: '#059669',
          protein: '#0D9488',
          chemicalelement: '#EA580C',
          chemicalcompound: '#D97706',
          astronomicalobject: '#4F46E5',
          academicjournal: '#0891B2',
          theory: '#7C3AED',
        };

        return colors[d.entityType || ''] || '#6B7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    node
      .append('text')
      .text((d) => d.label)
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#D1D5DB')
      .attr('font-size', '11px')
      .attr('font-weight', (d) => (d.type === 'note' ? 'bold' : 'normal'))
      .style('pointer-events', 'none');

    // Add count labels for entity types
    node
      .filter(
        (d) => d.type === 'entity' && typeof d.count === 'number' && d.count > 0
      )
      .append('text')
      .text((d) => d.count?.toString() || '')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Add click handlers
    node.on('click', (_, d) => {
      if (d.type === 'note' && d.note) {
        onNoteSelect(d.note);
      } else if (d.type === 'entity' && d.entityType) {
        setSelectedEntityType(d.entityType);
        const notesWithEntity = notes.filter((note) =>
          note.entities.some((entity) => entity.label === d.entityType)
        );
        setRelatedNotes(notesWithEntity);
      }
    });

    // Add hover effects
    node
      .on('mouseenter', function (_, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', (d.type === 'note' ? 15 : 12) * 1.2);
      })
      .on('mouseleave', function (_, d) {
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', d.type === 'note' ? 15 : 12);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x || 0)
        .attr('y1', (d) => (d.source as Node).y || 0)
        .attr('x2', (d) => (d.target as Node).x || 0)
        .attr('y2', (d) => (d.target as Node).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [notes, onNoteSelect]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2 font-semibold">
            Nothing to visualize here...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex gap-2 h-full">
        {/* Visualization */}
        <div className="flex-1 overflow-hidden rounded-xl bg-gray-950/50">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Related Notes Panel */}
        {selectedEntityType && relatedNotes.length > 0 && (
          <div className="w-80 bg-gray-800/50 rounded-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {getReadableEntityLabel(selectedEntityType)}
              </h3>
              <button
                onClick={() => {
                  setSelectedEntityType(null);
                  setRelatedNotes([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {relatedNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note)}
                  className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all"
                >
                  <div className="font-medium text-white text-sm truncate">
                    {note.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {note.abstractive_summary.slice(0, 80)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* <div className="ml-2 mt-4 flex items-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span>Entity Types</span>
        </div>
      </div> */}
    </div>
  );
};
