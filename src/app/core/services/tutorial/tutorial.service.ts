import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { 
  TourDefinition, 
  TourStep, 
  CheatSheetCard, 
  PageHelpInfo, 
  KeyboardShortcutItem 
} from './tutorial.model';

const STORAGE_KEY = 'cliniccorp_completed_tours';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly isHelpCenterOpen = signal(false);
  readonly activeTour = signal<TourDefinition | null>(null);
  readonly currentStepIndex = signal(0);
  readonly currentUrl = signal(this.router.url || '/dashboard');

  readonly completedTourIds = signal<string[]>(this.loadCompletedTours());

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });

    // Auto-persist completed tours
    effect(() => {
      const ids = this.completedTourIds();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // Safe fallback in restricted environments
      }
    });
  }

  // ── Predefined Role-Based Interactive Tours ──
  readonly tours = signal<TourDefinition[]>([
    {
      id: 'tour-reception',
      titleKey: 'tutorial.tours.reception.title',
      descriptionKey: 'tutorial.tours.reception.desc',
      roles: ['admin', 'assistant', 'doctor'],
      icon: 'pi pi-id-card',
      steps: [
        {
          titleKey: 'tutorial.steps.reception.step1_title',
          contentKey: 'tutorial.steps.reception.step1_content',
          targetSelector: '#nav-patients',
          placement: 'right',
          route: '/patients'
        },
        {
          titleKey: 'tutorial.steps.reception.step2_title',
          contentKey: 'tutorial.steps.reception.step2_content',
          targetSelector: '#nav-appointments',
          placement: 'right',
          route: '/appointments'
        },
        {
          titleKey: 'tutorial.steps.reception.step3_title',
          contentKey: 'tutorial.steps.reception.step3_content',
          targetSelector: '#nav-billing',
          placement: 'right',
          route: '/billing'
        }
      ]
    },
    {
      id: 'tour-doctor',
      titleKey: 'tutorial.tours.doctor.title',
      descriptionKey: 'tutorial.tours.doctor.desc',
      roles: ['doctor', 'admin'],
      icon: 'pi pi-user-md',
      steps: [
        {
          titleKey: 'tutorial.steps.doctor.step1_title',
          contentKey: 'tutorial.steps.doctor.step1_content',
          targetSelector: '#nav-appointments',
          placement: 'right',
          route: '/appointments'
        },
        {
          titleKey: 'tutorial.steps.doctor.step2_title',
          contentKey: 'tutorial.steps.doctor.step2_content',
          targetSelector: '#nav-patients',
          placement: 'right',
          route: '/patients'
        },
        {
          titleKey: 'tutorial.steps.doctor.step3_title',
          contentKey: 'tutorial.steps.doctor.step3_content',
          targetSelector: '#nav-radiology',
          placement: 'right',
          route: '/radiology'
        }
      ]
    },
    {
      id: 'tour-dental',
      titleKey: 'tutorial.tours.dental.title',
      descriptionKey: 'tutorial.tours.dental.desc',
      roles: ['doctor', 'admin'],
      icon: 'pi pi-th-large',
      steps: [
        {
          titleKey: 'tutorial.steps.dental.step1_title',
          contentKey: 'tutorial.steps.dental.step1_content',
          targetSelector: '#nav-patients',
          placement: 'right',
          route: '/patients'
        },
        {
          titleKey: 'tutorial.steps.dental.step2_title',
          contentKey: 'tutorial.steps.dental.step2_content',
          targetSelector: '#nav-appointments',
          placement: 'right',
          route: '/appointments'
        }
      ]
    },
    {
      id: 'tour-operatory',
      titleKey: 'tutorial.tours.operatory.title',
      descriptionKey: 'tutorial.tours.operatory.desc',
      roles: ['admin', 'assistant', 'doctor'],
      icon: 'pi pi-inbox',
      steps: [
        {
          titleKey: 'tutorial.steps.operatory.step1_title',
          contentKey: 'tutorial.steps.operatory.step1_content',
          targetSelector: '#nav-chair-board',
          placement: 'right',
          route: '/chair-board'
        },
        {
          titleKey: 'tutorial.steps.operatory.step2_title',
          contentKey: 'tutorial.steps.operatory.step2_content',
          targetSelector: '#nav-inventory',
          placement: 'right',
          route: '/inventory'
        }
      ]
    },
    {
      id: 'tour-owner',
      titleKey: 'tutorial.tours.owner.title',
      descriptionKey: 'tutorial.tours.owner.desc',
      roles: ['admin'],
      icon: 'pi pi-chart-line',
      steps: [
        {
          titleKey: 'tutorial.steps.owner.step1_title',
          contentKey: 'tutorial.steps.owner.step1_content',
          targetSelector: '#nav-dashboard',
          placement: 'right',
          route: '/dashboard'
        },
        {
          titleKey: 'tutorial.steps.owner.step2_title',
          contentKey: 'tutorial.steps.owner.step2_content',
          targetSelector: '#nav-billing',
          placement: 'right',
          route: '/billing'
        }
      ]
    }
  ]);

  // ── Quick-Start Reference Cards (Cheat Sheets) ──
  readonly cheatSheets = signal<CheatSheetCard[]>([
    {
      id: 'card-reception',
      title: 'Front-Desk Reception & Cashier Cheat Sheet',
      titleAr: 'بطاقة مرجعية سريعة: الاستقبال والصندوق',
      badge: 'Card 1',
      badgeAr: 'بطاقة ١',
      icon: 'pi pi-id-card',
      targetRole: 'Receptionist / Assistant',
      steps: [
        {
          num: 1,
          title: 'Patient Arrival (< 45s)',
          titleAr: 'وصول المريض (أقل من ٤٥ ثانية)',
          desc: 'Press [ Ctrl + K ] or search by phone/name. If new, click "+ New Patient" (Ctrl + N) and enter name, mobile, DOB, and drug allergies.',
          descAr: 'اضغط [ Ctrl + K ] للبحث بالاسم أو الهاتف. للمريض الجديد اضغط "+ مريض جديد" (Ctrl + N).',
          shortcut: 'Ctrl + N'
        },
        {
          num: 2,
          title: 'Live Queue Check-In',
          titleAr: 'تسجيل الوصول والانتظار',
          desc: 'Locate appointment on schedule and click green [ CHECK-IN ]. Status turns to Waiting; doctor is notified immediately.',
          descAr: 'حدد موعد المريض واضغط زر [ تسجيل الوصول ]. يتحول الموعد إلى الانتظار ويظهر فوراً للطبيب.'
        },
        {
          num: 3,
          title: '24h Batch WhatsApp Reminders',
          titleAr: 'تذكيرات واتساب المجمعة',
          desc: 'Open Appointments -> Click [ Send Tomorrow\'s Reminders (Batch) ] to 1-click dispatch WhatsApp reminders to tomorrow\'s schedule.',
          descAr: 'من المواعيد اضغط [ إرسال تذكيرات الغد ] لإرسال رسائل واتساب لجميع مواعيد الغد بنقرة واحدة.'
        },
        {
          num: 4,
          title: 'Split-Payment Cashier Settlement',
          titleAr: 'الدفع المشترك وتسوية الفواتير',
          desc: 'Select invoice -> choose Cash, Visa/Card, or Split Payment. Verify split sums match total, then click [ Finalize & Settle ].',
          descAr: 'اختر الفاتورة وحدد نوع الدفع (نقدي، بطاقة، أو دفع مشترك) واضغط [ تسوية الفاتورة ].'
        },
        {
          num: 5,
          title: 'Receipt Printing',
          titleAr: 'طباعة الإيصالات والفواتير',
          desc: 'Print 80mm ESC/POS Thermal Receipt for POS or A4 Formal Tax Invoice with QR verification code.',
          descAr: 'اطبع إيصال حراري ٨٠ مم أو فاتورة ضريبية رسمية A4 مع رمز QR للتحقق الإلكتروني.'
        }
      ]
    },
    {
      id: 'card-doctor',
      title: 'Doctor & Specialist Chair-Side Consultation',
      titleAr: 'بطاقة استشارة الطبيب داخل العيادة',
      badge: 'Card 2',
      badgeAr: 'بطاقة ٢',
      icon: 'pi pi-user-md',
      targetRole: 'Physicians & Specialists',
      steps: [
        {
          num: 1,
          title: 'Queue & Safety Allergy Check',
          titleAr: 'نداء المريض والتحقق من الحساسية',
          desc: 'Click [ Call Next Patient ]. Immediately inspect the persistent red Allergy Warning banner before administering medication.',
          descAr: 'اضغط [ استدعاء المريض ]. تحقق فوراً من شريط الحساسية الدوائية الأحمر أعلى الملف الطبي.'
        },
        {
          num: 2,
          title: 'AI Chair-Side Voice Scribe',
          titleAr: 'المساعد الصوتي الذكي (AI Scribe)',
          desc: 'Click microphone icon to dictate clinical observations. AI formats SOAP notes and extracts draft prescriptions automatically.',
          descAr: 'اضغط أيقونة الميكروفون وأملِ الفحص؛ يقوم الذكاء الاصطناعي بتنظيم ملاحظات SOAP والوصفة الطبية.'
        },
        {
          num: 3,
          title: 'Prescription Allergy Interceptor',
          titleAr: 'الوصفات الطبية وحاجز الأمان',
          desc: 'Add medications. If an allergy conflict exists, system raises an audible red modal intercepting the prescription before signature.',
          descAr: 'اختر الأدوية؛ إذا وجد تعارض مع حساسية المريض سيمنعك النظام برسالة تحذيرية حمراء قبل التوقيع.'
        },
        {
          num: 4,
          title: 'Radiology High-Res Comparison',
          titleAr: 'فحص الأشعة والمقارنة',
          desc: 'Open Radiology tab to compare pre-op and post-op panoramic/periapical scans side-by-side with digital caliper probe.',
          descAr: 'افتح الأشعة لمقارنة الصور السابقة واللاحقة جنباً إلى جنب مع مسطرة القياس الرقمية.'
        }
      ]
    },
    {
      id: 'card-dental',
      title: 'Dental Odontogram & Multi-Stage Plans',
      titleAr: 'مخطط الأسنان التفاعلي وخطط العلاج',
      badge: 'Card 3',
      badgeAr: 'بطاقة ٣',
      icon: 'pi pi-th-large',
      targetRole: 'Dental Surgeons',
      steps: [
        {
          num: 1,
          title: 'FDI & Universal Odontogram',
          titleAr: 'تخطيط الأسنان FDI / Universal',
          desc: 'Click any tooth surface (Occlusal, Mesial, Distal, Buccal, Lingual) to chart caries, crowns, or restorations with color coding.',
          descAr: 'انقر على أي سطح للسن لتسجيل التسوس أو التيجان أو الحشوات مع تلوين تلقائي فوري.'
        },
        {
          num: 2,
          title: 'Multi-Stage Treatment Planning',
          titleAr: 'إنشاء خطة علاج متعددة المراحل',
          desc: 'Bundle procedures into stages (e.g. Stage 1: Endo, Stage 2: Crown). Real-time total estimates calculate discounts and copays.',
          descAr: 'اجمع الإجراءات في مراحل علاجية مع حساب تلقائي للتكلفة الإجمالية والخصومات.'
        },
        {
          num: 3,
          title: 'Informed Consent Digital E-Signature',
          titleAr: 'التوقيع الإلكتروني للإقرار الطبي',
          desc: 'Hand tablet to patient to sign informed consent on digital canvas. Signature is timestamped and cryptographically locked.',
          descAr: 'وقع المريض إلكترونياً على الإقرار الطبي عبر الشاشة اللمسية ويتم قفل المستند برقم زمني.'
        },
        {
          num: 4,
          title: 'Auto-Inventory Recipe Deduction',
          titleAr: 'خصم مستهلكات الإجراء من المخزون',
          desc: 'Completing a procedure automatically deducts associated materials (anesthetic cartridges, composites) from active clinic inventory.',
          descAr: 'إنهاء أي إجراء يخصم تلقائياً المواد والمستهلكات المرتبطة به من المستودع دون إدخال يدوي.'
        }
      ]
    },
    {
      id: 'card-operatory',
      title: 'Operatory Chairs & Materials Stock',
      titleAr: 'إدارة كراسي العيادة ومخزون المواد',
      badge: 'Card 4',
      badgeAr: 'بطاقة ٤',
      icon: 'pi pi-inbox',
      targetRole: 'Nursing & Assistants',
      steps: [
        {
          num: 1,
          title: 'Live Chair Status Board',
          titleAr: 'لوحة حالة الغرف والكراسي الفورية',
          desc: 'Monitor real-time states: Green = Available, Amber = Occupied with countdown, Blue = Sterilization in progress.',
          descAr: 'تابع فورياً: أخضر = متاح، أصفر = مشغول، أزرق = جاري التعقيم مع مؤقت زمني دقيق.'
        },
        {
          num: 2,
          title: 'Turnover & Sterilization Timers',
          titleAr: 'مؤقتات التعقيم وتجهيز الغرفة',
          desc: 'When patient departs, 1-click moves chair to Cleaning state. Alarm rings when 5-min disinfection protocol concludes.',
          descAr: 'بنقرة واحدة انقل الكرسي لحالة التعقيم؛ يطلق النظام تنبيهاً صوتياً فور انتهاء مدة التعقيم.'
        },
        {
          num: 3,
          title: 'Low-Stock & Expiration Quarantines',
          titleAr: 'تنبيهات نقص المخزون وانتهاء الصلاحية',
          desc: 'Automatic threshold alarms flag items near reorder level. Expired batches are automatically quarantined from procedure recipes.',
          descAr: 'تنبيهات تلقائية عند انخفاض الكميات وعزل المواد منتهية الصلاحية تلقائياً لمنع استخدامها.'
        }
      ]
    },
    {
      id: 'card-owner',
      title: 'Practice Analytics, Commissions & Multi-Branch',
      titleAr: 'تحليلات العيادة، العمولات، والفروع المتعددة',
      badge: 'Card 5',
      badgeAr: 'بطاقة ٥',
      icon: 'pi pi-chart-line',
      targetRole: 'Clinic Owners & Admins',
      steps: [
        {
          num: 1,
          title: 'Executive KPI Intelligence',
          titleAr: 'لوحة المؤشرات التنفيذية الذكية',
          desc: 'View real-time daily revenue, collection rates, new vs returning patient ratios, and chair occupancy rates across all branches.',
          descAr: 'شاهد الإيرادات اليومية، نسب التحصيل، المرضى الجدد ومعدل إشغال الكراسي لجميع الفروع.'
        },
        {
          num: 2,
          title: 'Automated Doctor Commission Audits',
          titleAr: 'حساب عمولات الأطباء آلياً',
          desc: 'Configure Tiered or Fixed percentage plans with automatic lab fee deductions. Generate locked monthly settlement statements.',
          descAr: 'حدد نسب العمولات مع خصم تكاليف المعامل الخارجية تلقائياً واستخرج كشوف تسوية معتمدة.'
        },
        {
          num: 3,
          title: 'Multi-Branch & Tenant Management',
          titleAr: 'إدارة الفروع والمنظمات المتعددة',
          desc: 'Switch branches seamlessly in top header. Role-based scoping ensures staff only view data for authorized clinic facilities.',
          descAr: 'تنقل بسلاسة بين الفروع من الشريط العلوي مع عزل تام لصلاحيات وبيانات كل فرع.'
        }
      ]
    }
  ]);

  // ── Keyboard Shortcuts List ──
  readonly keyboardShortcuts = signal<KeyboardShortcutItem[]>([
    {
      keys: ['Ctrl', 'K'],
      description: 'Open Global Spotlight Command Palette',
      descriptionAr: 'فتح شريط الأوامر والبحث الشامل',
      category: 'general'
    },
    {
      keys: ['Shift', '?'],
      description: 'Open Help & Tutorial Center',
      descriptionAr: 'فتح مركز المساعدة والجولات التعليمية',
      category: 'general'
    },
    {
      keys: ['Ctrl', 'N'],
      description: 'Quick Register New Patient',
      descriptionAr: 'تسجيل مريض جديد سريعاً',
      category: 'clinical'
    },
    {
      keys: ['Ctrl', 'B'],
      description: 'Open Today\'s Appointments Schedule',
      descriptionAr: 'فتح جدول مواعيد اليوم',
      category: 'navigation'
    },
    {
      keys: ['Ctrl', 'Shift', 'L'],
      description: 'Toggle English / Arabic (RTL)',
      descriptionAr: 'تبديل لغة الواجهة (عربي / إنجليزي)',
      category: 'general'
    },
    {
      keys: ['Esc'],
      description: 'Close Any Open Modal or Tour Step',
      descriptionAr: 'إغلاق أي نافذة أو خطوة جولة نشطة',
      category: 'general'
    }
  ]);

  // ── Contextual Page Help Dictionary ──
  private readonly pageHelpMap: PageHelpInfo[] = [
    {
      routeMatch: '/dashboard',
      title: 'Practice Dashboard',
      titleAr: 'لوحة التحكم والمؤشرات',
      summary: 'Executive overview of daily clinic performance, patient arrivals, revenue, and active operatory utilization.',
      summaryAr: 'نظرة شاملة على أداء العيادة اليومي، وصول المرضى، الإيرادات وإشغال الكراسي.',
      tips: [
        { en: 'Use the top-right branch selector to inspect specific clinics or aggregate all facilities.', ar: 'استخدم محدد الفروع بالأعلى لمشاهدة عيادة محددة أو كافة المرافق معاً.' },
        { en: 'Click any metric card to drill directly into filtered patient or invoice records.', ar: 'اضغط على أي بطاقة إحصائية للانتقال المباشر للسجلات التفصيلية.' }
      ],
      recommendedTourId: 'tour-owner'
    },
    {
      routeMatch: '/appointments',
      title: 'Appointments & Waiting Queue',
      titleAr: 'إدارة المواعيد وقائمة الانتظار',
      summary: 'Schedule visits, manage the live waiting room queue, dispatch 24h WhatsApp batch reminders, and monitor AI no-show risk.',
      summaryAr: 'جدولة المواعيد، إدارة قائمة الانتظار الحية، إرسال تذكيرات واتساب، ومراقبة توقعات الغياب بالذكاء الاصطناعي.',
      tips: [
        { en: 'Click [ Check-In ] when a patient arrives to activate their waiting timer and alert the doctor.', ar: 'اضغط [ تسجيل الوصول ] فور وصول المريض لتفعيل مؤقت الانتظار وتنبيه الطبيب.' },
        { en: 'Batch dispatch reminders for tomorrow using the WhatsApp Batch button at top right.', ar: 'أرسل تذكيرات الغد لجميع المرضى دفعة واحدة عبر زر واتساب المجمع بالأعلى.' }
      ],
      recommendedTourId: 'tour-reception'
    },
    {
      routeMatch: '/patients',
      title: 'Patients Directory & EMR',
      titleAr: 'دليل المرضى والسجلات الطبية',
      summary: 'Access electronic medical records, active drug allergies, clinical history timelines, and 3D dental odontograms.',
      summaryAr: 'الوصول للسجلات الطبية الكاملة، حساسية الأدوية، الجدول الزمني للزيارات، ومخطط الأسنان ثلاثي الأبعاد.',
      tips: [
        { en: 'Press [ Ctrl + N ] anywhere to register a new patient in under 45 seconds.', ar: 'اضغط [ Ctrl + N ] في أي مكان لتسجيل مريض جديد في أقل من ٤٥ ثانية.' },
        { en: 'Always inspect the top red Allergy Warning badge before writing new prescriptions.', ar: 'تحقق دائماً من شريط الحساسية الأحمر بأعلى ملف المريض قبل تحرير الوصفات.' }
      ],
      recommendedTourId: 'tour-doctor'
    },
    {
      routeMatch: '/chair-board',
      title: 'Operatory & Chair Status Board',
      titleAr: 'لوحة حالة الكراسي والغرف',
      summary: 'Real-time visibility into operatory occupancy, ongoing consultations, and post-visit sterilization countdown timers.',
      summaryAr: 'متابعة حية لإشغال الغرف والكراسي، الاستشارات الجارية، ومؤقتات التعقيم والتطهير بعد الزيارة.',
      tips: [
        { en: 'One-click marks a chair as [ Cleaning ] upon patient checkout to trigger the 5-min timer.', ar: 'نقرة واحدة تنقل الكرسي إلى حالة [ جاري التعقيم ] لتشغيل مؤقت الخمس دقائق.' }
      ],
      recommendedTourId: 'tour-operatory'
    },
    {
      routeMatch: '/billing',
      title: 'Billing, Invoices & Financing',
      titleAr: 'الفواتير، المدفوعات وخطط التقسيط',
      summary: 'Process cash, card, and split payments, manage patient installment payment plans, and print 80mm ESC/POS receipts.',
      summaryAr: 'إصدار الفواتير، الدفع المشترك (نقدي وبطاقة)، إدارة خطط التقسيط، وطباعة إيصالات نقاط البيع الحرارية.'
      ,
      tips: [
        { en: 'Choose [ Split Payment ] if a patient pays partly in cash and partly via card.', ar: 'اختر [ دفع مشترك ] إذا كان المريض يرغب بدفع جزء نقداً والآخر بالبطاقة.' }
      ],
      recommendedTourId: 'tour-reception'
    },
    {
      routeMatch: '/inventory',
      title: 'Inventory, Materials & Procurement',
      titleAr: 'المستودع، المواد وأوامر الشراء',
      summary: 'Track clinical consumables, low-stock threshold alerts, expiration quarantines, and supplier purchase orders (EDI).',
      summaryAr: 'متابعة المستهلكات الطبية، تنبيهات نقص المخزون، عزل منتهي الصلاحية، وإصدار أوامر الشراء للموردين.'
      ,
      tips: [
        { en: 'Materials are automatically deducted from stock when linked clinical procedures are completed.', ar: 'يتم خصم المواد تلقائياً من المخزون بمجرد اكتمال الإجراء الطبي المرتبط بها.' }
      ],
      recommendedTourId: 'tour-operatory'
    }
  ];

  // ── Computed Properties ──
  readonly isTourActive = computed(() => this.activeTour() !== null);

  readonly currentTour = computed(() => this.activeTour());

  readonly currentStep = computed<TourStep | null>(() => {
    const tour = this.activeTour();
    if (!tour || !tour.steps || tour.steps.length === 0) return null;
    const idx = this.currentStepIndex();
    return tour.steps[idx] || null;
  });

  readonly totalSteps = computed(() => {
    const tour = this.activeTour();
    return tour?.steps.length || 0;
  });

  readonly isLastStep = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return true;
    return this.currentStepIndex() >= total - 1;
  });

  readonly filteredTours = computed(() => {
    const user = this.authService.currentUser();
    const role = user?.role || 'assistant';
    return this.tours().filter(t => t.roles.includes(role));
  });

  readonly currentPageHelp = computed<PageHelpInfo>(() => {
    const url = this.currentUrl();
    const matched = this.pageHelpMap.find(item => url.startsWith(item.routeMatch));
    return matched || {
      routeMatch: '/',
      title: 'Smart Clinic Management',
      titleAr: 'نظام إدارة العيادات الذكي',
      summary: 'Comprehensive enterprise outpatient practice, clinical EMR, digital dental odontogram, and billing ecosystem.',
      summaryAr: 'نظام متكامل لإدارة العيادات الطبية، السجلات الصحية، تخطيط الأسنان، والفواتير السريعة.',
      tips: [
        { en: 'Press [ Shift + ? ] anytime to open this contextual help center.', ar: 'اضغط [ Shift + ? ] في أي وقت لفتح مركز المساعدة.' },
        { en: 'Press [ Ctrl + K ] to trigger the global command search palette.', ar: 'اضغط [ Ctrl + K ] للبحث الشامل السريع.' }
      ],
      recommendedTourId: 'tour-reception'
    };
  });

  // ── Actions ──
  openHelpCenter() {
    this.isHelpCenterOpen.set(true);
  }

  closeHelpCenter() {
    this.isHelpCenterOpen.set(false);
  }

  toggleHelpCenter() {
    this.isHelpCenterOpen.update(v => !v);
  }

  startTour(tourId: string) {
    const found = this.tours().find(t => t.id === tourId);
    if (!found) return;

    this.closeHelpCenter();
    this.activeTour.set(found);
    this.currentStepIndex.set(0);
    this.navigateForCurrentStep();
  }

  nextStep() {
    const tour = this.activeTour();
    if (!tour) return;

    if (this.currentStepIndex() < tour.steps.length - 1) {
      this.currentStepIndex.update(i => i + 1);
      this.navigateForCurrentStep();
    } else {
      this.finishTour();
    }
  }

  previousStep() {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update(i => i - 1);
      this.navigateForCurrentStep();
    }
  }

  skipTour() {
    this.activeTour.set(null);
    this.currentStepIndex.set(0);
  }

  finishTour() {
    const tour = this.activeTour();
    if (tour) {
      if (!this.completedTourIds().includes(tour.id)) {
        this.completedTourIds.update(ids => [...ids, tour.id]);
      }
    }
    this.activeTour.set(null);
    this.currentStepIndex.set(0);
  }

  resetCompletedTours() {
    this.completedTourIds.set([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  private navigateForCurrentStep() {
    const step = this.currentStep();
    if (step && step.route) {
      const active = this.router.url;
      if (!active.startsWith(step.route)) {
        this.router.navigateByUrl(step.route);
      }
    }
  }

  private loadCompletedTours(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
