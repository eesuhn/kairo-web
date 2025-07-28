import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import * as d3 from 'd3';
import { Note } from '../types';
import { getReadableEntityLabel, getEntityColor } from '../utils/entityLabels';

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

  const { nodes, links } = useMemo(() => {
    if (notes.length === 0) return { nodes: [], links: [] };

    const nodes: Node[] = [];
    const links: Link[] = [];
    const entityTypeNotes = new Map<string, Set<string>>();

    // Count entity occurrences
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

    // Create entity nodes
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

    // Create note nodes and links
    notes.forEach((note) => {
      nodes.push({
        id: `note-${note.id}`,
        type: 'note',
        label:
          note.title.length > 25 ? note.title.slice(0, 25) + '...' : note.title,
        note,
      });

      const linkedEntityTypes = new Set<string>();
      note.entities.forEach((entity) => {
        const entityType = entity.label;
        if (
          entityType.toLowerCase() === 'misc' ||
          entityType.toLowerCase() === 'miscellaneous' ||
          linkedEntityTypes.has(entityType)
        )
          return;

        if (entityTypeNotes.get(entityType)!.size >= 1) {
          linkedEntityTypes.add(entityType);
          links.push({
            source: `note-${note.id}`,
            target: `entity-${entityType}`,
            strength: 1,
          });
        }
      });
    });

    return { nodes, links };
  }, [notes]);

  const handleEntityTypeClick = useCallback(
    (entityType: string) => {
      setSelectedEntityType(entityType);
      const notesWithEntity = notes.filter((note) =>
        note.entities.some((entity) => entity.label === entityType)
      );
      setRelatedNotes(notesWithEntity);
    },
    [notes]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedEntityType(null);
    setRelatedNotes([]);
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 700;

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
        return getEntityColor(d.entityType || '');
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

    // Add count labels
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
        handleEntityTypeClick(d.entityType);
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
  }, [nodes, links, onNoteSelect, handleEntityTypeClick]);

  if (notes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2 text-lg font-semibold">
            Nothing to visualize here...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-2xl border border-gray-700/50 bg-gray-900/40 p-6 backdrop-blur-sm">
      <div className="flex h-full gap-2">
        <div className="flex-1 overflow-hidden rounded-xl bg-gray-950/50">
          <svg ref={svgRef} className="h-full w-full" />
        </div>

        {selectedEntityType && relatedNotes.length > 0 && (
          <div className="w-80 overflow-y-auto rounded-xl bg-gray-800/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {getReadableEntityLabel(selectedEntityType)}
              </h3>
              <button
                onClick={handleClosePanel}
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
                  className="w-full rounded-lg bg-gray-700/50 p-3 text-left transition-all hover:bg-gray-700"
                >
                  <div className="truncate text-sm font-medium text-white">
                    {note.title}
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-400">
                    {note.abstractive_summary.slice(0, 80)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
