
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  ExternalLink,
  Loader2,
  Search,
  Filter,
  Info,
  Tag,
  Lock,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
  Ticket,
  Banknote,
  Plus,
  X,
  Type,
  Link as LinkIcon,
  AlignLeft,
  Calendar as CalIcon
} from 'lucide-react';
import { BusinessEvent, Industry, EventType } from './types';
import { fetchTradeShows } from './services/geminiService';
import { IndustryIcon, TypeIcon } from './components/EventIcon';

const INDUSTRIES: Industry[] = [
  'Major Projects',
  'Manufacturing (Aero/Defence)',
  'Financial Services',
  'Tech & Cyber',
  'Pharma & Life Sciences',
  'Public Sector'
];

const EVENT_TYPES: EventType[] = [
  'Trade Show',
  'Panel Discussion',
  'Invite-Only Dinner',
  'Networking Mixer',
  'Executive Roundtable'
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [manualEvents, setManualEvents] = useState<BusinessEvent[]>(() => {
    const saved = localStorage.getItem('london_elite_manual_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [activeIndustries, setActiveIndustries] = useState<Industry[]>([...INDUSTRIES]);
  const [activeTypes, setActiveTypes] = useState<EventType[]>([...EVENT_TYPES]);
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    industry: INDUSTRIES[0],
    type: EVENT_TYPES[0],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    venue: '',
    description: '',
    websiteUrl: '',
    isInviteOnly: false,
    isFree: true
  });

  const fetchMonthData = useCallback(async (date: Date, forceRefresh = false) => {
    setLoading(true);
    const result = await fetchTradeShows(date.getMonth(), date.getFullYear());
    
    setEvents(prev => {
      const otherMonths = forceRefresh 
        ? prev.filter(e => !isSameMonth(parseISO(e.startDate), date))
        : prev;
        
      const existingIds = new Set(otherMonths.map(s => s.id));
      const newEvents = result.shows.filter(s => !existingIds.has(s.id));
      return [...otherMonths, ...newEvents];
    });
    
    setSources(result.sources);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMonthData(currentDate);
  }, [currentDate, fetchMonthData]);

  useEffect(() => {
    localStorage.setItem('london_elite_manual_events', JSON.stringify(manualEvents));
  }, [manualEvents]);

  const handleRefresh = () => fetchMonthData(currentDate, true);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const allEvents = useMemo(() => [...events, ...manualEvents], [events, manualEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const industryMatch = activeIndustries.includes(e.industry);
      const typeMatch = activeTypes.includes(e.type);
      const costMatch = 
        costFilter === 'all' ? true : 
        costFilter === 'free' ? e.isFree : !e.isFree;
      return industryMatch && typeMatch && costMatch;
    });
  }, [allEvents, activeIndustries, activeTypes, costFilter]);

  const eventsThisMonth = useMemo(() => {
    return filteredEvents.filter(e => {
      const start = parseISO(e.startDate);
      const end = parseISO(e.endDate);
      return (isSameMonth(start, currentDate) || isSameMonth(end, currentDate));
    });
  }, [filteredEvents, currentDate]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => {
      const start = parseISO(e.startDate);
      const end = parseISO(e.endDate);
      return (selectedDate >= start && selectedDate <= end);
    });
  }, [filteredEvents, selectedDate]);

  const toggleIndustry = (industry: Industry) => {
    setActiveIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const toggleType = (type: EventType) => {
    setActiveTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: BusinessEvent = {
      ...formData,
      id: `manual-${Date.now()}`
    };
    setManualEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      industry: INDUSTRIES[0],
      type: EVENT_TYPES[0],
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      venue: '',
      description: '',
      websiteUrl: '',
      isInviteOnly: false,
      isFree: true
    });
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getFormatBadgeStyles = (type: EventType) => {
    switch (type) {
      case 'Invite-Only Dinner': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Executive Roundtable': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Panel Discussion': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Networking Mixer': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  const getTypeFilterStyles = (type: EventType, isActive: boolean) => {
    if (!isActive) return 'bg-white border-slate-200 text-slate-400 opacity-60 grayscale';
    switch (type) {
      case 'Invite-Only Dinner': return 'bg-amber-500 border-amber-600 text-white shadow-amber-200 shadow-md';
      case 'Executive Roundtable': return 'bg-rose-500 border-rose-600 text-white shadow-rose-200 shadow-md';
      case 'Panel Discussion': return 'bg-blue-500 border-blue-600 text-white shadow-blue-200 shadow-md';
      case 'Networking Mixer': return 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 shadow-md';
      default: return 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-200 shadow-md';
    }
  };

  const getDotColor = (type: EventType) => {
    switch (type) {
      case 'Invite-Only Dinner': return 'bg-amber-400';
      case 'Executive Roundtable': return 'bg-rose-400';
      case 'Panel Discussion': return 'bg-blue-400';
      case 'Networking Mixer': return 'bg-emerald-400';
      default: return 'bg-indigo-400';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-full md:w-80 p-6 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 overflow-y-auto z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">London Elite</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Networking & Expos</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 mb-8 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Event
        </button>

        <div className="mb-8">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Banknote size={14} className="text-indigo-400" /> Cost Access
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(['all', 'free', 'paid'] as const).map((cost) => (
              <button
                key={cost}
                onClick={() => setCostFilter(cost)}
                className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                  costFilter === cost 
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cost}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Filter size={14} className="text-indigo-400" /> Sector Filter
          </h2>
          <div className="space-y-1.5">
            {INDUSTRIES.map(industry => (
              <button
                key={industry}
                onClick={() => toggleIndustry(industry)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                  activeIndustries.includes(industry)
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeIndustries.includes(industry) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <IndustryIcon industry={industry} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold leading-tight">{industry}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Tag size={14} className="text-indigo-400" /> Format Filter
          </h2>
          <div className="grid grid-cols-1 gap-1.5">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${getTypeFilterStyles(type, activeTypes.includes(type))}`}
              >
                <TypeIcon type={type} className={`w-4 h-4 ${activeTypes.includes(type) ? 'text-white' : 'text-slate-400'}`} />
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 mb-2 font-bold text-xs uppercase tracking-wider">
              <Info size={14} className="text-indigo-500" />
              <span>Verified Search</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
              Elite tracking of London events. Verified free and paid access.
            </p>
            {sources.length > 0 && (
              <div className="space-y-1.5">
                {sources.slice(0, 3).map((chunk, i) => chunk.web && (
                  <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors truncate p-1 hover:bg-indigo-50 rounded">
                    <ExternalLink size={10} /> {chunk.web.title || 'Official Source'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 lg:p-10 h-screen overflow-hidden">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto">
            <button 
              onClick={() => setView('calendar')} 
              className={`flex items-center gap-2 flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CalendarDays size={18} /> Calendar
            </button>
            <button 
              onClick={() => setView('list')} 
              className={`flex items-center gap-2 flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={18} /> Directory
            </button>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={prevMonth} className="p-3.5 hover:bg-slate-50 text-slate-400 border-r border-slate-100 transition-colors"><ChevronLeft size={20} /></button>
              <span className="px-8 py-3.5 font-extrabold text-slate-900 min-w-[180px] text-center text-sm uppercase tracking-widest">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button onClick={nextMonth} className="p-3.5 hover:bg-slate-50 text-slate-400 border-l border-slate-100 transition-colors"><ChevronRight size={20} /></button>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className={`p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              title="Refresh Event Data"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin text-indigo-500' : ''} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {view === 'calendar' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
              {/* Calendar Column */}
              <div className="xl:col-span-8 flex flex-col h-full">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {calendarDays.map((day) => {
                      const dayEvents = filteredEvents.filter(e => {
                        const start = parseISO(e.startDate);
                        const end = parseISO(e.endDate);
                        return isSameDay(day, start) || (day > start && day <= end);
                      });
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSel = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`min-h-[130px] p-4 border-b border-r border-slate-100 relative cursor-pointer transition-all duration-300 ${
                            !isCurrentMonth ? 'bg-slate-50/20 opacity-30' : 'hover:bg-indigo-50/30'
                          } ${isSel ? 'bg-indigo-50/60 ring-2 ring-inset ring-indigo-200' : ''}`}
                        >
                          <span className={`text-[13px] font-black ${isToday(day) ? 'bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
                            {format(day, 'd')}
                          </span>
                          <div className="mt-4 space-y-1.5">
                            {dayEvents.slice(0, 3).map(e => (
                              <div 
                                key={e.id} 
                                className={`h-1.5 w-full rounded-full ${getDotColor(e.type)} shadow-sm transition-transform hover:scale-x-105`} 
                                title={`${e.name} (${e.type})`} 
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] font-black text-slate-300 text-center uppercase">
                                +{dayEvents.length - 3} MORE
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail Sidebar */}
              <div className="xl:col-span-4 h-full">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-2xl text-slate-900 tracking-tight">Events Portal</h3>
                      <span className="bg-indigo-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-100">{selectedDateEvents.length}</span>
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon size={12} className="text-indigo-500" />
                      {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                    {selectedDateEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <Search size={32} className="opacity-20" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-center leading-loose px-10">No specific networking identified for this date</p>
                      </div>
                    ) : (
                      selectedDateEvents.map(e => (
                        <div key={e.id} className="group relative p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-500">
                          <div className="flex items-start gap-5">
                            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 flex-shrink-0">
                              <TypeIcon type={e.type} className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${getFormatBadgeStyles(e.type)}`}>
                                  {e.type}
                                </span>
                                {e.isFree && (
                                  <span className="flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm">
                                    <Ticket size={10} /> FREE
                                  </span>
                                )}
                                {e.isInviteOnly && (
                                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm">
                                    <Lock size={10} /> ACCESS REQ
                                  </span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-base leading-snug mb-3 line-clamp-2">{e.name}</h4>
                              <p className="text-[11px] text-slate-500 font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <MapPin size={12} className="text-indigo-500" /> {e.venue}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 italic bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                                {e.description}
                              </p>
                              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{e.industry}</span>
                                <a href={e.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-all p-2 hover:bg-indigo-50 rounded-xl">
                                  <ExternalLink size={18} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
              {eventsThisMonth.length === 0 && !loading ? (
                <div className="col-span-full py-40 text-center bg-white rounded-[3.5rem] border border-slate-200 border-dashed">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Search size={48} className="text-slate-100" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">No Events Tracked</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">Try refreshing the data feed or broaden your filters.</p>
                </div>
              ) : (
                eventsThisMonth.map(e => (
                  <div key={e.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group relative overflow-hidden">
                    <div className="absolute top-8 right-8 flex flex-col gap-2 items-end z-10">
                      {e.isFree && (
                        <div className="px-3.5 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-2xl border border-emerald-400 flex items-center gap-2 shadow-xl shadow-emerald-200">
                          <Ticket size={12} /> FREE ENTRY
                        </div>
                      )}
                      {e.isInviteOnly && (
                        <div className="px-3.5 py-1.5 bg-amber-500 text-white text-[10px] font-black rounded-2xl border border-amber-400 flex items-center gap-2 shadow-xl shadow-amber-200">
                          <Lock size={12} /> INVITE ONLY
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-5 mb-8">
                      <div className="p-4.5 bg-indigo-50 rounded-[1.5rem] text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <IndustryIcon industry={e.industry} className="w-8 h-8" />
                      </div>
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-xl border ${getFormatBadgeStyles(e.type)} mb-2 inline-block`}>
                          {e.type}
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] block ml-1">{e.industry}</p>
                      </div>
                    </div>

                    <h3 className="font-black text-2xl text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors leading-[1.15] min-h-[4rem] line-clamp-2 tracking-tight">
                      {e.name}
                    </h3>
                    
                    <div className="space-y-3.5 mb-8 bg-slate-50/70 p-6 rounded-[2rem] border border-slate-100 shadow-inner relative">
                      <div className="flex items-center gap-4 text-sm font-bold text-slate-700">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <CalendarIcon size={18} className="text-indigo-500" />
                        </div>
                        <span className="tracking-tight">{format(parseISO(e.startDate), 'MMM do')} — {format(parseISO(e.endDate), 'MMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-bold text-slate-700">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <MapPin size={18} className="text-indigo-500" />
                        </div>
                        <span className="truncate tracking-tight">{e.venue}</span>
                      </div>
                    </div>

                    <p className="text-[14px] text-slate-500 mb-10 leading-relaxed flex-1 font-medium line-clamp-4 px-1 italic border-l-4 border-indigo-100 pl-6">
                      {e.description}
                    </p>

                    <a
                      href={e.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl text-[13px] transition-all duration-500 text-center flex items-center justify-center gap-3 shadow-xl hover:shadow-indigo-200 uppercase tracking-[0.2em]"
                    >
                      {e.isFree ? 'Free Registration' : 'Official Page'} <ExternalLink size={20} />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col my-8">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Elite Event</h2>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Populate networking hub</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleAddEvent} className="p-8 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Type size={12} className="text-indigo-500" /> Event Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Defence Strategy Summit 2024"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Tag size={12} className="text-indigo-500" /> Industry Sector
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value as Industry})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  >
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Filter size={12} className="text-indigo-500" /> Event Format
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as EventType})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <MapPin size={12} className="text-indigo-500" /> Venue Location
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    placeholder="e.g. ExCeL London, Royal Docks"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <CalIcon size={12} className="text-indigo-500" /> Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <CalIcon size={12} className="text-indigo-500" /> End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <AlignLeft size={12} className="text-indigo-500" /> Brief Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Key networking highlights and high-level agenda..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <LinkIcon size={12} className="text-indigo-500" /> Website URL
                </label>
                <input
                  required
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Free Access</span>
                  <input 
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({...formData, isFree: e.target.checked})}
                    className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Invite Only</span>
                  <input 
                    type="checkbox"
                    checked={formData.isInviteOnly}
                    onChange={(e) => setFormData({...formData, isInviteOnly: e.target.checked})}
                    className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Confirm Event Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 20px;
          border: 2px solid #F8FAFC;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
};

export default App;
