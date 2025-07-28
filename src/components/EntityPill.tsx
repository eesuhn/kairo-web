import React from 'react';
import { Entity } from '../types';

interface EntityPillProps {
  entity: Entity;
}

const getEntityColor = (label: string): string => {
  const colors: Record<string, string> = {
    PER: 'bg-blue-100 text-blue-800 border-blue-200',
    PERSON: 'bg-blue-100 text-blue-800 border-blue-200',
    ORG: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ORGANIZATION: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    LOC: 'bg-purple-100 text-purple-800 border-purple-200',
    LOCATION: 'bg-purple-100 text-purple-800 border-purple-200',
    GPE: 'bg-purple-100 text-purple-800 border-purple-200',
    DATE: 'bg-amber-100 text-amber-800 border-amber-200',
    TIME: 'bg-orange-100 text-orange-800 border-orange-200',
    MONEY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PERCENT: 'bg-pink-100 text-pink-800 border-pink-200',
    field: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    task: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    product: 'bg-teal-100 text-teal-800 border-teal-200',
    algorithm: 'bg-violet-100 text-violet-800 border-violet-200',
    metrics: 'bg-rose-100 text-rose-800 border-rose-200',
    programlang: 'bg-sky-100 text-sky-800 border-sky-200',
    conference: 'bg-lime-100 text-lime-800 border-lime-200',
    book: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    award: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    poem: 'bg-pink-100 text-pink-800 border-pink-200',
    event: 'bg-red-100 text-red-800 border-red-200',
    magazine: 'bg-green-100 text-green-800 border-green-200',
    literarygenre: 'bg-purple-100 text-purple-800 border-purple-200',
    discipline: 'bg-blue-100 text-blue-800 border-blue-200',
    enzyme: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    protein: 'bg-teal-100 text-teal-800 border-teal-200',
    chemicalelement: 'bg-orange-100 text-orange-800 border-orange-200',
    chemicalcompound: 'bg-amber-100 text-amber-800 border-amber-200',
    astronomicalobject: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    academicjournal: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    theory: 'bg-violet-100 text-violet-800 border-violet-200',
  };
  return colors[label] || 'bg-slate-100 text-slate-800 border-slate-200';
};

export const EntityPill: React.FC<EntityPillProps> = ({ entity }) => {
  const colorClass = getEntityColor(entity.label);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-100 hover:scale-105 ${colorClass} `}
    >
      {entity.text}
    </span>
  );
};
