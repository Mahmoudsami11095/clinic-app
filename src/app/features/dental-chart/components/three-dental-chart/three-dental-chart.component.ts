import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { gsap } from 'gsap';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { DentalDataService, EndodonticRecord } from '../../services/dental-data.service';
import { ToothStatus } from '../../../../core/services/dental.service';

interface HistoricalLog {
  id: number;
  date: string;
  status: ToothStatus[];
  painLevel: number;
  treatment: string;
}

@Component({
  selector: 'app-three-dental-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './three-dental-chart.component.html',
  styleUrl: './three-dental-chart.component.css'
})
export class ThreeDentalChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  private dentalDataService = inject(DentalDataService);

  // Signals
  selectedToothId = signal<string | null>(null);
  showEnamel = signal<boolean>(true);
  isRotating = signal<boolean>(false);
  loadingModel = signal<boolean>(true);
  loadingRecord = signal<boolean>(false);
  allRecords = signal<{ [toothId: string]: EndodonticRecord }>({});
  historyLogs = signal<HistoricalLog[]>([]);

  // Form Fields
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

  getDominantStatus(statuses: ToothStatus[] | undefined): ToothStatus {
    if (!statuses || statuses.length === 0) return 'healthy';
    const priority: ToothStatus[] = ['missing', 'implant', 'fractured', 'caries', 'under_treatment', 'root_canal', 'crown', 'filled', 'healthy'];
    for (const p of priority) {
      if (statuses.includes(p)) return p;
    }
    return 'healthy';
  }

  // Reactive endodontic record fetching
  selectedRecord = toSignal<EndodonticRecord | null>(
    toObservable(this.selectedToothId).pipe(
      switchMap((id) => {
        if (!id) return of(null);
        this.loadingRecord.set(true);
        return this.dentalDataService.getEndodonticRecord(id).pipe(
          finalize(() => this.loadingRecord.set(false))
        );
      })
    )
  );

  // Three.js State
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private jawGroup!: THREE.Group;
  private animationFrameId?: number;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isAnimating = false;

  // Custom status-colored materials
  private materials: { [status: string]: { enamel: THREE.Material; pulp: THREE.Material } } = {};

  constructor() {
    // React to enamel visibility toggle & record updates to re-paint materials
    effect(() => {
      this.showEnamel();
      this.allRecords();
      this.updateAllTeethAppearances();
    });
  }

  ngOnInit() {
    this.initMaterials();
    this.refreshRecords();
  }

  ngAfterViewInit() {
    this.initThree();
    this.loadDentalModel();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose resources to prevent memory leaks
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  private refreshRecords() {
    this.dentalDataService.getAllRecords().subscribe(recs => {
      this.allRecords.set(recs);
      this.updateAllTeethAppearances();
    });
  }

  /**
   * Initializes status-specific materials for the 3D teeth
   */
  private initMaterials() {
    const statuses = ['healthy', 'caries', 'filled', 'under_treatment', 'missing', 'crown', 'root_canal', 'impacted', 'fractured', 'implant'];
    const colors = {
      healthy: { enamel: 0xe0f2fe, pulp: 0x22d3ee, emissive: 0x06b6d4 },
      caries: { enamel: 0xffe4e6, pulp: 0xef4444, emissive: 0xe11d48 },
      filled: { enamel: 0xdbeafe, pulp: 0x3b82f6, emissive: 0x2563eb },
      under_treatment: { enamel: 0xfef9c3, pulp: 0xf59e0b, emissive: 0xd97706 },
      missing: { enamel: 0x334155, pulp: 0x334155, emissive: 0x000000 },
      crown: { enamel: 0xd4af37, pulp: 0x22d3ee, emissive: 0x06b6d4, metalness: 0.9, roughness: 0.1 },
      root_canal: { enamel: 0xe0f2fe, pulp: 0xa855f7, emissive: 0xc084fc },
      impacted: { enamel: 0x34d399, pulp: 0x059669, emissive: 0x10b981 },
      fractured: { enamel: 0xf97316, pulp: 0xef4444, emissive: 0xe11d48 },
      implant: { enamel: 0x94a3b8, pulp: 0x475569, emissive: 0x334155, metalness: 0.9, roughness: 0.2 }
    };

    statuses.forEach(status => {
      const c = colors[status as keyof typeof colors];
      
      const enamelMaterial = new THREE.MeshPhysicalMaterial({
        color: c.enamel,
        transmission: status === 'missing' ? 0.0 : (status === 'implant' || status === 'crown' ? 0.0 : 0.95),
        roughness: c.hasOwnProperty('roughness') ? (c as any).roughness : 0.1,
        metalness: c.hasOwnProperty('metalness') ? (c as any).metalness : 0.1,
        ior: 1.62,
        thickness: 1.0,
        transparent: true,
        opacity: status === 'missing' ? 0.03 : (status === 'implant' || status === 'crown' ? 1.0 : 0.35),
        clearcoat: status === 'missing' ? 0.0 : 1.0,
        clearcoatRoughness: 0.1
      });

      const pulpMaterial = new THREE.MeshStandardMaterial({
        color: c.pulp,
        emissive: c.emissive,
        emissiveIntensity: status === 'missing' ? 0.0 : 2.5,
        roughness: 0.2,
        metalness: 0.1,
        transparent: status === 'missing',
        opacity: status === 'missing' ? 0.03 : 1.0
      });

      this.materials[status] = {
        enamel: enamelMaterial,
        pulp: pulpMaterial
      };
    });
  }

  getToothMaterials(statusesInput: ToothStatus | ToothStatus[] | undefined): { enamel: THREE.Material; pulp: THREE.Material; enamelVisible: boolean; isMissing: boolean } {
    const statuses = Array.isArray(statusesInput) 
      ? statusesInput 
      : (statusesInput ? [statusesInput as ToothStatus] : ['healthy' as ToothStatus]);

    let enamelKey = 'healthy';
    let pulpKey = 'healthy';
    let isMissing = statuses.includes('missing');

    // Enamel resolution (priority)
    if (statuses.includes('missing')) enamelKey = 'missing';
    else if (statuses.includes('implant')) enamelKey = 'implant';
    else if (statuses.includes('crown')) enamelKey = 'crown';
    else if (statuses.includes('fractured')) enamelKey = 'fractured';
    else if (statuses.includes('caries')) enamelKey = 'caries';
    else if (statuses.includes('filled')) enamelKey = 'filled';
    else if (statuses.includes('under_treatment')) enamelKey = 'under_treatment';

    // Pulp resolution (priority)
    if (statuses.includes('missing')) pulpKey = 'missing';
    else if (statuses.includes('root_canal')) pulpKey = 'root_canal';
    else if (statuses.includes('caries')) pulpKey = 'caries';
    else if (statuses.includes('under_treatment')) pulpKey = 'under_treatment';
    else if (statuses.includes('filled')) pulpKey = 'filled';

    const enamel = this.materials[enamelKey]?.enamel || this.materials['healthy'].enamel;
    const pulp = this.materials[pulpKey]?.pulp || this.materials['healthy'].pulp;

    return {
      enamel,
      pulp,
      enamelVisible: isMissing ? true : this.showEnamel(),
      isMissing
    };
  }

  private updateAllTeethAppearances() {
    if (!this.jawGroup || Object.keys(this.allRecords()).length === 0) return;

    Object.keys(this.allRecords()).forEach(toothId => {
      const record = this.allRecords()[toothId];
      const numMatch = toothId.match(/tooth_(.+)/);
      if (numMatch) {
        const toothNumStr = numMatch[1];
        const toothGroup = this.jawGroup.getObjectByName(`tooth_${toothNumStr}`);
        if (toothGroup) {
          const mats = this.getToothMaterials(record.status);
          
          toothGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.name === 'enamel') {
                child.material = mats.enamel;
                child.visible = mats.enamelVisible;
              } else if (child.name.toLowerCase().includes('pulp') || child.name.toLowerCase().includes('canal')) {
                child.material = mats.pulp;
              }
            }
          });
        }
      }
    });
  }

  /**
   * Initializes Three.js Scene, Camera, Lights, and OrbitControls
   */
  private initThree() {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 4, 16);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't orbit below the jaw
    this.controls.target.set(0, 0, 0);

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(-10, 10, 10);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(10, 8, 10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x818cf8, 1.5, 30);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // 6. Group to hold all teeth meshes
    this.jawGroup = new THREE.Group();
    this.scene.add(this.jawGroup);
  }

  /**
   * Attempts to load a 3D dental model glb using GLTFLoader.
   * Gracefully falls back to procedurally generated teeth if file is missing.
   */
  private loadDentalModel() {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      'assets/models/dental-model.glb',
      (gltf) => {
        const model = gltf.scene;
        this.applyMaterials(model);
        this.jawGroup.add(model);
        this.loadingModel.set(false);
        this.updateAllTeethAppearances();
      },
      undefined,
      (error) => {
        console.warn('GLB dental model not found. Generating skeuomorphic fallback model...');
        this.buildProceduralTeeth();
        this.loadingModel.set(false);
        this.updateAllTeethAppearances();
      }
    );
  }

  /**
   * Traverses meshes and sets Enamel glass & Pulp emissive materials
   */
  private applyMaterials(model: THREE.Group) {
    const enamelMaterial = this.materials['healthy'].enamel;
    const pulpMaterial = this.materials['healthy'].pulp;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('enamel') || name.includes('tooth') || name.includes('crown')) {
          child.material = enamelMaterial;
          child.name = 'enamel';
        } else if (name.includes('pulp') || name.includes('canal')) {
          child.material = pulpMaterial;
        }
      }
    });
  }

  /**
   * Generates a procedurally drawn 3D jaw of 32 teeth
   */
  private buildProceduralTeeth() {
    const rx = 4.8;
    const rz = 5.6;
    const numTeeth = 16;

    const gumPointsUpper: THREE.Vector3[] = [];
    const gumPointsLower: THREE.Vector3[] = [];

    const enamelMaterial = this.materials['healthy'].enamel;
    const pulpMaterial = this.materials['healthy'].pulp;

    const buildSingleTooth = (universalNum: number, isUpper: boolean): THREE.Group => {
      const tooth = new THREE.Group();
      tooth.name = `tooth_${universalNum}`;
      tooth.userData = { toothNumber: universalNum };

      // Determine size factors based on tooth type
      const isMolar = [18, 17, 16, 26, 27, 28, 38, 37, 36, 46, 47, 48].includes(universalNum);
      const isPremolar = [15, 14, 24, 25, 34, 35, 44, 45].includes(universalNum);
      
      let crownRadius = 0.5;
      let crownHeight = 0.9;
      let rootCount = 1;
      let rootHeight = 1.1;

      if (isMolar) {
        crownRadius = 0.72;
        crownHeight = 1.0;
        rootCount = isUpper ? 3 : 2; // Upper molars have 3 roots, lower have 2
        rootHeight = 1.3;
      } else if (isPremolar) {
        crownRadius = 0.54;
        crownHeight = 0.85;
        rootCount = 2;
        rootHeight = 1.1;
      } else {
        // Anterior teeth (Incisors / Canines)
        crownRadius = 0.42;
        crownHeight = 0.95;
        rootCount = 1;
        rootHeight = 1.25;
      }

      // 1. Enamel Crown Mesh
      const crownGeo = new THREE.CylinderGeometry(crownRadius, crownRadius * 0.85, crownHeight, 8);
      const crownMesh = new THREE.Mesh(crownGeo, enamelMaterial);
      crownMesh.name = 'enamel';
      crownMesh.castShadow = true;
      crownMesh.receiveShadow = true;
      
      // Flatten anterior teeth crown slightly in Z direction to make them anatomically incisor-like
      if (!isMolar && !isPremolar) {
        crownMesh.scale.set(1.2, 1.0, 0.6);
      }
      tooth.add(crownMesh);

      // 2. Pulp Chamber inside Crown
      const pulpRadius = crownRadius * 0.42;
      const pulpGeo = new THREE.SphereGeometry(pulpRadius, 8, 8);
      const pulpMesh = new THREE.Mesh(pulpGeo, pulpMaterial);
      pulpMesh.position.y = -0.05;
      tooth.add(pulpMesh);

      // 3. Roots and Root Canals
      const rootOffset = crownRadius * 0.35;
      for (let r = 0; r < rootCount; r++) {
        const rootGroup = new THREE.Group();
        
        // Position root slightly offset from center if multiple roots
        if (rootCount > 1) {
          const angle = (r / rootCount) * Math.PI * 2;
          rootGroup.position.set(Math.cos(angle) * rootOffset, -crownHeight / 2 - rootHeight / 2, Math.sin(angle) * rootOffset);
        } else {
          rootGroup.position.set(0, -crownHeight / 2 - rootHeight / 2, 0);
        }

        // Root Enamel Shell
        const rootGeo = new THREE.ConeGeometry(crownRadius * 0.5, rootHeight, 8);
        const rootMesh = new THREE.Mesh(rootGeo, enamelMaterial);
        rootMesh.name = 'enamel';
        rootMesh.rotation.x = Math.PI; // point downwards
        rootGroup.add(rootMesh);

        // Root Canal (emissive tube)
        const canalGeo = new THREE.CylinderGeometry(0.06, 0.02, rootHeight * 0.9, 4);
        const canalMesh = new THREE.Mesh(canalGeo, pulpMaterial);
        canalMesh.position.y = 0; // align inside root cone
        rootGroup.add(canalMesh);

        tooth.add(rootGroup);
      }

      return tooth;
    };

    // Build Maxillary Arch (Upper Jaw)
    for (let i = 0; i < numTeeth; i++) {
      const pct = i / (numTeeth - 1);
      const theta = -1.25 + pct * 2.5;

      const x = rx * Math.sin(theta);
      const z = rz * Math.cos(theta) - rz * 0.35;
      const y = 1.05;

      const universalNum = i < 8 ? (18 - i) : (21 + (i - 8));
      const tooth = buildSingleTooth(universalNum, true);
      
      tooth.position.set(x, y, z);
      
      // Face teeth outwards
      const angle = Math.atan2(x, z);
      tooth.rotation.y = angle;
      tooth.rotation.x = Math.PI; // flip upper teeth upside down

      this.jawGroup.add(tooth);
      gumPointsUpper.push(new THREE.Vector3(x, y + 0.5, z));
    }

    // Build Mandibular Arch (Lower Jaw)
    for (let i = 0; i < numTeeth; i++) {
      const pct = i / (numTeeth - 1);
      const theta = -1.25 + pct * 2.5;

      const x = (rx * 0.96) * Math.sin(theta);
      const z = (rz * 0.96) * Math.cos(theta) - (rz * 0.96) * 0.35;
      const y = -1.05;

      const universalNum = i < 8 ? (48 - i) : (31 + (i - 8));
      const tooth = buildSingleTooth(universalNum, false);
      
      tooth.position.set(x, y, z);
      
      // Face teeth outwards
      const angle = Math.atan2(x, z);
      tooth.rotation.y = angle;

      this.jawGroup.add(tooth);
      gumPointsLower.push(new THREE.Vector3(x, y - 0.5, z));
    }

    // Gums Support structures (Mesh Tubes along jaw curves)
    const gumMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.5,
      clearcoat: 0.2
    });

    const upperGumCurve = new THREE.CatmullRomCurve3(gumPointsUpper);
    const upperGumGeo = new THREE.TubeGeometry(upperGumCurve, 64, 0.45, 8, false);
    const upperGumMesh = new THREE.Mesh(upperGumGeo, gumMat);
    this.jawGroup.add(upperGumMesh);

    const lowerGumCurve = new THREE.CatmullRomCurve3(gumPointsLower);
    const lowerGumGeo = new THREE.TubeGeometry(lowerGumCurve, 64, 0.45, 8, false);
    const lowerGumMesh = new THREE.Mesh(lowerGumGeo, gumMat);
    this.jawGroup.add(lowerGumMesh);
  }

  /**
   * Raycaster click event handler
   */
  onCanvasClick(event: MouseEvent) {
    if (this.isAnimating || this.loadingModel()) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.jawGroup.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.name.startsWith('tooth_')) {
        obj = obj.parent;
      }

      if (obj && obj.name.startsWith('tooth_')) {
        this.selectTooth(obj.name);
      }
    }
  }

  /**
   * Selects a tooth mesh and tweens camera focus onto it
   */
  private selectTooth(toothId: string) {
    if (this.isAnimating) return;
    this.selectedToothId.set(toothId);

    // Sync Form fields and history logs
    this.dentalDataService.getEndodonticRecord(toothId).subscribe(record => {
      if (record) {
        this.editStatuses = Array.isArray(record.status) ? [...record.status] : [record.status as any];
        this.editPain = record.painLevel;
        this.editNotes = record.clinicalNotes;

        // Load logs
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
          const defaultLogs = [{
            id: Date.now() - 5 * 24 * 60 * 60 * 1000,
            date: record.lastUpdated,
            status: Array.isArray(record.status) ? record.status : [record.status],
            painLevel: record.painLevel,
            treatment: record.clinicalNotes
          }];
          this.historyLogs.set(defaultLogs);
          localStorage.setItem(historyKey, JSON.stringify(defaultLogs));
        }
      }
    });


    const toothGroup = this.jawGroup.getObjectByName(toothId);
    if (!toothGroup) return;

    this.isAnimating = true;

    // 1. Calculate center of tooth mesh
    const box = new THREE.Box3().setFromObject(toothGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 2. Compute normal pointing outwards from the jaw center
    const dir = new THREE.Vector3(toothGroup.position.x, 0, toothGroup.position.z).normalize();

    // 3. Position camera 3.6 units in front of the tooth
    const targetCamPos = new THREE.Vector3()
      .copy(center)
      .addScaledVector(dir, 3.6);

    // Look slightly down/up at the tooth
    const isUpper = parseInt(toothId.split('_')[1]) <= 16;
    targetCamPos.y = center.y + (isUpper ? -0.4 : 0.4);

    // Turn off auto-rotation
    this.isRotating.set(false);

    // 4. GSAP Camera & target Tweening
    this.controls.enabled = false;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    gsap.timeline({
      onComplete: () => {
        this.controls.enabled = true;
        this.isAnimating = false;
      }
    })
    .to(this.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0)
    .to(this.controls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0);
  }

  /**
   * Animates the camera and controls back to default overview state
   */
  resetView() {
    if (this.isAnimating) return;
    this.selectedToothId.set(null);
    this.isAnimating = true;

    this.controls.enabled = false;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    const defaultCamPos = new THREE.Vector3(0, 4, 16);
    const defaultTarget = new THREE.Vector3(0, 0, 0);

    gsap.timeline({
      onComplete: () => {
        this.controls.enabled = true;
        this.isAnimating = false;
      }
    })
    .to(this.camera.position, {
      x: defaultCamPos.x,
      y: defaultCamPos.y,
      z: defaultCamPos.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0)
    .to(this.controls.target, {
      x: defaultTarget.x,
      y: defaultTarget.y,
      z: defaultTarget.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    }, 0);
  }

  /**
   * Render Loop
   */
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Auto rotate if active
    if (this.isRotating() && this.jawGroup) {
      this.jawGroup.rotation.y += 0.002;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Toggle Enamel Visibility
   */
  toggleEnamel() {
    this.showEnamel.update((val) => !val);
  }

  /**
   * Toggle Auto Orbit Rotation
   */
  toggleRotation() {
    this.isRotating.update((val) => !val);
  }

  /**
   * Window resize handler
   */
  @HostListener('window:resize')
  onWindowResize() {
    if (!this.canvasContainer) return;
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  updatePainVal(val: number) {
    this.editPain = val;
  }
  saveToothLog() {
    const id = this.selectedToothId();
    if (!id) return;

    this.dentalDataService.getEndodonticRecord(id).subscribe(record => {
      if (!record) return;

      record.status = [...this.editStatuses];
      record.painLevel = this.editPain;
      record.clinicalNotes = this.editNotes;

      this.dentalDataService.updateEndodonticRecord(record).subscribe(updated => {
        // Save to history log
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

        // Refresh state
        this.refreshRecords();
      });
    });
  }
}
