import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { DentalDataService, EndodonticRecord, CanalMeasurement } from '../../services/dental-data.service';
import { ToothStatus } from '../../../../core/services/dental.service';

interface HistoricalLog {
  id: number;
  date: string;
  status: any;
  painLevel: number;
  treatment: string;
}

@Component({
  selector: 'app-skeuomorphic-dental-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './skeuomorphic-dental-chart.component.html',
  styleUrl: './skeuomorphic-dental-chart.component.css'
})
export class SkeuomorphicDentalChartComponent implements OnInit {
  private dentalDataService = inject(DentalDataService);

  // Constants for Tooth SVGs (Crown/Enamel Outlines, Pulps, Canals)
  readonly SVG_OUTLINES = {
    molar: "M 9 22 C 6 27, 8 35, 12 36 C 15 34, 17 32.5, 20 32.5 C 23 32.5, 25 34, 28 36 C 32 35, 34 27, 31 22 C 29.5 18, 30.5 11, 28.5 5 C 27.5 2, 24.5 3, 24 7 C 23.5 12, 22.5 18, 20 20 C 17.5 18, 16.5 12, 16 7 C 15.5 3, 12.5 2, 11.5 5 C 9.5 11, 10.5 18, 9 22 Z",
    premolar: "M 11 21 C 8 26, 10 33, 14 35 C 17 34, 18.5 31, 20 31 C 21.5 31, 23 34, 26 35 C 30 33, 32 26, 29 21 C 27.5 17, 28 11, 25.5 5 C 24.5 3, 21.5 4, 20 7 C 18.5 4, 15.5 3, 14.5 5 C 12 11, 12.5 17, 11 21 Z",
    canine: "M 13.5 20 C 10.5 25, 11.5 36, 16.5 38 C 17.5 38, 21.5 38, 22.5 38 C 27.5 36, 28.5 25, 25.5 20 C 24 17, 25.5 12, 19.5 4 C 13.5 12, 15 17, 13.5 20 Z",
    incisor: "M 14 20 C 11 25, 13 35, 17 37 C 19 37, 23 37, 23 37 C 27 35, 29 25, 26 20 C 24.5 17, 25 11, 23 5 C 22.5 3, 17.5 3, 17 5 C 15 11, 15.5 17, 14 20 Z"
  };

  readonly SVG_PULPS = {
    molar: "M 16 26 C 16 29, 24 29, 24 26 C 24 24, 22 23, 20 23 C 18 23, 16 24, 16 26 Z",
    premolar: "M 17 25 C 17 28, 23 28, 23 25 C 23 23, 22 22, 20 22 C 18 22, 17 23, 17 25 Z",
    canine: "M 18 25 C 18 27, 22 27, 22 25 C 22 24, 21 23, 20 23 C 19 23, 18 24, 18 25 Z",
    incisor: "M 18 25 C 18 27, 22 27, 22 25 C 22 24, 21 23, 20 23 C 19 23, 18 24, 18 25 Z"
  };

  readonly SVG_CANALS = {
    molar: "M 18 25 C 17 21, 15 15, 13.5 8 M 22 25 C 23 21, 25 15, 26.5 8",
    premolar: "M 18 24 C 18.5 20, 17 15, 15 9 M 22 24 C 21.5 20, 23 15, 25 9",
    canine: "M 20 24 C 20 18, 20 12, 20 7",
    incisor: "M 20 24 C 20 18, 20 12, 20 8"
  };

  // State signals
  activeDentition = signal<'adult' | 'child'>('adult');
  selectedToothNum = signal<string | null>(null);
  rotationAngle = signal<number>(0);
  showShell = signal<boolean>(true);
  animateCanals = signal<boolean>(true);
  records = signal<{ [toothId: string]: EndodonticRecord }>({});
  
  // Selected Tooth Local History logs
  historyLogs = signal<HistoricalLog[]>([]);

  // Form Fields model binding
  editStatuses: ToothStatus[] = ['healthy'];
  editPain = 0;
  editNotes = '';

  readonly statusOptions = [
    { value: 'healthy' as ToothStatus, icon: 'pi pi-check-circle', activeClass: 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'caries' as ToothStatus, icon: 'pi pi-exclamation-triangle', activeClass: 'bg-rose-600 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'filled' as ToothStatus, icon: 'pi pi-shield', activeClass: 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'under_treatment' as ToothStatus, icon: 'pi pi-spin pi-sync', activeClass: 'bg-amber-600 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'missing' as ToothStatus, icon: 'pi pi-times-circle', activeClass: 'bg-slate-600 border-slate-500 text-white shadow-[0_0_10px_rgba(100,116,139,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'crown' as ToothStatus, icon: 'pi pi-bookmark', activeClass: 'bg-yellow-600 border-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'root_canal' as ToothStatus, icon: 'pi pi-sliders-h', activeClass: 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'impacted' as ToothStatus, icon: 'pi pi-arrow-down-right', activeClass: 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'fractured' as ToothStatus, icon: 'pi pi-bolt', activeClass: 'bg-orange-600 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' },
    { value: 'implant' as ToothStatus, icon: 'pi pi-database', activeClass: 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]', inactiveClass: 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200' }
  ];

  // Teeth lists for layout (FDI quadrants system)
  readonly upperAdult = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
  readonly lowerAdult = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
  
  readonly upperChild = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
  readonly lowerChild = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];

  // Computed fields
  selectedToothId = computed(() => {
    const num = this.selectedToothNum();
    return num ? `tooth_${num}` : null;
  });

  selectedRecord = computed(() => {
    const id = this.selectedToothId();
    return id ? this.records()[id] || null : null;
  });

  ngOnInit() {
    this.refreshRecords();
  }

  refreshRecords() {
    this.dentalDataService.getAllRecords().subscribe(recs => {
      this.records.set(recs);
      const toothId = this.selectedToothId();
      if (toothId) {
        this.loadToothLog(toothId);
      }
    });
  }

  // Determine tooth type by FDI number
  getToothType(num: string): 'molar' | 'premolar' | 'canine' | 'incisor' {
    const incisors = ['12','11','21','22','32','31','41','42','52','51','61','62','72','71','81','82'];
    const canines = ['13','23','33','43','53','63','73','83'];
    const molars = ['18','17','16','26','27','28','38','37','36','46','47','48','55','54','64','65','74','75','84','85'];
    
    const numStr = String(num).toUpperCase();
    if (incisors.includes(numStr)) return 'incisor';
    if (canines.includes(numStr)) return 'canine';
    if (molars.includes(numStr)) return 'molar';
    return 'premolar';
  }

  // Status Colors styling dictionary
  getStatusColors(statusInput: ToothStatus | ToothStatus[] | string | string[] | undefined) {
    const statuses = Array.isArray(statusInput) 
      ? (statusInput as ToothStatus[]) 
      : (statusInput ? [statusInput as ToothStatus] : ['healthy' as ToothStatus]);

    let fill = 'url(#toothGradHealthy)';
    let stroke = 'var(--color-healthy)';
    
    if (statuses.includes('missing')) {
      fill = 'transparent';
      stroke = 'var(--color-missing)';
    } else if (statuses.includes('implant')) {
      fill = 'url(#toothGradImplant)';
      stroke = '#818cf8';
    } else if (statuses.includes('crown')) {
      fill = 'url(#toothGradCrown)';
      stroke = '#fbbf24';
    } else if (statuses.includes('fractured')) {
      fill = 'url(#toothGradFractured)';
      stroke = '#ea580c';
    } else if (statuses.includes('caries')) {
      fill = 'url(#toothGradCaries)';
      stroke = 'var(--color-caries)';
    } else if (statuses.includes('filled')) {
      fill = 'url(#toothGradFilled)';
      stroke = 'var(--color-filled)';
    } else if (statuses.includes('under_treatment')) {
      fill = 'url(#toothGradTreatment)';
      stroke = 'var(--color-treatment)';
    }

    let canal = '#22d3ee';
    let pulp = 'rgba(34, 211, 238, 0.3)';

    if (statuses.includes('missing')) {
      canal = 'transparent';
      pulp = 'transparent';
    } else if (statuses.includes('root_canal')) {
      canal = '#c084fc';
      pulp = 'rgba(168, 85, 247, 0.35)';
    } else if (statuses.includes('caries')) {
      canal = '#f43f5e';
      pulp = 'rgba(244, 63, 94, 0.4)';
    } else if (statuses.includes('under_treatment')) {
      canal = '#f59e0b';
      pulp = 'rgba(245, 158, 11, 0.4)';
    } else if (statuses.includes('filled')) {
      canal = '#60a5fa';
      pulp = 'rgba(96, 165, 250, 0.35)';
    }

    return { fill, stroke, canal, pulp };
  }

  toggleStatus(status: ToothStatus) {
    let current = [...this.editStatuses];
    if (status === 'healthy') {
      current = ['healthy'];
    } else if (status === 'missing') {
      current = ['missing'];
    } else {
      current = current.filter(s => s !== 'healthy' && s !== 'missing');
      if (current.includes(status)) {
        current = current.filter(s => s !== status);
      } else {
        current.push(status);
      }
      if (current.length === 0) {
        current = ['healthy'];
      }
    }
    this.editStatuses = current;
  }

  isStatusSelected(status: ToothStatus): boolean {
    return this.editStatuses.includes(status);
  }

  setDentition(mode: 'adult' | 'child') {
    this.activeDentition.set(mode);
    this.selectedToothNum.set(null);
  }

  selectTooth(num: string) {
    this.selectedToothNum.set(num);
    const toothId = `tooth_${num}`;
    this.loadToothLog(toothId);
  }

  loadToothLog(toothId: string) {
    const record = this.records()[toothId];
    if (record) {
      this.editStatuses = Array.isArray(record.status) ? [...record.status] : [record.status as any];
      this.editPain = record.painLevel;
      this.editNotes = record.clinicalNotes;
    }

    // Load detailed historical logs from localstorage if available
    const historyKey = `dental_history_logs_${toothId}`;
    const cachedLogs = localStorage.getItem(historyKey);
    if (cachedLogs) {
      const logs = JSON.parse(cachedLogs);
      logs.forEach((l: any) => {
        if (l.status && !Array.isArray(l.status)) {
          l.status = [l.status];
        }
      });
      this.historyLogs.set(logs);
    } else {
      // Generate initial diagnostic history log if empty to make it look detailed
      const defaultLogs: HistoricalLog[] = [];
      if (record) {
        defaultLogs.push({
          id: Date.now() - 5 * 24 * 60 * 60 * 1000,
          date: record.lastUpdated,
          status: Array.isArray(record.status) ? record.status : [record.status],
          painLevel: record.painLevel,
          treatment: record.clinicalNotes
        });
      }
      this.historyLogs.set(defaultLogs);
      localStorage.setItem(historyKey, JSON.stringify(defaultLogs));
    }
  }

  toggleShell() {
    this.showShell.update(v => !v);
  }

  togglePulse() {
    this.animateCanals.update(v => !v);
  }

  updatePainVal(val: number) {
    this.editPain = val;
  }

  saveToothLog() {
    const id = this.selectedToothId();
    if (!id) return;

    const record = this.records()[id];
    if (!record) return;

    // Update main record values
    record.status = this.editStatuses;
    record.painLevel = this.editPain;
    record.clinicalNotes = this.editNotes;

    this.dentalDataService.updateEndodonticRecord(record).subscribe(updated => {
      // Store in history logs
      const historyKey = `dental_history_logs_${id}`;
      const logs = [...this.historyLogs()];
      
      logs.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        status: [...this.editStatuses],
        painLevel: this.editPain,
        treatment: this.editNotes
      });

      this.historyLogs.set(logs);
      localStorage.setItem(historyKey, JSON.stringify(logs));
      this.refreshRecords();
    });
  }

  previewStatusChange(val: string) {
    this.editStatuses = [val as ToothStatus];
  }

  getDominantStatus(statuses: ToothStatus[] | undefined): ToothStatus {
    if (!statuses || statuses.length === 0) return 'healthy';
    const priority: ToothStatus[] = ['missing', 'implant', 'fractured', 'caries', 'under_treatment', 'root_canal', 'crown', 'filled', 'healthy'];
    for (const p of priority) {
      if (statuses.includes(p)) return p;
    }
    return 'healthy';
  }
}
