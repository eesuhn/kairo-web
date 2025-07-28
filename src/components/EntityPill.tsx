import React from 'react';
import { Entity } from '../types';

interface EntityPillProps {
  entity: Entity;
}

const getEntityColor = (label: string): string => {
  const colors: Record<string, string> = {
    PER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PERSON: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ORG: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ORGANIZATION: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    LOC: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    LOCATION: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    GPE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    DATE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    TIME: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    MONEY: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    PERCENT: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    field: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    task: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    product: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    algorithm: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    metrics: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    programlang: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    conference: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    book: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    award: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    poem: 'bg-pink-600/20 text-pink-400 border-pink-600/30',
    event: 'bg-red-500/20 text-red-300 border-red-500/30',
    magazine: 'bg-green-600/20 text-green-400 border-green-600/30',
    literarygenre: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    discipline: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    enzyme: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
    protein: 'bg-teal-600/20 text-teal-400 border-teal-600/30',
    chemicalelement: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
    chemicalcompound: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    astronomicalobject: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30',
    academicjournal: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
    theory: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
  };

  return colors[label] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
};

export const EntityPill: React.FC<EntityPillProps> = ({ entity }) => {
  const colorClass = getEntityColor(entity.label);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-100 hover:scale-105 ${colorClass} `}
      title={`${entity.label} (${entity.confidence ? Math.round(entity.confidence * 100) : 0}% confidence)`}
    >
      {entity.text}
    </span>
  );
};
