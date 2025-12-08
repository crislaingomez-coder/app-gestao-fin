import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  required?: boolean;
  label?: string;
}

const DAYS_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, required, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value or default to today
  const dateObj = value ? new Date(value + 'T12:00:00') : new Date();
  
  // View State (Year/Month being viewed in calendar)
  const [viewYear, setViewYear] = useState(dateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(dateObj.getMonth());

  // Update view when value changes externaly
  useEffect(() => {
    if (value) {
        const d = new Date(value + 'T12:00:00');
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  // Calendar Grid Generation
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sunday

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  
  // Generate blanks for start of grid
  const blanks = Array(firstDay).fill(null);
  // Generate days
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDateDisplay = (isoDate: string) => {
      if (!isoDate) return 'Selecione uma data';
      const [y, m, d] = isoDate.split('-');
      return `${d}/${m}/${y}`;
  };

  return (
    <div className="relative group" ref={containerRef}>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">{label || 'Data'}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 bg-white border rounded-2xl transition-all duration-200 outline-none text-left shadow-sm
        ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-2">
           <Calendar size={18} className="text-gray-400" />
           <span className="text-gray-900 font-semibold">{formatDateDisplay(value)}</span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl overflow-hidden w-[320px] animate-scale-in origin-top-left">
           {/* Modern Header */}
           <div className="bg-slate-50 p-4 border-b border-gray-100 flex items-center justify-between">
             <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all"><ChevronLeft size={18}/></button>
             <span className="font-bold text-slate-700 capitalize text-sm tracking-wide">{MONTHS[viewMonth]} <span className="text-slate-400">{viewYear}</span></span>
             <button onClick={handleNextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all"><ChevronRight size={18}/></button>
           </div>

           <div className="p-4">
                {/* Week Days */}
                <div className="grid grid-cols-7 mb-3">
                    {DAYS_WEEK.map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-gray-400 tracking-wider">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                    
                    {days.map(day => {
                        const isSelected = 
                            value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        
                        const isToday = 
                            new Date().getDate() === day &&
                            new Date().getMonth() === viewMonth &&
                            new Date().getFullYear() === viewYear;

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleSelectDay(day)}
                                className={`
                                    h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                    ${!isSelected && isToday ? 'text-blue-600 font-bold ring-2 ring-inset ring-blue-100' : ''}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;