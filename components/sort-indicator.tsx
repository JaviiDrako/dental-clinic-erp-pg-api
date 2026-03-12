'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

interface SortIndicatorProps {
  direction: 'asc' | 'desc';
  sortBy: string;
  onToggleDirection: () => void;
  onToggleShow?: () => void;
  isVisible?: boolean;
}

export function SortIndicator({ 
  direction, 
  sortBy, 
  onToggleDirection, 
  onToggleShow,
  isVisible = false 
}: SortIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <span className="font-medium text-blue-900">
        Ordenando por: <span className="font-bold">{sortBy}</span>
      </span>
      <button
        onClick={onToggleDirection}
        className="flex items-center gap-1 ml-2 px-2 py-1 rounded hover:bg-blue-100 transition"
        title={`Cambiar a orden ${direction === 'asc' ? 'descendente' : 'ascendente'}`}
      >
        {direction === 'asc' ? (
          <ArrowUp className="w-4 h-4 text-blue-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-blue-600 font-medium">
          {direction === 'asc' ? 'Ascendente' : 'Descendente'}
        </span>
      </button>
      {onToggleShow && (
        <button
          onClick={onToggleShow}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800"
        >
          Ocultar
        </button>
      )}
    </div>
  );
}
