import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentWithDetails } from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

export type ReminderLanguage = 'bilingual' | 'en' | 'ar';
export type ReminderTemplateType = 'reminder_24h' | 'confirmation' | 'pre_visit';

@Component({
  selector: 'app-whatsapp-reminder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="'WhatsApp Notification Hub'"
      [subtitle]="'Preview, customize, and dispatch patient reminders via WhatsApp Cloud API or Web'"
      (close)="close.emit()"
    >
      <div *ngIf="appointment" class="space-y-6 text-start">
        <!-- Recipient & Appointment Summary Card -->
        <div class="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">
              <i class="pi pi-whatsapp"></i>
            </div>
            <div>
              <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{{ appointment.patientName }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {{ patientPhone() || 'No phone recorded' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ appointment.doctorName }} • {{ appointment.type }} • {{ appointment.date | date:'mediumDate' }} at {{ appointment.date | date:'shortTime' }}
              </p>
            </div>
          </div>

          <!-- Status badge if previously sent -->
          @if (appointment.lastReminderSentAt) {
            <div class="text-right shrink-0">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <i class="pi pi-check-circle text-xs"></i>
                <span>Sent ({{ appointment.reminderCount || 1 }}x)</span>
              </span>
            </div>
          }
        </div>

        <!-- Controls: Template & Language Selector -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Template Type
            </label>
            <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                (click)="selectedTemplate.set('reminder_24h')"
                [class]="selectedTemplate() === 'reminder_24h' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                24h Reminder
              </button>
              <button
                type="button"
                (click)="selectedTemplate.set('confirmation')"
                [class]="selectedTemplate() === 'confirmation' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                Confirmation
              </button>
              <button
                type="button"
                (click)="selectedTemplate.set('pre_visit')"
                [class]="selectedTemplate() === 'pre_visit' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                Instructions
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Language
            </label>
            <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                (click)="selectedLanguage.set('bilingual')"
                [class]="selectedLanguage() === 'bilingual' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                Bilingual
              </button>
              <button
                type="button"
                (click)="selectedLanguage.set('en')"
                [class]="selectedLanguage() === 'en' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                English
              </button>
              <button
                type="button"
                (click)="selectedLanguage.set('ar')"
                [class]="selectedLanguage() === 'ar' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                class="py-2 text-xs rounded-lg transition-all"
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        <!-- WhatsApp Chat Mockup Preview -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <!-- WhatsApp Header -->
          <div class="bg-[#075E54] dark:bg-[#05463e] px-4 py-3 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                <i class="pi pi-building text-base"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold leading-tight">{{ clinicName || 'MedClinic Dental Center' }}</h4>
                <span class="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Official Clinic Account
                </span>
              </div>
            </div>
            <span class="text-xs px-2.5 py-1 bg-white/10 rounded-full font-mono text-[11px]">
              WhatsApp Cloud
            </span>
          </div>

          <!-- WhatsApp Chat Wallpaper -->
          <div class="bg-[#EFEAE2] dark:bg-[#0b141a] p-4 min-h-[180px] flex flex-col justify-end relative">
            <div class="absolute inset-0 opacity-5 pointer-events-none bg-repeat bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <!-- Message Bubble -->
            <div class="max-w-[85%] bg-white dark:bg-[#1f2c34] text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none p-3.5 shadow-md relative text-xs sm:text-sm whitespace-pre-wrap leading-relaxed self-start">
              {{ generatedMessage() }}
              
              <div class="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>{{ currentTime }}</span>
                <i class="pi pi-check text-[10px] text-sky-500 font-bold"></i>
                <i class="pi pi-check text-[10px] text-sky-500 font-bold -ms-1"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            (click)="copyMessage()"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i class="pi" [ngClass]="copied() ? 'pi-check text-emerald-500' : 'pi-copy'"></i>
            <span>{{ copied() ? 'Message Copied!' : 'Copy Text' }}</span>
          </button>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="openDirect.emit({ message: generatedMessage(), phone: patientPhone() })"
              class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              title="Launch WhatsApp Web or WhatsApp Desktop App directly"
            >
              <i class="pi pi-external-link text-xs"></i>
              <span>Open in WhatsApp</span>
            </button>

            <button
              type="button"
              (click)="sendApi.emit()"
              [disabled]="submitting"
              class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              @if (submitting) {
                <i class="pi pi-spin pi-spinner text-xs"></i>
                <span>Dispatching...</span>
              } @else {
                <i class="pi pi-send text-xs"></i>
                <span>Send WhatsApp Cloud</span>
              }
            </button>
          </div>
        </div>
      </div>
    </app-modal>
  `
})
export class WhatsappReminderModalComponent {
  @Input() isOpen = false;
  @Input() appointment: AppointmentWithDetails | null = null;
  @Input() patient: Patient | null = null;
  @Input() clinicName = '';
  @Input() submitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() sendApi = new EventEmitter<void>();
  @Output() openDirect = new EventEmitter<{ message: string, phone: string }>();

  selectedTemplate = signal<ReminderTemplateType>('reminder_24h');
  selectedLanguage = signal<ReminderLanguage>('bilingual');
  copied = signal(false);

  readonly currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  patientPhone = computed(() => {
    return this.patient?.contactNumber || this.appointment?.patientPhone || '';
  });

  generatedMessage = computed(() => {
    const appt = this.appointment;
    if (!appt) return '';

    const patientName = appt.patientName || 'Valued Patient';
    const doctorName = appt.doctorName || 'Doctor';
    const clinic = this.clinicName || 'MedClinic';
    const type = appt.type || 'Consultation';

    const d = new Date(appt.date);
    const dateFormatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const lang = this.selectedLanguage();
    const tpl = this.selectedTemplate();

    if (tpl === 'reminder_24h') {
      const en = `*Reminder for your upcoming visit at ${clinic}* 🏥\n\nDear *${patientName}*,\nThis is a gentle reminder that your appointment (*${type}*) with *Dr. ${doctorName}* is scheduled for tomorrow:\n\n📅 *Date:* ${dateFormatted}\n⏰ *Time:* ${timeFormatted}\n📍 *Clinic:* ${clinic}\n\nPlease arrive 10 minutes prior to your time. If you need to reschedule, reply to this message.`;
      const ar = `*تذكير بموعدك في ${clinic}* 🏥\n\nعزيزنا *${patientName}*،\nنود تذكيرك بموعدك القادم (*${type}*) مع *دكتور ${doctorName}*:\n\n📅 *التاريخ:* ${dateFormatted}\n⏰ *الوقت:* ${timeFormatted}\n📍 *العيادة:* ${clinic}\n\nيرجى الحضور قبل الموعد بـ 10 دقائق. للرد أو إعادة الجدولة يرجى مراسلتنا.`;

      if (lang === 'en') return en;
      if (lang === 'ar') return ar;
      return `${en}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${ar}`;
    } else if (tpl === 'confirmation') {
      const en = `*Appointment Confirmed* ✅\n\nDear *${patientName}*,\nYour appointment with *Dr. ${doctorName}* has been successfully reserved.\n\n📅 *Date:* ${dateFormatted}\n⏰ *Time:* ${timeFormatted}\n🏷️ *Type:* ${type}\n\nThank you for choosing ${clinic}!`;
      const ar = `*تم تأكيد الحجز بنجاح* ✅\n\nعزيزنا *${patientName}*،\nتم تأكيد حجز موعدك مع *دكتور ${doctorName}* بنجاح.\n\n📅 *التاريخ:* ${dateFormatted}\n⏰ *الوقت:* ${timeFormatted}\n🏷️ *الخدمة:* ${type}\n\nشكراً لاختيارك ${clinic}!`;

      if (lang === 'en') return en;
      if (lang === 'ar') return ar;
      return `${en}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${ar}`;
    } else {
      // pre_visit instructions
      const en = `*Important Pre-Visit Dental Instructions* 🦷\n\nDear *${patientName}*,\nAhead of your visit with *Dr. ${doctorName}* on ${dateFormatted} at ${timeFormatted}:\n\n1. Please bring your national ID or medical card.\n2. Brush and floss prior to your appointment.\n3. Inform your dentist if you have taken any blood thinners or antibiotics today.\n\nSee you soon at ${clinic}!`;
      const ar = `*تعليمات هامة قبل الزيارة الطبية* 🦷\n\nعزيزنا *${patientName}*،\nاستعداداً لزيارتك مع *دكتور ${doctorName}* بتاريخ ${dateFormatted} الساعة ${timeFormatted}:\n\n1. يرجى إحضار بطاقة الرقم القومي أو التأمين.\n2. يرجى تنظيف الأسنان بالفرشاة والمعجون قبل الحضور.\n3. أبلغ الطبيب إذا كنت تتناول أدوية مسيلة للدم أو مضادات حيوية.\n\nنتمنى لك زيارة مريحة في ${clinic}!`;

      if (lang === 'en') return en;
      if (lang === 'ar') return ar;
      return `${en}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${ar}`;
    }
  });

  copyMessage() {
    const text = this.generatedMessage();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
