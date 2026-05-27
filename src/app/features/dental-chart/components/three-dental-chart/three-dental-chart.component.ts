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

@Component({
  selector: 'app-three-dental-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
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

  constructor() {
    // React to enamel visibility toggle
    effect(() => {
      const visible = this.showEnamel();
      if (this.jawGroup) {
        this.jawGroup.traverse((child) => {
          if (child.name === 'enamel') {
            child.visible = visible;
          }
        });
      }
    });
  }

  ngOnInit() {
    // Component initialization
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
      },
      undefined,
      (error) => {
        console.warn('GLB dental model not found. Generating skeuomorphic fallback model...');
        this.buildProceduralTeeth();
        this.loadingModel.set(false);
      }
    );
  }

  /**
   * Traverses meshes and sets Enamel glass & Pulp emissive materials
   */
  private applyMaterials(model: THREE.Group) {
    const enamelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.95,
      roughness: 0.1,
      ior: 1.62,
      thickness: 1.0,
      transparent: true,
      opacity: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const pulpMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xea580c,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.1
    });

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

    // Materials
    const enamelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.95,
      roughness: 0.08,
      ior: 1.62,
      thickness: 1.2,
      transparent: true,
      opacity: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    const pulpMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xea580c,
      emissiveIntensity: 3.0,
      roughness: 0.2,
      metalness: 0.1
    });

    const buildSingleTooth = (universalNum: number, isUpper: boolean): THREE.Group => {
      const tooth = new THREE.Group();
      tooth.name = `tooth_${universalNum}`;
      tooth.userData = { toothNumber: universalNum };

      // Determine size factors based on tooth type
      const isMolar = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(universalNum);
      const isPremolar = [4, 5, 12, 13, 20, 21, 28, 29].includes(universalNum);
      
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

      const universalNum = i + 1; // 1 to 16
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

      // Slightly smaller arch size for lower jaw to fit inside upper teeth comfortably
      const x = (rx * 0.96) * Math.sin(theta);
      const z = (rz * 0.96) * Math.cos(theta) - (rz * 0.96) * 0.35;
      const y = -1.05;

      const universalNum = 32 - i; // 17 to 32
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
      // Trace up parent nodes to locate the main tooth group
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
}
