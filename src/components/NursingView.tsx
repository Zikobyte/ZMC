import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Activity, 
  Pill, 
  Syringe, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdmittedPatientsView from './nursing/AdmittedPatientsView';
import DetainedPatientsView from './nursing/DetainedPatientsView';
import NurseDispensingView from './nursing/NurseDispensingView';
import InjectionRecordsView from './nursing/InjectionRecordsView';

export type NursingSubTab = 'admitted-patients' | 'detained-patients' | 'nurse-dispensing' | 'injection-records';

interface NursingViewProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function NursingView({ activeTab = 'admitted-patients', onTabChange }: NursingViewProps) {
  // Normalize active tab
  const getInitialTab = (): NursingSubTab => {
    if (activeTab === 'detained-patients') return 'detained-patients';
    if (activeTab === 'nurse-dispensing') return 'nurse-dispensing';
    if (activeTab === 'injection-records') return 'injection-records';
    return 'admitted-patients';
  };

  const [currentTab, setCurrentTab] = useState<NursingSubTab>(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (
      activeTab === 'admitted-patients' ||
      activeTab === 'detained-patients' ||
      activeTab === 'nurse-dispensing' ||
      activeTab === 'injection-records'
    ) {
      setCurrentTab(activeTab as NursingSubTab);
    }
  }, [activeTab]);

  const handleTabSwitch = (tab: NursingSubTab) => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const navItems = [
    {
      id: 'admitted-patients' as NursingSubTab,
      label: 'Admitted patients',
      icon: BedDouble,
      description: 'Inpatient ward admissions, bed tracking, and ongoing inpatient nursing care.',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    {
      id: 'detained-patients' as NursingSubTab,
      label: 'Detained patients',
      icon: Activity,
      description: 'Short-stay observation unit, emergency detention, and clinical observation records.',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200'
    },
    {
      id: 'nurse-dispensing' as NursingSubTab,
      label: 'Nurse dispensing',
      icon: Pill,
      description: 'Ward medication administration, bedside dosage administration, and nurse inventory dispensing.',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    },
    {
      id: 'injection-records' as NursingSubTab,
      label: 'Injection records',
      icon: Syringe,
      description: 'Injectable medication administration, immunization tracking, and injection registry.',
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200'
    }
  ];

  const currentNav = navItems.find(n => n.id === currentTab) || navItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#181D27] via-[#222834] to-[#181D27] border border-[#2e3646] rounded-3xl p-6 shadow-sm text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#2A758C]/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2A758C] text-white border border-[#38bdf8]/30">
                Nursing Department
              </span>
              <span className="text-xs text-slate-400 font-medium">Inpatient & Clinical Nursing Unit</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <CurrentIcon className="h-6 w-6 text-[#38bdf8]" />
              <span>{currentNav.label}</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {currentNav.description}
            </p>
          </div>

          {/* Tab buttons */}
          <div className="department-page-nav flex items-center gap-2 bg-[#121620] p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nurse-nav-${item.id}`}
                  onClick={() => handleTabSwitch(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/40 font-black scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      {currentTab === 'admitted-patients' ? (
        <AdmittedPatientsView />
      ) : currentTab === 'detained-patients' ? (
        <DetainedPatientsView />
      ) : currentTab === 'nurse-dispensing' ? (
        <NurseDispensingView />
      ) : currentTab === 'injection-records' ? (
        <InjectionRecordsView />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          {/* Sub-header & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2A758C]/10 border border-[#2A758C]/20 flex items-center justify-center text-[#2A758C]">
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{currentNav.label}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Page initialized and ready for department specifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${currentNav.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white transition-all w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Ready State Placeholder Panel */}
          <div className="py-12 px-6 my-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#2A758C] mb-4">
              <CurrentIcon className="h-8 w-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A758C]/10 border border-[#2A758C]/20 text-[#2A758C] text-xs font-black mb-3">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Navigation Established: {currentNav.label}</span>
            </div>

            <h3 className="text-base font-black text-slate-800 max-w-md">
              Ready to implement the exact information, columns, and workflows for {currentNav.label}
            </h3>

            <p className="text-xs text-slate-500 mt-2 max-w-lg leading-relaxed">
              The side navigation and workspace routing for <strong className="text-slate-700">{currentNav.label}</strong> are active. Please provide the specific information, fields, forms, or tables you would like to have on this page!
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {navItems.map((n) => {
                const Icon = n.icon;
                const isSelected = n.id === currentTab;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleTabSwitch(n.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A758C] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
