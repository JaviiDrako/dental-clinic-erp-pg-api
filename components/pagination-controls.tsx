'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationControlsProps) {
  // Calcular items mostrados
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar números de página con lógica mejorada
  const getPageNumbers = () => {
    const delta = 2; // Números a mostrar antes y después de la página actual
    const range = [];
    const rangeWithDots: (number | string)[] = [];
    let previousPage: number | undefined;

    // Siempre mostrar primera y última página, más las cercanas a la actual
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    // Agregar puntos suspensivos donde haya saltos
    range.forEach((page) => {
      if (previousPage) {
        if (page - previousPage === 2) {
          rangeWithDots.push(previousPage + 1);
        } else if (page - previousPage !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(page);
      previousPage = page;
    });

    return rangeWithDots;
  };

  // Si no hay páginas, no mostrar controles
  if (totalPages === 0) {
    return (
      <div className="flex items-center justify-between gap-4 mt-6 p-4 border-t">
        <p className="text-sm text-muted-foreground">No hay registros para mostrar</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-6 p-4 border-t">
      <p className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => 
            page === '...' ? (
              <span key={`dots-${index}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
