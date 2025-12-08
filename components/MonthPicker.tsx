import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  value: string; // Format YYYY-MM
  onChange: (value: string) => void;
  variant?: 'input' | 'header'; // 'input' for filters, 'header' for dashboard title
  label?: string;
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, variant = 'input', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [yearStr, monthStr] = value.split('-');
  const currentYear = parseInt(yearStr);
  const currentMonthIndex = parseInt(monthStr) - 1;

  // View state (for navigating years without selecting)
  const [viewYear, setViewYear] = useState(currentYear);

  useEffect(() => {
    setViewYear(currentYear);
  }, [currentYear, isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearChange = (delta: number) => {
    setViewYear(prev => prev + delta);
  };

  const handleMonthSelect = (index: number) => {
    const monthFormatted = String(index + 1).padStart(2, '0');
    onChange(`${viewYear}-${monthFormatted}`);
    setIsOpen(false);
  };

  const formattedDisplay = variant === 'header' 
    ? `${MONTHS_FULL[currentMonthIndex]} de ${currentYear}`
    : `${MONTHS_FULL[currentMonthIndex]} ${currentYear}`;

  return (
    <div className="relative group" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      {variant === 'header' ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors group cursor-default">
          <span className="font-bold text-lg capitalize text-gray-800 tracking-tight">
            {formattedDisplay}
          </span>
          {/* Calendar click disabled for header as requested */}
        </div>
      ) : (
        <>
        {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm transition-all duration-200 outline-none text-left
          ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-gray-300'}`}
        >
          <Calendar size={18} className="text-gray-400" />
          <span className="flex-1 text-left capitalize truncate font-semibold text-gray-900">{formattedDisplay}</span>
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </button>
        </>
      )}

      {/* POPOVER DROPDOWN (Only for Input variant) */}
      {isOpen && variant !== 'header' && (
        <div className={`absolute z-50 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 w-[280px] animate-scale-in origin-top left-0 mt-2`}>
          {/* Header: Year Navigation */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
            <button 
              onClick={() => handleYearChange(-1)}
              className="p-2 hover:bg-gray-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold text-gray-800">{viewYear}</span>
            <button 
              onClick={() => handleYearChange(1)}
              className="p-2 hover:bg-gray-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Grid: Months */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS_SHORT.map((month, index) => {
              const isSelected = viewYear === currentYear && index === currentMonthIndex;
              const isCurrentMonth = 
                new Date().getFullYear() === viewYear && 
                new Date().getMonth() === index;

              return (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={`
                    p-2 rounded-lg text-sm font-semibold capitalize transition-all
                    ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }
                    ${!isSelected && isCurrentMonth ? 'text-blue-600 ring-1 ring-blue-100 bg-blue-50' : ''}
                  `}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;