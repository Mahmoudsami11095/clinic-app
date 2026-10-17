/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AddPaymentRequest {
  /** @format double */
  amount?: number;
  paymentMethod?: string | null;
  date?: string | null;
}

export interface AdjudicateClaimDto {
  /** @minLength 1 */
  status: string;
  /** @format double */
  approvedAmount?: number | null;
  adjudicationNotes?: string | null;
  rejectionReason?: string | null;
}

export interface AmendClinicalNoteDto {
  amendedText?: string | null;
  reason?: string | null;
}

export interface AppointmentDto {
  id?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  date?: string | null;
  status?: string | null;
  type?: string | null;
  notes?: string | null;
  clinicId?: string | null;
  arrivedAt?: string | null;
  consultationStartedAt?: string | null;
  consultationEndedAt?: string | null;
  /** @format int32 */
  queueNumber?: number | null;
  lastReminderSentAt?: string | null;
  /** @format int32 */
  reminderCount?: number | null;
  roomNumber?: string | null;
}

export interface ApproveStockTransferDto {
  batchNumber?: string | null;
  /** @format date-time */
  expiryDate?: string | null;
  notes?: string | null;
}

export interface AssignAssistantRequest {
  email?: string | null;
}

export interface AssignChairDto {
  patientId?: string | null;
  patientName?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  procedureName?: string | null;
  notes?: string | null;
}

export interface BillingRecordDto {
  id?: string | null;
  patientId?: string | null;
  appointmentId?: string | null;
  invoiceNumber?: string | null;
  /** @format double */
  subtotal?: number;
  /** @format double */
  discountPercentage?: number;
  /** @format double */
  discountAmount?: number;
  discountReason?: string | null;
  discountAuthorizedBy?: string | null;
  /** @format double */
  amount?: number;
  /** @format double */
  paidAmount?: number | null;
  status?: string | null;
  dateIssued?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  clinicId?: string | null;
  voidReason?: string | null;
  voidedAt?: string | null;
  payments?: PaymentLogDto[] | null;
}

export interface ButtonReplyPayload {
  id?: string | null;
  title?: string | null;
}

export interface CalculatePerioStagingRequest {
  /** @format int32 */
  patientAge?: number;
  /** @format double */
  boneLossPercentage?: number;
  isSmoker?: boolean;
  /** @format int32 */
  cigarettesPerDay?: number;
  /** @format double */
  hbA1c?: number | null;
  teeth?: PeriodontalToothDto[] | null;
}

export interface CdsEvaluationRequestDto {
  patientId?: string | null;
  prescribedMolecules?: string[] | null;
  patientChronicMedications?: string[] | null;
  patientChronicConditions?: string[] | null;
  /** @format double */
  patientWeightKg?: number | null;
  /** @format int32 */
  patientAgeYears?: number | null;
}

export interface CephMeasurementDto {
  parameter?: string | null;
  nameAr?: string | null;
  /** @format double */
  value?: number;
  unit?: string | null;
  /** @format double */
  normMin?: number;
  /** @format double */
  normMax?: number;
  interpretation?: string | null;
  interpretationAr?: string | null;
  clinicalStatus?: string | null;
}

export interface CephPointDto {
  id?: string | null;
  name?: string | null;
  nameAr?: string | null;
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
  /** @format double */
  confidence?: number;
  isManuallyAdjusted?: boolean;
}

export interface CephalometricVtoSimulationRequestDto {
  recordId?: string | null;
  /** @format double */
  leFortIMaxillaryHorizontalMm?: number;
  /** @format double */
  leFortIMaxillaryVerticalMm?: number;
  /** @format double */
  bssoMandibularHorizontalMm?: number;
  /** @format double */
  bssoMandibularVerticalMm?: number;
  /** @format double */
  genioplastyHorizontalMm?: number;
  /** @format double */
  genioplastyVerticalMm?: number;
  baseLandmarks?: CephPointDto[] | null;
}

export interface CheckAvailabilityRequest {
  email?: string | null;
  phone?: string | null;
}

export interface ClinicDto {
  id?: string | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  creatorDoctorId?: string | null;
  status?: string | null;
  availabilityHours?: string | null;
  availabilityDays?: string | null;
  /** @format int32 */
  assistantCount?: number;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  branchCode?: string | null;
  rooms?: string | null;
  slug?: string | null;
  publicBookingEnabled?: boolean;
  qrPosterAssetUrl?: string | null;
}

export interface ConsentSignatureRequest {
  signature?: string | null;
}

export interface ConsumedMaterialDto {
  materialId?: string | null;
  /** @format int32 */
  quantity?: number;
}

export interface CreateClinicalNoteDto {
  patientId?: string | null;
  title?: string | null;
  category?: string | null;
  notes?: string | null;
  clinicId?: string | null;
}

export interface CreateCommissionPayoutDto {
  doctorId?: string | null;
  clinicId?: string | null;
  /** @format date-time */
  periodStart?: string | null;
  /** @format date-time */
  periodEnd?: string | null;
  notes?: string | null;
}

export interface CreateDiagnosticRequisitionDto {
  clinicId?: string | null;
  doctorId?: string | null;
  patientId?: string | null;
  /** @format int32 */
  toothNumber?: number | null;
  serviceType?: string | null;
  indications?: string | null;
  partnerName?: string | null;
}

export interface CreateInformedConsentDto {
  /** @minLength 1 */
  clinicId: string;
  /** @minLength 1 */
  patientId: string;
  /** @minLength 1 */
  doctorId: string;
  appointmentId?: string | null;
  /** @minLength 1 */
  procedureType: string;
  /** @minLength 1 */
  procedureName: string;
  /** @format int32 */
  toothNumber?: number | null;
  clinicalRiskDisclosures?: string[] | null;
  specialMedicalCautions?: string | null;
}

export interface CreateInsuranceClaimDto {
  /** @minLength 1 */
  clinicId: string;
  /** @minLength 1 */
  patientId: string;
  /** @minLength 1 */
  doctorId: string;
  /** @minLength 1 */
  insuranceProviderId: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  policyNumber: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  memberId: string;
  /** @format int32 */
  toothNumber?: number | null;
  /**
   * @minLength 1
   * @maxLength 50
   */
  diagnosisCode: string;
  /**
   * @minLength 1
   * @maxLength 500
   */
  procedureDescription: string;
  /**
   * @format double
   * @min 1
   * @max 1000000
   */
  totalGrossAmount?: number;
  /**
   * @format double
   * @min 0
   * @max 100
   */
  copayPercentage?: number;
  preAuthNotes?: string | null;
  claimFileUrls?: string[] | null;
}

export interface CreateInsuranceProviderDto {
  /**
   * @minLength 1
   * @maxLength 200
   */
  name: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  payerCode: string;
  /**
   * @format double
   * @min 0
   * @max 1000000
   */
  preAuthThreshold?: number;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface CreateOrUpdateCommissionPlanDto {
  doctorId?: string | null;
  clinicId?: string | null;
  /** @format double */
  defaultCommissionRate?: number;
  labFeeDeductionType?: string | null;
  specialtyRates?: Record<string, number> | null;
  isActive?: boolean;
}

export interface CreatePatientRecallDto {
  /** @minLength 1 */
  clinicId: string;
  /** @minLength 1 */
  patientId: string;
  /** @minLength 1 */
  doctorId: string;
  sourceAppointmentId?: string | null;
  /** @minLength 1 */
  recallType: string;
  /** @format int32 */
  recallIntervalMonths?: number;
  /** @format date-time */
  customDueDate?: string | null;
  clinicalNotes?: string | null;
}

export interface CreatePaymentPlanDto {
  /** @minLength 1 */
  clinicId: string;
  /** @minLength 1 */
  patientId: string;
  /** @minLength 1 */
  doctorId: string;
  treatmentPlanId?: string | null;
  billingRecordId?: string | null;
  /** @minLength 1 */
  title: string;
  /**
   * @format double
   * @min 1
   * @max 1000000
   */
  totalAmount?: number;
  /**
   * @format double
   * @min 0
   * @max 1000000
   */
  downPayment?: number;
  /**
   * @format double
   * @min 0
   * @max 100
   */
  interestRate?: number;
  /**
   * @format int32
   * @min 1
   * @max 60
   */
  numberOfInstallments?: number;
  installmentFrequency?: string | null;
  /** @minLength 1 */
  startDate: string;
  notes?: string | null;
}

export interface CreatePurchaseOrderDto {
  clinicId?: string | null;
  supplierId?: string | null;
  items?: PurchaseOrderItemDto[] | null;
}

export interface CreateRadiologyCenterDto {
  name?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CreateRadiologyRecordDto {
  doctorId?: string | null;
  patientId?: string | null;
  radiologyCenterId?: string | null;
  procedureName?: string | null;
  /** @format double */
  amountPaid?: number;
  date?: string | null;
  notes?: string | null;
}

export interface CreateStockTransferRequestDto {
  /** @minLength 1 */
  sourceClinicId: string;
  /** @minLength 1 */
  destinationClinicId: string;
  /** @minLength 1 */
  materialId: string;
  /**
   * @format int32
   * @min 1
   * @max 10000
   */
  quantityRequested?: number;
  priority?: string | null;
  notes?: string | null;
}

export interface CreateTelehealthSessionRequest {
  clinicId?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  invitedSpecialistId?: string | null;
  invitedSpecialistName?: string | null;
  invitedSpecialty?: string | null;
}

export interface DentalLogDto {
  id?: string | null;
  patientId?: string | null;
  toothNumber?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  date?: string | null;
  status?: string[] | null;
  /** @format int32 */
  painLevel?: number;
  painDetails?: string | null;
  treatment?: string | null;
  medication?: string | null;
  isPlanned?: boolean;
  stage?: string | null;
  /** @format double */
  cost?: number;
  invoiceId?: string | null;
  consumedMaterials?: ConsumedMaterialDto[] | null;
  clinicId?: string | null;
}

export interface DispatchRecallDto {
  channel?: string | null;
  customMessage?: string | null;
}

export interface DispatchStockTransferDto {
  /**
   * @format int32
   * @min 1
   * @max 10000
   */
  quantityDispatched?: number;
  batchNumber?: string | null;
  /** @format date-time */
  expiryDate?: string | null;
  notes?: string | null;
}

export interface DoctorAvailabilityDto {
  days?: string[] | null;
  hours?: string | null;
}

export interface DoctorClinicAvailabilityDto {
  clinicId?: string | null;
  availabilityHours?: string | null;
  availabilityDays?: string[] | null;
}

export interface DoctorClinicAvailabilityRequest {
  clinicId?: string | null;
  availabilityHours?: string | null;
  availabilityDays?: string[] | null;
}

export interface DoctorCountersignDto {
  /** @minLength 1 */
  doctorSignatureBase64: string;
  doctorSyndicateNumber?: string | null;
}

export interface DoctorDto {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  availability?: DoctorAvailabilityDto;
  clinicIds?: string[] | null;
  clinicAvailabilities?: DoctorClinicAvailabilityDto[] | null;
}

export interface EndTelehealthSessionRequest {
  clinicalSummary?: string | null;
  /** @format int32 */
  durationSeconds?: number | null;
}

export interface EndoPoint2DDto {
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

export interface EquipmentDto {
  id?: string | null;
  clinicId?: string | null;
  doctorId?: string | null;
  name?: string | null;
  category?: string | null;
  serialNumber?: string | null;
  modelNumber?: string | null;
  manufacturer?: string | null;
  roomOrChair?: string | null;
  status?: string | null;
  /** @format double */
  purchaseCost?: number | null;
  /** @format date-time */
  purchaseDate?: string | null;
  /** @format date-time */
  warrantyExpiryDate?: string | null;
  /** @format date-time */
  lastMaintenanceDate?: string | null;
  /** @format date-time */
  nextMaintenanceDate?: string | null;
  maintenanceNotes?: string | null;
  serviceProvider?: string | null;
  serviceContactPhone?: string | null;
  imageUrl?: string | null;
  /** @format date-time */
  createdAt?: string | null;
  isMaintenanceDue?: boolean;
  isWarrantyExpired?: boolean;
}

export interface EquipmentMaintenanceLogRequest {
  /** @format date-time */
  serviceDate?: string;
  /** @format date-time */
  nextDueDate?: string | null;
  notes?: string | null;
  status?: string | null;
  serviceProvider?: string | null;
  serviceContactPhone?: string | null;
}

export interface EvaluateDrillTelemetryRequest {
  /** @format double */
  tipPositionX?: number;
  /** @format double */
  tipPositionY?: number;
  /** @format double */
  tipPositionZ?: number;
  /** @format double */
  axisVectorX?: number;
  /** @format double */
  axisVectorY?: number;
  /** @format double */
  axisVectorZ?: number;
  /** @format double */
  drillLengthMm?: number;
}

export interface FinalizePrescriptionDto {
  doctorName?: string | null;
}

export interface ForgotPasswordRequest {
  email?: string | null;
}

export interface GenerateAiClaimDto {
  /** @minLength 1 */
  radiologyRecordId: string;
  clinicId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  /** @minLength 1 */
  insuranceProviderId: string;
  policyNumber?: string | null;
  memberId?: string | null;
  acceptedFindingIds?: string[] | null;
  doctorClinicalNotes?: string | null;
}

export interface InteractivePayload {
  type?: string | null;
  buttonReply?: ButtonReplyPayload;
}

export interface InwardShipmentRequest {
  /** @format int32 */
  quantityReceived?: number;
  supplierName?: string | null;
  purchaseOrderRef?: string | null;
  batchNumber?: string | null;
  /** @format date-time */
  expirationDate?: string | null;
  /** @format double */
  unitCost?: number | null;
}

export interface IssueTelePrescriptionRequest {
  patientId?: string | null;
  patientName?: string | null;
  medications?: TelehealthMedicationItemDto[] | null;
  notes?: string | null;
  dispatchChannel?: string | null;
}

export interface JoinStandbyRequest {
  doctorId?: string | null;
  patientId?: string | null;
  requestedDate?: string | null;
}

export interface LabWorkOrderCreateLabWorkOrderRequest {
  patientId?: string | null;
  patientName?: string | null;
  /** @format int32 */
  toothNumber?: number;
  restorationType?: string | null;
  material?: string | null;
  shade?: string | null;
  stumpShade?: string | null;
  stlScanUrl?: string | null;
  labPartnerName?: string | null;
  /** @format int32 */
  estimatedDays?: number | null;
  modelFileFormat?: string | null;
  /** @format int32 */
  meshPolyCount?: number | null;
  /** @format int64 */
  scanFileSize?: number | null;
  modelBoundingBoxMm?: string | null;
}

export interface LabWorkOrderDirectScanArchDto {
  archType?: string | null;
  /** @format int32 */
  vertexCount?: number;
  /** @format double */
  surfaceAreaMm2?: number;
  /** @format double */
  pointDensityPtsPerMm2?: number;
  /** @format double */
  completenessPercent?: number;
  qualityStatus?: string | null;
}

export interface LabWorkOrderDsdToothProportionDto {
  toothFdi?: string | null;
  /** @format double */
  widthMm?: number;
  /** @format double */
  lengthMm?: number;
  /** @format double */
  widthToLengthRatio?: number;
  /** @format double */
  goldenRatioDeviationPercent?: number;
  isGoldenProportionCompliant?: boolean;
}

export interface LabWorkOrderEmergenceSplinePointDto {
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
  /** @format double */
  z?: number;
  /** @format double */
  angleDeg?: number;
  zoneType?: string | null;
}

export interface LabWorkOrderFusionPointPairDto {
  /** @format double */
  scanX?: number;
  /** @format double */
  scanY?: number;
  /** @format double */
  scanZ?: number;
  /** @format double */
  cbctX?: number;
  /** @format double */
  cbctY?: number;
  /** @format double */
  cbctZ?: number;
  landmarkName?: string | null;
}

export interface LabWorkOrderGbrFixationScrewDto {
  screwId?: string | null;
  /** @format double */
  positionX?: number;
  /** @format double */
  positionY?: number;
  /** @format double */
  positionZ?: number;
  /** @format double */
  diameterMm?: number;
  /** @format double */
  lengthMm?: number;
  /** @format double */
  boneClearanceMm?: number;
  /** @format double */
  nerveClearanceMm?: number;
  isCorticalEngaged?: boolean;
  hasSafetyCorridorViolation?: boolean;
}

export interface LabWorkOrderGenerateCamGCodeRequest {
  blankMaterial?: string | null;
  /** @format double */
  blankThicknessMm?: number | null;
  /** @format double */
  shrinkageFactor?: number | null;
  /** @format double */
  spindleRpm?: number | null;
  /** @format double */
  feedRateMmMin?: number | null;
  /** @format double */
  stepoverMm?: number | null;
  /** @format double */
  stepdownMm?: number | null;
  outputDialect?: string | null;
}

export interface LabWorkOrderMarginPointDto {
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
  /** @format double */
  z?: number;
  /** @format int32 */
  index?: number;
}

export interface LabWorkOrderRpdClaspAssemblyDto {
  toothFdi?: string | null;
  claspType?: string | null;
  restSeatType?: string | null;
  /** @format double */
  undercutDepthMm?: number;
  hasReciprocalArm?: boolean;
  isSurveyCompliant?: boolean;
}

export interface LabWorkOrderSaveAlignerPlanRequest {
  /** @format int32 */
  totalStages?: number | null;
  /** @format int32 */
  currentStage?: number | null;
  /** @format double */
  maxTranslationDeltaMm?: number | null;
  /** @format double */
  maxRotationDeltaDeg?: number | null;
  /** @format double */
  totalIprMm?: number | null;
  /** @format double */
  foilThicknessMm?: number | null;
  isTreatmentApproved?: boolean | null;
}

export interface LabWorkOrderSaveArticulatorSettingsRequest {
  /** @format double */
  condylarInclinationDeg?: number;
  /** @format double */
  bennettAngleDeg?: number;
  /** @format double */
  incisalPinOpeningMm?: number;
  excursionType?: string | null;
  /** @format double */
  maxInterferenceMm?: number;
  /** @format int32 */
  activeContactCount?: number;
  hasInterferenceWarning?: boolean | null;
  statusMessage?: string | null;
}

export interface LabWorkOrderSaveClearanceHeatmapRequest {
  /** @format double */
  undercutSurfacePercent?: number;
  /** @format double */
  minClearanceMm?: number;
  /** @format double */
  maxClearanceMm?: number;
  /** @format double */
  insertionTiltMesialDistalDeg?: number;
  /** @format double */
  insertionTiltBuccalLingualDeg?: number;
  isCompliant?: boolean | null;
  statusMessage?: string | null;
}

export interface LabWorkOrderSaveCrownMorphologyRequest {
  toothType?: string | null;
  /** @format int32 */
  cementSpacerMicrons?: number | null;
  /** @format double */
  marginCollarMm?: number | null;
  /** @format double */
  occlusalReductionMm?: number | null;
  proximalContactStrength?: string | null;
  /** @format double */
  cuspHeightScale?: number | null;
  isRestorationApproved?: boolean | null;
}

export interface LabWorkOrderSaveCustomAbutmentPlanRequest {
  implantPlatformBrand?: string | null;
  implantPlatformModel?: string | null;
  /** @format double */
  platformDiameterMm?: number | null;
  scanbodyType?: string | null;
  /** @format double */
  scanbodyPositionX?: number | null;
  /** @format double */
  scanbodyPositionY?: number | null;
  /** @format double */
  scanbodyPositionZ?: number | null;
  /** @format double */
  implantAxisRollDeg?: number | null;
  /** @format double */
  implantAxisPitchDeg?: number | null;
  /** @format double */
  implantAxisYawDeg?: number | null;
  antiRotationIndex?: string | null;
  /** @format double */
  emergenceAngleDeg?: number | null;
  /** @format double */
  criticalContourHeightMm?: number | null;
  /** @format double */
  subcriticalContourHeightMm?: number | null;
  /** @format double */
  ascAngleDeg?: number | null;
  ascAccessDirection?: string | null;
  /** @format double */
  minWallThicknessMm?: number | null;
  abutmentMaterial?: string | null;
  /** @format double */
  tiBaseCementGapMicrons?: number | null;
  /** @format double */
  cncBlankHolderDiameterMm?: number | null;
  isFabricationApproved?: boolean | null;
  splinePoints?: LabWorkOrderEmergenceSplinePointDto[] | null;
}

export interface LabWorkOrderSaveDirectScanRequest {
  scannerBrand?: string | null;
  scannerModel?: string | null;
  scannerSerialNumber?: string | null;
  firmwareVersion?: string | null;
  /** @format double */
  sensorTemperatureCelsius?: number | null;
  sha256DigitalSeal?: string | null;
  arches?: LabWorkOrderDirectScanArchDto[] | null;
}

export interface LabWorkOrderSaveDsdSmilePlanRequest {
  /** @format double */
  facialMidlineOffsetMm?: number | null;
  /** @format double */
  interpupillaryAngleDeg?: number | null;
  /** @format double */
  smileArcCurvatureRadiusMm?: number | null;
  /** @format double */
  centralIncisorWidthMm?: number | null;
  /** @format double */
  centralIncisorLengthMm?: number | null;
  /** @format double */
  targetWidthToLengthRatio?: number | null;
  isAestheticHarmonized?: boolean | null;
  proportions?: LabWorkOrderDsdToothProportionDto[] | null;
}

export interface LabWorkOrderSaveDualModalityFusionRequest {
  dicomSeriesUid?: string | null;
  registrationLandmarks?: LabWorkOrderFusionPointPairDto[] | null;
  /** @format double */
  boneOpacityPercent?: number | null;
  /** @format double */
  softTissueOpacityPercent?: number | null;
  /** @format double */
  subsurfaceBoneClearanceMm?: number | null;
  /** @format double */
  nerveDistanceMm?: number | null;
  isFusionApproved?: boolean | null;
}

export interface LabWorkOrderSaveGbrMeshPlanRequest {
  /** @format double */
  defectVolumeMm3?: number | null;
  /** @format double */
  meshThicknessMm?: number | null;
  /** @format double */
  porosityPercent?: number | null;
  /** @format double */
  poreDiameterMm?: number | null;
  /** @format double */
  tentPoleCrestalClearanceMm?: number | null;
  isFabricationApproved?: boolean | null;
  fixationScrews?: LabWorkOrderGbrFixationScrewDto[] | null;
}

export interface LabWorkOrderSaveImplantSurgicalGuideRequest {
  implantSystem?: string | null;
  /** @format double */
  sleeveDiameterMm?: number | null;
  /** @format double */
  sleeveInnerDiameterMm?: number | null;
  /** @format double */
  sleeveHeightMm?: number | null;
  /** @format double */
  drillOffsetMm?: number | null;
  /** @format double */
  buccoLingualAngleDeg?: number | null;
  /** @format double */
  mesioDistalAngleDeg?: number | null;
  /** @format double */
  stentWallThicknessMm?: number | null;
  /** @format double */
  safetyClearanceMm?: number | null;
  hasInspectionWindow?: boolean | null;
}

export interface LabWorkOrderSaveMarginLineRequest {
  profileType?: string | null;
  /** @format double */
  perimeterMm?: number;
  /** @format double */
  averageWidthMm?: number;
  /** @format double */
  smoothingTension?: number;
  isClosed?: boolean;
  isApproved?: boolean | null;
  hasMarginWarning?: boolean | null;
  statusMessage?: string | null;
  points?: LabWorkOrderMarginPointDto[] | null;
}

export interface LabWorkOrderSaveModelMeasurementRequest {
  label?: string | null;
  /** @format double */
  value?: number;
  unit?: string | null;
  mode?: string | null;
}

export interface LabWorkOrderSaveRpdPlanRequest {
  arch?: string | null;
  kennedyClassification?: string | null;
  /** @format double */
  tiltBuccolingualDeg?: number | null;
  /** @format double */
  tiltMesiodistalDeg?: number | null;
  majorConnectorType?: string | null;
  /** @format double */
  majorConnectorThicknessMm?: number | null;
  /** @format double */
  floorOfMouthDepthMm?: number | null;
  isFabricationApproved?: boolean | null;
  clasps?: LabWorkOrderRpdClaspAssemblyDto[] | null;
}

export interface LabWorkOrderUpdateLabStatusRequest {
  status?: string | null;
  trackingNumber?: string | null;
  technicianNotes?: string | null;
  /** @format date-time */
  estimatedDeliveryDate?: string | null;
}

export interface LabWorkOrderUpload3DModelRequest {
  fileName?: string | null;
  base64Data?: string | null;
  fileFormat?: string | null;
}

export interface LoginRequest {
  email?: string | null;
  password?: string | null;
}

export interface MaterialDto {
  id?: string | null;
  clinicId?: string | null;
  doctorId?: string | null;
  name?: string | null;
  category?: string | null;
  isDefault?: boolean;
  /** @format int32 */
  quantity?: number;
  unit?: string | null;
  /** @format int32 */
  minStockAlert?: number;
  /** @format date-time */
  expirationDate?: string | null;
  batchNumber?: string | null;
  isExpired?: boolean;
  supplierName?: string | null;
  /** @format double */
  unitCost?: number | null;
  lastRestockedAt?: string | null;
  purchaseOrderRef?: string | null;
  imageUrl?: string | null;
}

export interface MedicationItemDto {
  name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
}

export interface OnboardTenantRequest {
  organizationName?: string | null;
  subdomain?: string | null;
  subscriptionTier?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  adminPassword?: string | null;
}

export interface OtpRequest {
  email?: string | null;
  phone?: string | null;
}

export interface PatientDto {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  contactNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  registrationDate?: string | null;
  clinicId?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  pastIllnesses?: string | null;
  consentSignature?: string | null;
  consentSignedAt?: string | null;
}

export interface PaymentLogDto {
  /** @format double */
  amount?: number;
  date?: string | null;
  paymentMethod?: string | null;
}

export interface PerioStagingAssessmentDto {
  stage?: string | null;
  stageDescription?: string | null;
  grade?: string | null;
  gradeDescription?: string | null;
  /** @format double */
  bopPercentage?: number;
  inflammationExtent?: string | null;
  /** @format int32 */
  maxCalMm?: number;
  /** @format int32 */
  maxPpdMm?: number;
  /** @format int32 */
  totalSitesExamined?: number;
  /** @format int32 */
  totalBleedingSites?: number;
  /** @format int32 */
  deepPocketsCount?: number;
  /** @format int32 */
  furcationTeethCount?: number;
  /** @format int32 */
  mobileTeethCount?: number;
  clinicalRiskSummary?: string | null;
  clinicalRiskSummaryAr?: string | null;
}

export interface PeriodontalExamDto {
  examId?: string | null;
  patientId?: string | null;
  /** @format int32 */
  patientAge?: number;
  /** @format date-time */
  examDate?: string;
  examinerName?: string | null;
  isSmoker?: boolean;
  /** @format int32 */
  cigarettesPerDay?: number;
  /** @format double */
  hbA1c?: number | null;
  /** @format double */
  boneLossPercentage?: number;
  assessment?: PerioStagingAssessmentDto;
  teeth?: PeriodontalToothDto[] | null;
  voiceNotes?: string | null;
}

export interface PeriodontalSiteDto {
  siteLocation?: string | null;
  /** @format int32 */
  probingDepthMm?: number;
  /** @format int32 */
  gingivalMarginMm?: number;
  /** @format int32 */
  clinicalAttachmentLossMm?: number;
  hasBleedingOnProbing?: boolean;
  hasSuppuration?: boolean;
}

export interface PeriodontalToothDto {
  /** @format int32 */
  toothNumber?: number;
  isMissing?: boolean;
  isImplant?: boolean;
  /** @format int32 */
  furcationGrade?: number;
  /** @format int32 */
  mobilityGrade?: number;
  sites?: PeriodontalSiteDto[] | null;
}

export interface PortalBookAppointmentRequest {
  patientId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  date?: string | null;
  reason?: string | null;
}

export interface PortalSendOtpRequest {
  phoneNumber?: string | null;
}

export interface PortalVerifyOtpRequest {
  phoneNumber?: string | null;
  code?: string | null;
}

export interface PostOpTriageResolveTriageRequest {
  doctorClinicalAction?: string | null;
}

export interface PostOpTriageSimulateResponseRequest {
  /** @format int32 */
  painScore?: number | null;
  bleedingSeverity?: string | null;
  swellingSeverity?: string | null;
  patientFeedback?: string | null;
}

export interface PostOpTriageTriggerTriageRequest {
  patientId?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  procedureName?: string | null;
  /** @format int32 */
  intervalHours?: number | null;
  immediateDispatch?: boolean;
}

export interface PrescriptionDto {
  id?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  date?: string | null;
  medications?: MedicationItemDto[] | null;
  notes?: string | null;
  isFinalized?: boolean;
  status?: string | null;
  finalizedAt?: string | null;
  digitalSignature?: string | null;
  supersedesPrescriptionId?: string | null;
  supersededById?: string | null;
  supersedeReason?: string | null;
}

export interface ProfileOtpRequest {
  email?: string | null;
  contactNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
}

export interface PromoCode {
  id?: string | null;
  code?: string | null;
  discountType?: string | null;
  /** @format double */
  value?: number;
  /** @format date-time */
  expiryDate?: string;
  /** @format int32 */
  maxUses?: number;
  /** @format int32 */
  currentUses?: number;
  isActive?: boolean;
}

export interface PromoValidationRequest {
  code?: string | null;
}

export interface PublicAppointmentBookingRequestDto {
  doctorId?: string | null;
  date?: string | null;
  time?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  reason?: string | null;
  otpCode?: string | null;
}

export interface PurchaseOrderItemDto {
  materialId?: string | null;
  /** @format int32 */
  quantity?: number;
  /** @format double */
  unitPrice?: number;
}

export interface RecalculateCephRequestDto {
  recordId?: string | null;
  landmarks?: CephPointDto[] | null;
}

export interface RecalculateEndodonticCanalRequestDto {
  /** @format int32 */
  toothNumber?: number;
  canalName?: string | null;
  pointA?: EndoPoint2DDto;
  pointB?: EndoPoint2DDto;
  pointC?: EndoPoint2DDto;
  coronalReferenceLandmark?: string | null;
  diagnosisCondition?: string | null;
  /** @format double */
  customApicalOffsetMm?: number | null;
  /** @format double */
  radiographicRootLengthMm?: number | null;
}

export interface ReceiveStockTransferDto {
  /**
   * @format int32
   * @min 0
   * @max 10000
   */
  quantityReceived?: number;
  /**
   * @format int32
   * @min 0
   * @max 10000
   */
  quantityDamaged?: number;
  damageReason?: string | null;
  notes?: string | null;
}

export interface RecordInstallmentPaymentDto {
  /**
   * @format double
   * @min 0.01
   * @max 1000000
   */
  amount?: number;
  /** @minLength 1 */
  paymentMethod: string;
  transactionReference?: string | null;
  notes?: string | null;
}

export interface RegisterMobileDeviceDto {
  /** @minLength 1 */
  deviceToken: string;
  platform?: string | null;
  appVersion?: string | null;
}

export interface RegisterRequest {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  role?: string | null;
  clinicId?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  availabilityHours?: string | null;
  availabilityDays?: string | null;
  clinicAvailabilityHours?: string | null;
  clinicAvailabilityDays?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  /** @format int32 */
  age?: number | null;
  otpCode?: string | null;
  phoneOtpCode?: string | null;
  title?: string | null;
  clinicIds?: string[] | null;
  doctorId?: string | null;
  patientId?: string | null;
  specialization?: string | null;
  specializationId?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  clinicAvailabilities?: DoctorClinicAvailabilityRequest[] | null;
}

export interface ResetPasswordRequest {
  email?: string | null;
  code?: string | null;
  newPassword?: string | null;
}

export interface RespondAssignmentRequest {
  status?: string | null;
}

export interface SaveCephalometricReportDto {
  recordId?: string | null;
  analysisMethod?: string | null;
  skeletalClass?: string | null;
  growthPattern?: string | null;
  landmarks?: CephPointDto[] | null;
  measurements?: CephMeasurementDto[] | null;
  doctorNotes?: string | null;
}

export interface SaveEndodonticAnalysisRequestDto {
  /** @format int32 */
  toothNumber?: number;
  canalName?: string | null;
  /** @format double */
  schneiderAngleDegrees?: number;
  /** @format double */
  workingLengthMm?: number;
  selectedFileSystem?: string | null;
  doctorNotes?: string | null;
  isVerified?: boolean;
}

export interface SavePeriodontalExamRequest {
  /** @format int32 */
  patientAge?: number;
  examinerName?: string | null;
  isSmoker?: boolean;
  /** @format int32 */
  cigarettesPerDay?: number;
  /** @format double */
  hbA1c?: number | null;
  /** @format double */
  boneLossPercentage?: number;
  teeth?: PeriodontalToothDto[] | null;
  voiceNotes?: string | null;
}

export interface SaveSurgicalNavigationRequest {
  /** @format int32 */
  toothNumber?: number;
  implantBrand?: string | null;
  implantModel?: string | null;
  /** @format double */
  plannedLengthMm?: number;
  /** @format double */
  plannedDiameterMm?: number;
  /** @format double */
  distanceToNerveMm?: number;
  /** @format double */
  distanceToSinusMm?: number;
  /** @format double */
  registrationRmseMm?: number;
}

export interface SendTestPushNotificationDto {
  /** @minLength 1 */
  title: string;
  /** @minLength 1 */
  body: string;
  targetUserId?: string | null;
}

export interface SettleCommissionPayoutDto {
  paymentReference?: string | null;
  notes?: string | null;
}

export interface SignPatientConsentDto {
  /** @minLength 1 */
  patientSignatureBase64: string;
  /** @minLength 1 */
  signatoryName: string;
  signatoryRelationship?: string | null;
}

export interface SnoozeRecallDto {
  /** @format int32 */
  snoozeWeeks?: number;
  reason?: string | null;
}

export interface SocialLoginRequest {
  provider?: string | null;
  token?: string | null;
  role?: string | null;
  title?: string | null;
  password?: string | null;
  contactNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  specialization?: string | null;
  specializationId?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  clinicIds?: string[] | null;
  availabilityDays?: string | null;
  availabilityHours?: string | null;
  clinicAvailabilityHours?: string | null;
  clinicAvailabilityDays?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  clinicId?: string | null;
  clinicAvailabilities?: DoctorClinicAvailabilityRequest[] | null;
}

export interface SterilizationValidateAutoclaveCycleRequest {
  autoclaveSerialNumber?: string | null;
  cycleType?: string | null;
  /** @format int32 */
  plateauDurationSeconds?: number | null;
  /** @format double */
  peakTemperatureC?: number | null;
  /** @format double */
  peakPressureBar?: number | null;
  /** @format double */
  waterConductivityMicroSiemens?: number | null;
  biologicalIndicatorNegative?: boolean | null;
  operatorId?: string | null;
  cassetteTokens?: string[] | null;
}

export interface SubscriptionSetting {
  id?: string | null;
  /** @format double */
  initialSetupFee?: number;
  /** @format double */
  annualSubscriptionFee?: number;
  /** @format int32 */
  trialDurationMonths?: number;
}

export interface SupersedePrescriptionDto {
  reason?: string | null;
  newMedications?: MedicationItemDto[] | null;
  notes?: string | null;
}

export interface SyncAiFindingsRequestDto {
  acceptedFindingIds?: string[] | null;
  doctorNotes?: string | null;
}

export interface TelehealthMedicationItemDto {
  drugName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface TextPayload {
  body?: string | null;
}

export interface TierUpgradeRequest {
  targetTier?: string | null;
}

export interface UnregisterMobileDeviceDto {
  /** @minLength 1 */
  deviceToken: string;
}

export interface UpdateChairStatusDto {
  status?: string | null;
  notes?: string | null;
}

export interface UpdateDentalStageDto {
  stage?: string | null;
}

export interface UserProfileDto {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  role?: string | null;
  title?: string | null;
  clinicId?: string | null;
  doctorId?: string | null;
  specialization?: string | null;
  specializationId?: string | null;
  contactNumber?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  availabilityDays?: string | null;
  availabilityHours?: string | null;
  subscriptionStatus?: string | null;
  /** @format date-time */
  trialEndDate?: string | null;
  /** @format date-time */
  subscriptionEndDate?: string | null;
  isInitialFeePaid?: boolean | null;
  appliedPromoCode?: string | null;
  patientId?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  /** @format double */
  latitude?: number | null;
  /** @format double */
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  allergies?: string | null;
  chronicDiseases?: string | null;
  pastIllnesses?: string | null;
  emailOtpCode?: string | null;
  phoneOtpCode?: string | null;
}

export interface VerifyOtpRequest {
  email?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  code?: string | null;
  removeAfterVerification?: boolean | null;
}

export interface ViewportSyncDto {
  roomToken?: string | null;
  viewType?: string | null;
  /** @format double */
  cameraX?: number;
  /** @format double */
  cameraY?: number;
  /** @format double */
  cameraZ?: number;
  /** @format double */
  rotationPitch?: number;
  /** @format double */
  rotationYaw?: number;
  /** @format double */
  zoomFactor?: number;
  activeAssetId?: string | null;
  /** @format date-time */
  timestampUtc?: string | null;
}

export interface VoidInvoiceRequest {
  reason?: string | null;
}

export interface WebAuthnAuthenticateRequest {
  id?: string | null;
  authenticatorData?: string | null;
  signature?: string | null;
  clientDataJson?: string | null;
}

export interface WebAuthnRegisterRequest {
  id?: string | null;
  publicKeyBase64?: string | null;
}

export interface WhatsAppOtpRequest {
  phoneNumber?: string | null;
  checkRegistration?: boolean | null;
}

export interface WhatsAppWebhookPayload {
  from?: string | null;
  type?: string | null;
  interactive?: InteractivePayload;
  text?: TextPayload;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Clinic.API
 * @version 1.0
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminSubscriptionSettingsList
     * @request GET:/api/admin/subscription-settings
     */
    adminSubscriptionSettingsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/subscription-settings`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminSubscriptionSettingsUpdate
     * @request PUT:/api/admin/subscription-settings
     */
    adminSubscriptionSettingsUpdate: (
      data: SubscriptionSetting,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/subscription-settings`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminPromosList
     * @request GET:/api/admin/promos
     */
    adminPromosList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/promos`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminPromosCreate
     * @request POST:/api/admin/promos
     */
    adminPromosCreate: (data: PromoCode, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/promos`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminPromosDelete
     * @request DELETE:/api/admin/promos/{id}
     */
    adminPromosDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/promos/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminAccountsSoftDeleteCreate
     * @request POST:/api/admin/accounts/{email}/soft-delete
     */
    adminAccountsSoftDeleteCreate: (
      email: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/accounts/${email}/soft-delete`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminDoctorsList
     * @request GET:/api/admin/doctors
     */
    adminDoctorsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/doctors`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminDoctorsActivateCreate
     * @request POST:/api/admin/doctors/{doctorId}/activate
     */
    adminDoctorsActivateCreate: (
      doctorId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/doctors/${doctorId}/activate`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminDoctorsDeactivateCreate
     * @request POST:/api/admin/doctors/{doctorId}/deactivate
     */
    adminDoctorsDeactivateCreate: (
      doctorId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/doctors/${doctorId}/deactivate`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminReceiptsApproveCreate
     * @request POST:/api/admin/receipts/{receiptId}/approve
     */
    adminReceiptsApproveCreate: (
      receiptId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/receipts/${receiptId}/approve`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminReceiptsRejectCreate
     * @request POST:/api/admin/receipts/{receiptId}/reject
     */
    adminReceiptsRejectCreate: (
      receiptId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/receipts/${receiptId}/reject`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AdminSettings
     * @name AdminAccountsDelete
     * @request DELETE:/api/admin/accounts/{email}
     */
    adminAccountsDelete: (email: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/accounts/${email}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AiNoShow
     * @name AiNoShowPredictCreate
     * @request POST:/api/ai-no-show/predict/{appointmentId}
     */
    aiNoShowPredictCreate: (
      appointmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ai-no-show/predict/${appointmentId}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AiNoShow
     * @name AiNoShowStandbyCreate
     * @request POST:/api/ai-no-show/standby/{clinicId}
     */
    aiNoShowStandbyCreate: (
      clinicId: string,
      data: JoinStandbyRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ai-no-show/standby/${clinicId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AiNoShow
     * @name AiNoShowTriggerStandbyCreate
     * @request POST:/api/ai-no-show/trigger-standby/{appointmentId}
     */
    aiNoShowTriggerStandbyCreate: (
      appointmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ai-no-show/trigger-standby/${appointmentId}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsList
     * @request GET:/api/appointments
     */
    appointmentsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsCreate
     * @request POST:/api/appointments
     */
    appointmentsCreate: (data: AppointmentDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsUpdate
     * @request PUT:/api/appointments/{id}
     */
    appointmentsUpdate: (
      id: string,
      data: AppointmentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/appointments/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsDelete
     * @request DELETE:/api/appointments/{id}
     */
    appointmentsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsCheckInCreate
     * @summary REQ-APT-02 / UAT-APT-02: Patient check-in by receptionist. Advances status to "waiting", stamps ArrivedAt, calculates sequential daily QueueNumber, and triggers real-time notification to the doctor.
     * @request POST:/api/appointments/{id}/check-in
     */
    appointmentsCheckInCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments/${id}/check-in`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsStartConsultationCreate
     * @summary REQ-APT-02 & REQ-CLI-03: Doctor calls patient into exam room. Advances status to "in_consultation", stamps ConsultationStartedAt, and optionally assigns room/chair.
     * @request POST:/api/appointments/{id}/start-consultation
     */
    appointmentsStartConsultationCreate: (
      id: string,
      query?: {
        roomNumber?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/appointments/${id}/start-consultation`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsCompleteCreate
     * @summary REQ-APT-02: Doctor completes consultation. Advances status to "completed" and stamps ConsultationEndedAt.
     * @request POST:/api/appointments/{id}/complete
     */
    appointmentsCompleteCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments/${id}/complete`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsLiveQueueList
     * @summary REQ-APT-02: Retrieves live waiting room queue for today. Orders active patients: in_consultation first, then waiting by QueueNumber, then scheduled.
     * @request GET:/api/appointments/live-queue
     */
    appointmentsLiveQueueList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/appointments/live-queue`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsSendReminderCreate
     * @summary REQ-NOTIF-02: Sends manual or automated WhatsApp/SMS reminder for an appointment. Updates LastReminderSentAt and increments ReminderCount.
     * @request POST:/api/appointments/{id}/send-reminder
     */
    appointmentsSendReminderCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/appointments/${id}/send-reminder`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Appointments
     * @name AppointmentsSendBatchRemindersCreate
     * @summary REQ-NOTIF-02: Batch-sends reminders to all patients with upcoming appointments in the next 24 hours.
     * @request POST:/api/appointments/send-batch-reminders
     */
    appointmentsSendBatchRemindersCreate: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/appointments/send-batch-reminders`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthLoginCreate
     * @request POST:/api/auth/login
     */
    authLoginCreate: (data: LoginRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthSendOtpCreate
     * @request POST:/api/auth/send-otp
     */
    authSendOtpCreate: (data: OtpRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/send-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthRequestOtpCreate
     * @request POST:/api/auth/request-otp
     */
    authRequestOtpCreate: (
      data: WhatsAppOtpRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/request-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthVerifyOtpCreate
     * @request POST:/api/auth/verify-otp
     */
    authVerifyOtpCreate: (data: VerifyOtpRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/verify-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthSocialCreate
     * @request POST:/api/auth/social
     */
    authSocialCreate: (data: SocialLoginRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/social`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthCheckAvailabilityCreate
     * @request POST:/api/auth/check-availability
     */
    authCheckAvailabilityCreate: (
      data: CheckAvailabilityRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/check-availability`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthRegisterSendOtpCreate
     * @request POST:/api/auth/register-send-otp
     */
    authRegisterSendOtpCreate: (data: OtpRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/register-send-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthRegisterCreate
     * @request POST:/api/auth/register
     */
    authRegisterCreate: (data: RegisterRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthUsersList
     * @request GET:/api/auth/users
     */
    authUsersList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/users`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthProfileList
     * @request GET:/api/auth/profile
     */
    authProfileList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/profile`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthProfileUpdate
     * @request PUT:/api/auth/profile
     */
    authProfileUpdate: (data: UserProfileDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/profile`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthProfileSendOtpCreate
     * @request POST:/api/auth/profile-send-otp
     */
    authProfileSendOtpCreate: (
      data: ProfileOtpRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/profile-send-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthForgotPasswordCreate
     * @request POST:/api/auth/forgot-password
     */
    authForgotPasswordCreate: (
      data: ForgotPasswordRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/forgot-password`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthResetPasswordCreate
     * @request POST:/api/auth/reset-password
     */
    authResetPasswordCreate: (
      data: ResetPasswordRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/reset-password`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingList
     * @request GET:/api/billing
     */
    billingList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/billing`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingCreate
     * @request POST:/api/billing
     */
    billingCreate: (data: BillingRecordDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/billing`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingUpdate
     * @request PUT:/api/billing/{id}
     */
    billingUpdate: (
      id: string,
      data: BillingRecordDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/billing/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingDelete
     * @request DELETE:/api/billing/{id}
     */
    billingDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/billing/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingPaymentsCreate
     * @summary REQ-BIL-02: Records a split payment or additional installment for an existing invoice. Recalculates PaidAmount and updates Status ('paid' if fully paid, 'partially_paid' if partial).
     * @request POST:/api/billing/{id}/payments
     */
    billingPaymentsCreate: (
      id: string,
      data: AddPaymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/billing/${id}/payments`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Billing
     * @name BillingVoidUpdate
     * @request PUT:/api/billing/{id}/void
     */
    billingVoidUpdate: (
      id: string,
      data: VoidInvoiceRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/billing/${id}/void`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cds
     * @name CdsEvaluateCreate
     * @request POST:/api/cds/evaluate
     */
    cdsEvaluateCreate: (
      data: CdsEvaluationRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/cds/evaluate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cds
     * @name CdsRulesList
     * @request GET:/api/cds/rules
     */
    cdsRulesList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/cds/rules`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cds
     * @name CdsPediatricDoseList
     * @request GET:/api/cds/pediatric-dose
     */
    cdsPediatricDoseList: (
      query?: {
        drugName?: string;
        /** @format double */
        weightKg?: number;
        /**
         * @format int32
         * @default 8
         */
        ageYears?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/cds/pediatric-dose`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chairs
     * @name ChairsList
     * @request GET:/api/Chairs
     */
    chairsList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Chairs`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chairs
     * @name ChairsStatusUpdate
     * @request PUT:/api/Chairs/{id}/status
     */
    chairsStatusUpdate: (
      id: string,
      data: UpdateChairStatusDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Chairs/${id}/status`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chairs
     * @name ChairsAssignCreate
     * @request POST:/api/Chairs/{id}/assign
     */
    chairsAssignCreate: (
      id: string,
      data: AssignChairDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Chairs/${id}/assign`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chairs
     * @name ChairsReleaseCreate
     * @request POST:/api/Chairs/{id}/release
     */
    chairsReleaseCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Chairs/${id}/release`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chairs
     * @name ChairsCompleteCleaningCreate
     * @request POST:/api/Chairs/{id}/complete-cleaning
     */
    chairsCompleteCleaningCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Chairs/${id}/complete-cleaning`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinic.API
     * @name HealthList
     * @request GET:/api/health
     */
    healthList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/health`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinic.API
     * @name HealthLivenessList
     * @request GET:/api/health/liveness
     */
    healthLivenessList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/health/liveness`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinic.API
     * @name HealthReadinessList
     * @request GET:/api/health/readiness
     */
    healthReadinessList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/health/readiness`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinic.API
     * @name DebugErrorList
     * @request GET:/api/debug-error
     */
    debugErrorList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/debug-error`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ClinicalNotes
     * @name ClinicalNotesList
     * @request GET:/api/clinical-notes
     */
    clinicalNotesList: (
      query?: {
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinical-notes`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ClinicalNotes
     * @name ClinicalNotesCreate
     * @request POST:/api/clinical-notes
     */
    clinicalNotesCreate: (
      data: CreateClinicalNoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinical-notes`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ClinicalNotes
     * @name ClinicalNotesDetail
     * @request GET:/api/clinical-notes/{id}
     */
    clinicalNotesDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinical-notes/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags ClinicalNotes
     * @name ClinicalNotesUpdate
     * @summary BR-RX-03 / BR-MED-01: Medical Record Immutability (Amendment Trail) PUT does NOT overwrite original notes. It appends a permanent, timestamped amendment.
     * @request PUT:/api/clinical-notes/{id}
     */
    clinicalNotesUpdate: (
      id: string,
      data: AmendClinicalNoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinical-notes/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ClinicalNotes
     * @name ClinicalNotesDelete
     * @summary BR-RX-03 / BR-MED-01: Clinical encounter notes cannot be deleted from the database.
     * @request DELETE:/api/clinical-notes/{id}
     */
    clinicalNotesDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinical-notes/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsList
     * @request GET:/api/clinics
     */
    clinicsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinics`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsCreate
     * @request POST:/api/clinics
     */
    clinicsCreate: (data: ClinicDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinics`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsAssignDoctorsCreate
     * @request POST:/api/clinics/{id}/assign-doctors
     */
    clinicsAssignDoctorsCreate: (
      id: string,
      data: string[],
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinics/${id}/assign-doctors`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsAssignDoctorsByEmailsCreate
     * @request POST:/api/clinics/{id}/assign-doctors-by-emails
     */
    clinicsAssignDoctorsByEmailsCreate: (
      id: string,
      data: string[],
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinics/${id}/assign-doctors-by-emails`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsAssignAssistantCreate
     * @request POST:/api/clinics/{id}/assign-assistant
     */
    clinicsAssignAssistantCreate: (
      id: string,
      data: AssignAssistantRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinics/${id}/assign-assistant`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsRespondAssignmentCreate
     * @request POST:/api/clinics/{id}/respond-assignment
     */
    clinicsRespondAssignmentCreate: (
      id: string,
      data: RespondAssignmentRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/clinics/${id}/respond-assignment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsUpdate
     * @request PUT:/api/clinics/{id}
     */
    clinicsUpdate: (id: string, data: ClinicDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinics/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsDelete
     * @request DELETE:/api/clinics/{id}
     */
    clinicsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinics/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Clinics
     * @name ClinicsQrCodeKitList
     * @request GET:/api/clinics/{id}/qr-code-kit
     */
    clinicsQrCodeKitList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/clinics/${id}/qr-code-kit`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionAnalyticsList
     * @summary REQ-COMM-01: Real-time Doctor Commission & Profit-Sharing Analytics
     * @request GET:/api/Commission/analytics
     */
    commissionAnalyticsList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
        /** @format date-time */
        startDate?: string;
        /** @format date-time */
        endDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/analytics`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionPlansDoctorDetail
     * @summary REQ-COMM-02: Get Doctor Commission Plan
     * @request GET:/api/Commission/plans/doctor/{doctorId}
     */
    commissionPlansDoctorDetail: (
      doctorId: string,
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/plans/doctor/${doctorId}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionPlansCreate
     * @summary REQ-COMM-02: Upsert Doctor Commission Plan
     * @request POST:/api/Commission/plans
     */
    commissionPlansCreate: (
      data: CreateOrUpdateCommissionPlanDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/plans`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionPayoutsList
     * @summary REQ-COMM-03: Get Payout History Ledger
     * @request GET:/api/Commission/payouts
     */
    commissionPayoutsList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/payouts`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionPayoutsCreate
     * @summary REQ-COMM-03: Generate Payout Record
     * @request POST:/api/Commission/payouts
     */
    commissionPayoutsCreate: (
      data: CreateCommissionPayoutDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/payouts`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Commission
     * @name CommissionPayoutsSettleUpdate
     * @summary REQ-COMM-03: Settle Commission Payout
     * @request PUT:/api/Commission/payouts/{id}/settle
     */
    commissionPayoutsSettleUpdate: (
      id: string,
      data: SettleCommissionPayoutDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Commission/payouts/${id}/settle`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalList
     * @request GET:/api/dental
     */
    dentalList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/dental`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalCreate
     * @request POST:/api/dental
     */
    dentalCreate: (data: DentalLogDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/dental`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalDetail
     * @request GET:/api/dental/{id}
     */
    dentalDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/dental/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalUpdate
     * @request PUT:/api/dental/{id}
     */
    dentalUpdate: (
      id: string,
      data: DentalLogDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/dental/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalDelete
     * @request DELETE:/api/dental/{id}
     */
    dentalDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/dental/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalStageUpdate
     * @request PUT:/api/dental/{id}/stage
     */
    dentalStageUpdate: (
      id: string,
      data: UpdateDentalStageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/dental/${id}/stage`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dental
     * @name DentalPushToBillingCreate
     * @request POST:/api/dental/{id}/push-to-billing
     */
    dentalPushToBillingCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/dental/${id}/push-to-billing`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DiagnosticPartner
     * @name PublicDiagnosticsOrdersCreate
     * @request POST:/api/public/diagnostics/orders
     */
    publicDiagnosticsOrdersCreate: (
      data: CreateDiagnosticRequisitionDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/diagnostics/orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DiagnosticPartner
     * @name PublicDiagnosticsOrdersClinicDetail
     * @request GET:/api/public/diagnostics/orders/clinic/{clinicId}
     */
    publicDiagnosticsOrdersClinicDetail: (
      clinicId: string,
      query?: {
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/diagnostics/orders/clinic/${clinicId}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DiagnosticPartner
     * @name PublicDiagnosticsOrdersDetail
     * @request GET:/api/public/diagnostics/orders/{token}
     */
    publicDiagnosticsOrdersDetail: (
      token: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/diagnostics/orders/${token}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags DiagnosticPartner
     * @name PublicDiagnosticsOrdersUploadCreate
     * @request POST:/api/public/diagnostics/orders/{token}/upload
     */
    publicDiagnosticsOrdersUploadCreate: (
      token: string,
      data: {
        files?: File[];
        partnerNotes?: string;
        technicianName?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/diagnostics/orders/${token}/upload`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Doctors
     * @name DoctorsList
     * @request GET:/api/doctors
     */
    doctorsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/doctors`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Doctors
     * @name DoctorsCreate
     * @request POST:/api/doctors
     */
    doctorsCreate: (data: DoctorDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/doctors`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentList
     * @request GET:/api/Equipment
     */
    equipmentList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Equipment`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentCreate
     * @request POST:/api/Equipment
     */
    equipmentCreate: (data: EquipmentDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Equipment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentDetail
     * @request GET:/api/Equipment/{id}
     */
    equipmentDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Equipment/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentUpdate
     * @request PUT:/api/Equipment/{id}
     */
    equipmentUpdate: (
      id: string,
      data: EquipmentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Equipment/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentDelete
     * @request DELETE:/api/Equipment/{id}
     */
    equipmentDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Equipment/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentMaintenanceCreate
     * @request POST:/api/Equipment/{id}/maintenance
     */
    equipmentMaintenanceCreate: (
      id: string,
      data: EquipmentMaintenanceLogRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Equipment/${id}/maintenance`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Equipment
     * @name EquipmentSeedDefaultsCreate
     * @request POST:/api/Equipment/seed-defaults
     */
    equipmentSeedDefaultsCreate: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Equipment/seed-defaults`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ExecutiveAnalytics
     * @name ExecutiveAnalyticsSummaryList
     * @request GET:/api/executive/analytics/summary
     */
    executiveAnalyticsSummaryList: (
      query?: {
        /** @default false */
        refresh?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/executive/analytics/summary`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ExecutiveAnalytics
     * @name ExecutiveAnalyticsBranchesList
     * @request GET:/api/executive/analytics/branches
     */
    executiveAnalyticsBranchesList: (
      query?: {
        /** @default false */
        refresh?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/executive/analytics/branches`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ExecutiveAnalytics
     * @name ExecutiveAnalyticsDoctorsList
     * @request GET:/api/executive/analytics/doctors
     */
    executiveAnalyticsDoctorsList: (
      query?: {
        /** @default false */
        refresh?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/executive/analytics/doctors`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ExecutiveAnalytics
     * @name ExecutiveAnalyticsSupplyVelocityList
     * @request GET:/api/executive/analytics/supply-velocity
     */
    executiveAnalyticsSupplyVelocityList: (
      query?: {
        /** @default false */
        refresh?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/executive/analytics/supply-velocity`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ExecutiveAnalytics
     * @name ExecutiveAnalyticsRefreshCacheCreate
     * @request POST:/api/executive/analytics/refresh-cache
     */
    executiveAnalyticsRefreshCacheCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/executive/analytics/refresh-cache`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsTemplatesList
     * @request GET:/api/consents/templates
     */
    consentsTemplatesList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/consents/templates`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsCreate
     * @request POST:/api/consents
     */
    consentsCreate: (
      data: CreateInformedConsentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/consents`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsList
     * @request GET:/api/consents
     */
    consentsList: (
      query?: {
        clinicId?: string;
        patientId?: string;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/consents`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsDetail
     * @request GET:/api/consents/{id}
     */
    consentsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/consents/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsSignPatientUpdate
     * @request PUT:/api/consents/{id}/sign-patient
     */
    consentsSignPatientUpdate: (
      id: string,
      data: SignPatientConsentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/consents/${id}/sign-patient`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InformedConsents
     * @name ConsentsCountersignUpdate
     * @request PUT:/api/consents/{id}/countersign
     */
    consentsCountersignUpdate: (
      id: string,
      data: DoctorCountersignDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/consents/${id}/countersign`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceProvidersList
     * @request GET:/api/insurance/providers
     */
    insuranceProvidersList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/insurance/providers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceProvidersCreate
     * @request POST:/api/insurance/providers
     */
    insuranceProvidersCreate: (
      data: CreateInsuranceProviderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/providers`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsCreate
     * @request POST:/api/insurance/claims
     */
    insuranceClaimsCreate: (
      data: CreateInsuranceClaimDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsList
     * @request GET:/api/insurance/claims
     */
    insuranceClaimsList: (
      query?: {
        clinicId?: string;
        status?: string;
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsSummaryList
     * @request GET:/api/insurance/claims/summary
     */
    insuranceClaimsSummaryList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims/summary`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsDetail
     * @request GET:/api/insurance/claims/{id}
     */
    insuranceClaimsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsSubmitUpdate
     * @request PUT:/api/insurance/claims/{id}/submit
     */
    insuranceClaimsSubmitUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}/submit`,
        method: "PUT",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsAdjudicateUpdate
     * @request PUT:/api/insurance/claims/{id}/adjudicate
     */
    insuranceClaimsAdjudicateUpdate: (
      id: string,
      data: AdjudicateClaimDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}/adjudicate`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsSettleUpdate
     * @request PUT:/api/insurance/claims/{id}/settle
     */
    insuranceClaimsSettleUpdate: (
      id: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}/settle`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsGenerateFromAiCreate
     * @request POST:/api/insurance/claims/generate-from-ai
     */
    insuranceClaimsGenerateFromAiCreate: (
      data: GenerateAiClaimDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims/generate-from-ai`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsRealtimeEligibilityCreate
     * @request POST:/api/insurance/claims/{id}/realtime-eligibility
     */
    insuranceClaimsRealtimeEligibilityCreate: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}/realtime-eligibility`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags InsuranceClaims
     * @name InsuranceClaimsPacketList
     * @request GET:/api/insurance/claims/{id}/packet
     */
    insuranceClaimsPacketList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/insurance/claims/${id}/packet`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersList
     * @request GET:/api/lab-orders
     */
    labOrdersList: (
      query?: {
        status?: string;
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCreate
     * @request POST:/api/lab-orders
     */
    labOrdersCreate: (
      data: LabWorkOrderCreateLabWorkOrderRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersTokenDetail
     * @request GET:/api/lab-orders/token/{token}
     */
    labOrdersTokenDetail: (token: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/token/${token}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersStatusPartialUpdate
     * @request PATCH:/api/lab-orders/{token}/status
     */
    labOrdersStatusPartialUpdate: (
      token: string,
      data: LabWorkOrderUpdateLabStatusRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${token}/status`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCheckFittingDetail
     * @request GET:/api/lab-orders/check-fitting/{patientId}/{toothNumber}
     */
    labOrdersCheckFittingDetail: (
      patientId: string,
      toothNumber: number,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/check-fitting/${patientId}/${toothNumber}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrders3DModelList
     * @request GET:/api/lab-orders/{id}/3d-model
     */
    labOrders3DModelList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/3d-model`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrders3DModelCreate
     * @request POST:/api/lab-orders/{id}/3d-model
     */
    labOrders3DModelCreate: (
      id: string,
      data: LabWorkOrderUpload3DModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/3d-model`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name Labworkorders3DModelList
     * @request GET:/api/labworkorders/{id}/3d-model
     */
    labworkorders3DModelList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/3d-model`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name Labworkorders3DModelCreate
     * @request POST:/api/labworkorders/{id}/3d-model
     */
    labworkorders3DModelCreate: (
      id: string,
      data: LabWorkOrderUpload3DModelRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/3d-model`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersToken3DModelList
     * @request GET:/api/lab-orders/token/{token}/3d-model
     */
    labOrdersToken3DModelList: (token: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/token/${token}/3d-model`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersMeasurementsList
     * @request GET:/api/lab-orders/{id}/measurements
     */
    labOrdersMeasurementsList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/measurements`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersMeasurementsCreate
     * @request POST:/api/lab-orders/{id}/measurements
     */
    labOrdersMeasurementsCreate: (
      id: string,
      data: LabWorkOrderSaveModelMeasurementRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/measurements`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersMeasurementsList
     * @request GET:/api/labworkorders/{id}/measurements
     */
    labworkordersMeasurementsList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/measurements`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersMeasurementsCreate
     * @request POST:/api/labworkorders/{id}/measurements
     */
    labworkordersMeasurementsCreate: (
      id: string,
      data: LabWorkOrderSaveModelMeasurementRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/measurements`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersClearanceHeatmapList
     * @request GET:/api/lab-orders/{id}/clearance-heatmap
     */
    labOrdersClearanceHeatmapList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/clearance-heatmap`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersClearanceHeatmapCreate
     * @request POST:/api/lab-orders/{id}/clearance-heatmap
     */
    labOrdersClearanceHeatmapCreate: (
      id: string,
      data: LabWorkOrderSaveClearanceHeatmapRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/clearance-heatmap`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersClearanceHeatmapList
     * @request GET:/api/labworkorders/{id}/clearance-heatmap
     */
    labworkordersClearanceHeatmapList: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/clearance-heatmap`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersClearanceHeatmapCreate
     * @request POST:/api/labworkorders/{id}/clearance-heatmap
     */
    labworkordersClearanceHeatmapCreate: (
      id: string,
      data: LabWorkOrderSaveClearanceHeatmapRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/clearance-heatmap`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersArticulatorList
     * @request GET:/api/lab-orders/{id}/articulator
     */
    labOrdersArticulatorList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/articulator`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersArticulatorCreate
     * @request POST:/api/lab-orders/{id}/articulator
     */
    labOrdersArticulatorCreate: (
      id: string,
      data: LabWorkOrderSaveArticulatorSettingsRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/articulator`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersArticulatorList
     * @request GET:/api/labworkorders/{id}/articulator
     */
    labworkordersArticulatorList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/articulator`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersArticulatorCreate
     * @request POST:/api/labworkorders/{id}/articulator
     */
    labworkordersArticulatorCreate: (
      id: string,
      data: LabWorkOrderSaveArticulatorSettingsRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/articulator`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersMarginLineList
     * @request GET:/api/lab-orders/{id}/margin-line
     */
    labOrdersMarginLineList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/margin-line`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersMarginLineCreate
     * @request POST:/api/lab-orders/{id}/margin-line
     */
    labOrdersMarginLineCreate: (
      id: string,
      data: LabWorkOrderSaveMarginLineRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/margin-line`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersMarginLineList
     * @request GET:/api/labworkorders/{id}/margin-line
     */
    labworkordersMarginLineList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/margin-line`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersMarginLineCreate
     * @request POST:/api/labworkorders/{id}/margin-line
     */
    labworkordersMarginLineCreate: (
      id: string,
      data: LabWorkOrderSaveMarginLineRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/margin-line`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCamToolpathList
     * @request GET:/api/lab-orders/{id}/cam/toolpath
     */
    labOrdersCamToolpathList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/cam/toolpath`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCamToolpathList
     * @request GET:/api/labworkorders/{id}/cam/toolpath
     */
    labworkordersCamToolpathList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/cam/toolpath`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCamGcodeCreate
     * @request POST:/api/lab-orders/{id}/cam/gcode
     */
    labOrdersCamGcodeCreate: (
      id: string,
      data: LabWorkOrderGenerateCamGCodeRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/cam/gcode`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCamGcodeCreate
     * @request POST:/api/labworkorders/{id}/cam/gcode
     */
    labworkordersCamGcodeCreate: (
      id: string,
      data: LabWorkOrderGenerateCamGCodeRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/cam/gcode`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersSurgicalGuideList
     * @request GET:/api/lab-orders/{id}/surgical-guide
     */
    labOrdersSurgicalGuideList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/surgical-guide`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersSurgicalGuideCreate
     * @request POST:/api/lab-orders/{id}/surgical-guide
     */
    labOrdersSurgicalGuideCreate: (
      id: string,
      data: LabWorkOrderSaveImplantSurgicalGuideRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/surgical-guide`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersSurgicalGuideList
     * @request GET:/api/labworkorders/{id}/surgical-guide
     */
    labworkordersSurgicalGuideList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/surgical-guide`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersSurgicalGuideCreate
     * @request POST:/api/labworkorders/{id}/surgical-guide
     */
    labworkordersSurgicalGuideCreate: (
      id: string,
      data: LabWorkOrderSaveImplantSurgicalGuideRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/surgical-guide`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCrownList
     * @request GET:/api/lab-orders/{id}/crown
     */
    labOrdersCrownList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/crown`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCrownCreate
     * @request POST:/api/lab-orders/{id}/crown
     */
    labOrdersCrownCreate: (
      id: string,
      data: LabWorkOrderSaveCrownMorphologyRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/crown`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCrownList
     * @request GET:/api/labworkorders/{id}/crown
     */
    labworkordersCrownList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/crown`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCrownCreate
     * @request POST:/api/labworkorders/{id}/crown
     */
    labworkordersCrownCreate: (
      id: string,
      data: LabWorkOrderSaveCrownMorphologyRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/crown`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersFusionList
     * @request GET:/api/lab-orders/{id}/fusion
     */
    labOrdersFusionList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/fusion`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersFusionCreate
     * @request POST:/api/lab-orders/{id}/fusion
     */
    labOrdersFusionCreate: (
      id: string,
      data: LabWorkOrderSaveDualModalityFusionRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/fusion`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersFusionList
     * @request GET:/api/labworkorders/{id}/fusion
     */
    labworkordersFusionList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/fusion`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersFusionCreate
     * @request POST:/api/labworkorders/{id}/fusion
     */
    labworkordersFusionCreate: (
      id: string,
      data: LabWorkOrderSaveDualModalityFusionRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/fusion`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersAlignerList
     * @request GET:/api/lab-orders/{id}/aligner
     */
    labOrdersAlignerList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/aligner`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersAlignerCreate
     * @request POST:/api/lab-orders/{id}/aligner
     */
    labOrdersAlignerCreate: (
      id: string,
      data: LabWorkOrderSaveAlignerPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/aligner`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersAlignerList
     * @request GET:/api/labworkorders/{id}/aligner
     */
    labworkordersAlignerList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/aligner`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersAlignerCreate
     * @request POST:/api/labworkorders/{id}/aligner
     */
    labworkordersAlignerCreate: (
      id: string,
      data: LabWorkOrderSaveAlignerPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/aligner`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersGbrMeshList
     * @request GET:/api/lab-orders/{id}/gbr-mesh
     */
    labOrdersGbrMeshList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/gbr-mesh`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersGbrMeshCreate
     * @request POST:/api/lab-orders/{id}/gbr-mesh
     */
    labOrdersGbrMeshCreate: (
      id: string,
      data: LabWorkOrderSaveGbrMeshPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/gbr-mesh`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersGbrMeshList
     * @request GET:/api/labworkorders/{id}/gbr-mesh
     */
    labworkordersGbrMeshList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/gbr-mesh`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersGbrMeshCreate
     * @request POST:/api/labworkorders/{id}/gbr-mesh
     */
    labworkordersGbrMeshCreate: (
      id: string,
      data: LabWorkOrderSaveGbrMeshPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/gbr-mesh`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersRpdList
     * @request GET:/api/lab-orders/{id}/rpd
     */
    labOrdersRpdList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/rpd`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersRpdCreate
     * @request POST:/api/lab-orders/{id}/rpd
     */
    labOrdersRpdCreate: (
      id: string,
      data: LabWorkOrderSaveRpdPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/rpd`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersRpdList
     * @request GET:/api/labworkorders/{id}/rpd
     */
    labworkordersRpdList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/rpd`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersRpdCreate
     * @request POST:/api/labworkorders/{id}/rpd
     */
    labworkordersRpdCreate: (
      id: string,
      data: LabWorkOrderSaveRpdPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/rpd`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersDsdList
     * @request GET:/api/lab-orders/{id}/dsd
     */
    labOrdersDsdList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/dsd`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersDsdCreate
     * @request POST:/api/lab-orders/{id}/dsd
     */
    labOrdersDsdCreate: (
      id: string,
      data: LabWorkOrderSaveDsdSmilePlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/dsd`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersDsdList
     * @request GET:/api/labworkorders/{id}/dsd
     */
    labworkordersDsdList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/dsd`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersDsdCreate
     * @request POST:/api/labworkorders/{id}/dsd
     */
    labworkordersDsdCreate: (
      id: string,
      data: LabWorkOrderSaveDsdSmilePlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/dsd`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersDirectScanList
     * @request GET:/api/lab-orders/{id}/direct-scan
     */
    labOrdersDirectScanList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/direct-scan`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersDirectScanCreate
     * @request POST:/api/lab-orders/{id}/direct-scan
     */
    labOrdersDirectScanCreate: (
      id: string,
      data: LabWorkOrderSaveDirectScanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/direct-scan`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersDirectScanList
     * @request GET:/api/labworkorders/{id}/direct-scan
     */
    labworkordersDirectScanList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/direct-scan`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersDirectScanCreate
     * @request POST:/api/labworkorders/{id}/direct-scan
     */
    labworkordersDirectScanCreate: (
      id: string,
      data: LabWorkOrderSaveDirectScanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/direct-scan`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersImplantPlatformsList
     * @request GET:/api/lab-orders/implant-platforms
     */
    labOrdersImplantPlatformsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/implant-platforms`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersImplantPlatformsList
     * @request GET:/api/labworkorders/implant-platforms
     */
    labworkordersImplantPlatformsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/implant-platforms`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCustomAbutmentList
     * @request GET:/api/lab-orders/{id}/custom-abutment
     */
    labOrdersCustomAbutmentList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/custom-abutment`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCustomAbutmentCreate
     * @request POST:/api/lab-orders/{id}/custom-abutment
     */
    labOrdersCustomAbutmentCreate: (
      id: string,
      data: LabWorkOrderSaveCustomAbutmentPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/custom-abutment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCustomAbutmentList
     * @request GET:/api/labworkorders/{id}/custom-abutment
     */
    labworkordersCustomAbutmentList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/custom-abutment`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCustomAbutmentCreate
     * @request POST:/api/labworkorders/{id}/custom-abutment
     */
    labworkordersCustomAbutmentCreate: (
      id: string,
      data: LabWorkOrderSaveCustomAbutmentPlanRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/custom-abutment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersCustomAbutmentExportCncCreate
     * @request POST:/api/lab-orders/{id}/custom-abutment/export-cnc
     */
    labOrdersCustomAbutmentExportCncCreate: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/custom-abutment/export-cnc`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersCustomAbutmentExportCncCreate
     * @request POST:/api/labworkorders/{id}/custom-abutment/export-cnc
     */
    labworkordersCustomAbutmentExportCncCreate: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/custom-abutment/export-cnc`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersSurgicalNavigationList
     * @request GET:/api/lab-orders/{id}/surgical-navigation
     */
    labOrdersSurgicalNavigationList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/surgical-navigation`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersSurgicalNavigationCreate
     * @request POST:/api/lab-orders/{id}/surgical-navigation
     */
    labOrdersSurgicalNavigationCreate: (
      id: string,
      data: SaveSurgicalNavigationRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/surgical-navigation`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersSurgicalNavigationList
     * @request GET:/api/labworkorders/{id}/surgical-navigation
     */
    labworkordersSurgicalNavigationList: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/surgical-navigation`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersSurgicalNavigationCreate
     * @request POST:/api/labworkorders/{id}/surgical-navigation
     */
    labworkordersSurgicalNavigationCreate: (
      id: string,
      data: SaveSurgicalNavigationRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/surgical-navigation`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabOrdersSurgicalNavigationEvaluateTelemetryCreate
     * @request POST:/api/lab-orders/{id}/surgical-navigation/evaluate-telemetry
     */
    labOrdersSurgicalNavigationEvaluateTelemetryCreate: (
      id: string,
      data: EvaluateDrillTelemetryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/lab-orders/${id}/surgical-navigation/evaluate-telemetry`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags LabWorkOrder
     * @name LabworkordersSurgicalNavigationEvaluateTelemetryCreate
     * @request POST:/api/labworkorders/{id}/surgical-navigation/evaluate-telemetry
     */
    labworkordersSurgicalNavigationEvaluateTelemetryCreate: (
      id: string,
      data: EvaluateDrillTelemetryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/labworkorders/${id}/surgical-navigation/evaluate-telemetry`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsLowStockList
     * @request GET:/api/materials/low-stock
     */
    materialsLowStockList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/low-stock`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsExpiredList
     * @request GET:/api/materials/expired
     */
    materialsExpiredList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/expired`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsList
     * @request GET:/api/materials
     */
    materialsList: (
      query?: {
        clinicId?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsCreate
     * @request POST:/api/materials
     */
    materialsCreate: (data: MaterialDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/materials`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsDoctorDetail
     * @request GET:/api/materials/doctor/{doctorId}
     */
    materialsDoctorDetail: (
      doctorId: string,
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/doctor/${doctorId}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsUpdate
     * @request PUT:/api/materials/{id}
     */
    materialsUpdate: (
      id: string,
      data: MaterialDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsDelete
     * @request DELETE:/api/materials/{id}
     */
    materialsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/materials/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsInwardShipmentCreate
     * @summary REQ-INV-02: Records an inward stock shipment / supplier purchase order delivery. Increments inventory quantity, updates batch number, expiry date, supplier name, and unit cost.
     * @request POST:/api/materials/{id}/inward-shipment
     */
    materialsInwardShipmentCreate: (
      id: string,
      data: InwardShipmentRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/${id}/inward-shipment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsSeedDefaultsCreate
     * @request POST:/api/materials/seed-defaults
     */
    materialsSeedDefaultsCreate: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/seed-defaults`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Materials
     * @name MaterialsBulkImportCreate
     * @request POST:/api/materials/bulk-import
     */
    materialsBulkImportCreate: (
      data: MaterialDto[],
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/materials/bulk-import`,
        method: "POST",
        query: query,
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags MobileDevices
     * @name MobileDevicesRegisterCreate
     * @request POST:/api/mobile/devices/register
     */
    mobileDevicesRegisterCreate: (
      data: RegisterMobileDeviceDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/mobile/devices/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags MobileDevices
     * @name MobileDevicesUnregisterDelete
     * @request DELETE:/api/mobile/devices/unregister
     */
    mobileDevicesUnregisterDelete: (
      data: UnregisterMobileDeviceDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/mobile/devices/unregister`,
        method: "DELETE",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags MobileDevices
     * @name MobileDevicesMyDevicesList
     * @request GET:/api/mobile/devices/my-devices
     */
    mobileDevicesMyDevicesList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/mobile/devices/my-devices`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags MobileDevices
     * @name MobileDevicesTestNotificationCreate
     * @request POST:/api/mobile/devices/test-notification
     */
    mobileDevicesTestNotificationCreate: (
      data: SendTestPushNotificationDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/mobile/devices/test-notification`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsList
     * @request GET:/api/Notifications
     */
    notificationsList: (
      query?: {
        /**
         * @format int32
         * @default 20
         */
        count?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Notifications`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsReadPartialUpdate
     * @request PATCH:/api/Notifications/{id}/read
     */
    notificationsReadPartialUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Notifications/${id}/read`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsReadAllPartialUpdate
     * @request PATCH:/api/Notifications/read-all
     */
    notificationsReadAllPartialUpdate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Notifications/read-all`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationsDelete
     * @request DELETE:/api/Notifications/{id}
     */
    notificationsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Notifications/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientFiles
     * @name PatientsFilesList
     * @request GET:/api/patients/{patientId}/files
     */
    patientsFilesList: (patientId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/patients/${patientId}/files`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientFiles
     * @name PatientsFilesCreate
     * @request POST:/api/patients/{patientId}/files
     */
    patientsFilesCreate: (
      patientId: string,
      data: {
        /** @format binary */
        file?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/patients/${patientId}/files`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientFiles
     * @name PatientsFilesDetail
     * @request GET:/api/patients/{patientId}/files/{fileName}
     */
    patientsFilesDetail: (
      patientId: string,
      fileName: string,
      query?: {
        /** @default false */
        inline?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/patients/${patientId}/files/${fileName}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientFiles
     * @name PatientsFilesDelete
     * @request DELETE:/api/patients/{patientId}/files/{fileName}
     */
    patientsFilesDelete: (
      patientId: string,
      fileName: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/patients/${patientId}/files/${fileName}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsCreate
     * @request POST:/api/recalls
     */
    recallsCreate: (data: CreatePatientRecallDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/recalls`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsList
     * @request GET:/api/recalls
     */
    recallsList: (
      query?: {
        clinicId?: string;
        status?: string;
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsSummaryList
     * @request GET:/api/recalls/summary
     */
    recallsSummaryList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls/summary`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsDetail
     * @request GET:/api/recalls/{id}
     */
    recallsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/recalls/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsDispatchCreate
     * @request POST:/api/recalls/{id}/dispatch
     */
    recallsDispatchCreate: (
      id: string,
      data: DispatchRecallDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls/${id}/dispatch`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsBatchDispatchCreate
     * @request POST:/api/recalls/batch-dispatch
     */
    recallsBatchDispatchCreate: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls/batch-dispatch`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsSnoozeUpdate
     * @request PUT:/api/recalls/{id}/snooze
     */
    recallsSnoozeUpdate: (
      id: string,
      data: SnoozeRecallDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls/${id}/snooze`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PatientRecalls
     * @name RecallsCompleteUpdate
     * @request PUT:/api/recalls/{id}/complete
     */
    recallsCompleteUpdate: (
      id: string,
      query?: {
        appointmentId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/recalls/${id}/complete`,
        method: "PUT",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsList
     * @request GET:/api/patients
     */
    patientsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/patients`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsCreate
     * @request POST:/api/patients
     */
    patientsCreate: (data: PatientDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/patients`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsDetail
     * @request GET:/api/patients/{id}
     */
    patientsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/patients/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsUpdate
     * @request PUT:/api/patients/{id}
     */
    patientsUpdate: (
      id: string,
      data: PatientDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/patients/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsDelete
     * @request DELETE:/api/patients/{id}
     */
    patientsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/patients/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Patients
     * @name PatientsConsentSignatureCreate
     * @summary REQ-PAT-03: Records patient digital consent signature (touchscreen or stylus capture).
     * @request POST:/api/patients/{id}/consent-signature
     */
    patientsConsentSignatureCreate: (
      id: string,
      data: ConsentSignatureRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/patients/${id}/consent-signature`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansList
     * @request GET:/api/payment-plans
     */
    paymentPlansList: (
      query?: {
        clinicId?: string;
        status?: string;
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansCreate
     * @request POST:/api/payment-plans
     */
    paymentPlansCreate: (
      data: CreatePaymentPlanDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansDetail
     * @request GET:/api/payment-plans/{id}
     */
    paymentPlansDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/payment-plans/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansPatientDetail
     * @request GET:/api/payment-plans/patient/{patientId}
     */
    paymentPlansPatientDetail: (
      patientId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans/patient/${patientId}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansSummaryList
     * @request GET:/api/payment-plans/summary
     */
    paymentPlansSummaryList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans/summary`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansInstallmentsPayCreate
     * @request POST:/api/payment-plans/{id}/installments/{installmentId}/pay
     */
    paymentPlansInstallmentsPayCreate: (
      id: string,
      installmentId: string,
      data: RecordInstallmentPaymentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans/${id}/installments/${installmentId}/pay`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentPlans
     * @name PaymentPlansInstallmentsRemindCreate
     * @request POST:/api/payment-plans/{id}/installments/{installmentId}/remind
     */
    paymentPlansInstallmentsRemindCreate: (
      id: string,
      installmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/payment-plans/${id}/installments/${installmentId}/remind`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name PeriodontalPatientsLatestList
     * @request GET:/api/Periodontal/patients/{patientId}/latest
     */
    periodontalPatientsLatestList: (
      patientId: string,
      params: RequestParams = {},
    ) =>
      this.request<PeriodontalExamDto, any>({
        path: `/api/Periodontal/patients/${patientId}/latest`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name DentalPeriodontalPatientsLatestList
     * @request GET:/api/dental/periodontal/patients/{patientId}/latest
     */
    dentalPeriodontalPatientsLatestList: (
      patientId: string,
      params: RequestParams = {},
    ) =>
      this.request<PeriodontalExamDto, any>({
        path: `/api/dental/periodontal/patients/${patientId}/latest`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name PeriodontalPatientsCreate
     * @request POST:/api/Periodontal/patients/{patientId}
     */
    periodontalPatientsCreate: (
      patientId: string,
      data: SavePeriodontalExamRequest,
      params: RequestParams = {},
    ) =>
      this.request<PeriodontalExamDto, any>({
        path: `/api/Periodontal/patients/${patientId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name DentalPeriodontalPatientsCreate
     * @request POST:/api/dental/periodontal/patients/{patientId}
     */
    dentalPeriodontalPatientsCreate: (
      patientId: string,
      data: SavePeriodontalExamRequest,
      params: RequestParams = {},
    ) =>
      this.request<PeriodontalExamDto, any>({
        path: `/api/dental/periodontal/patients/${patientId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name PeriodontalCalculateStagingCreate
     * @request POST:/api/Periodontal/calculate-staging
     */
    periodontalCalculateStagingCreate: (
      data: CalculatePerioStagingRequest,
      params: RequestParams = {},
    ) =>
      this.request<PerioStagingAssessmentDto, any>({
        path: `/api/Periodontal/calculate-staging`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Periodontal
     * @name DentalPeriodontalCalculateStagingCreate
     * @request POST:/api/dental/periodontal/calculate-staging
     */
    dentalPeriodontalCalculateStagingCreate: (
      data: CalculatePerioStagingRequest,
      params: RequestParams = {},
    ) =>
      this.request<PerioStagingAssessmentDto, any>({
        path: `/api/dental/periodontal/calculate-staging`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalAuthSendOtpCreate
     * @request POST:/api/portal/auth/send-otp
     */
    portalAuthSendOtpCreate: (
      data: PortalSendOtpRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/auth/send-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalAuthVerifyOtpCreate
     * @request POST:/api/portal/auth/verify-otp
     */
    portalAuthVerifyOtpCreate: (
      data: PortalVerifyOtpRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/auth/verify-otp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalDoctorsAvailableSlotsList
     * @request GET:/api/portal/doctors/available-slots
     */
    portalDoctorsAvailableSlotsList: (
      query?: {
        doctorId?: string;
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/doctors/available-slots`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalAppointmentsBookCreate
     * @request POST:/api/portal/appointments/book
     */
    portalAppointmentsBookCreate: (
      data: PortalBookAppointmentRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/appointments/book`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalQueueStatusList
     * @request GET:/api/portal/queue/status
     */
    portalQueueStatusList: (
      query?: {
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/queue/status`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalPrescriptionsList
     * @request GET:/api/portal/prescriptions
     */
    portalPrescriptionsList: (
      query?: {
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/prescriptions`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalPrescriptionsPrintList
     * @request GET:/api/portal/prescriptions/{id}/print
     */
    portalPrescriptionsPrintList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/portal/prescriptions/${id}/print`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalInvoicesList
     * @request GET:/api/portal/invoices
     */
    portalInvoicesList: (
      query?: {
        patientId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/portal/invoices`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalInvoicesReceiptList
     * @request GET:/api/portal/invoices/{id}/receipt
     */
    portalInvoicesReceiptList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/portal/invoices/${id}/receipt`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalVerifyRxDetail
     * @request GET:/api/portal/verify/rx/{id}
     */
    portalVerifyRxDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/portal/verify/rx/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Portal
     * @name PortalVerifyInvDetail
     * @request GET:/api/portal/verify/inv/{id}
     */
    portalVerifyInvDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/portal/verify/inv/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PostOpTriage
     * @name PostOpTriageList
     * @request GET:/api/PostOpTriage
     */
    postOpTriageList: (
      query?: {
        escalatedOnly?: boolean;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/PostOpTriage`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PostOpTriage
     * @name PostOpTriageDetail
     * @request GET:/api/PostOpTriage/{id}
     */
    postOpTriageDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/PostOpTriage/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PostOpTriage
     * @name PostOpTriageTriggerCreate
     * @request POST:/api/PostOpTriage/trigger
     */
    postOpTriageTriggerCreate: (
      data: PostOpTriageTriggerTriageRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/PostOpTriage/trigger`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PostOpTriage
     * @name PostOpTriageSimulateResponseCreate
     * @request POST:/api/PostOpTriage/{id}/simulate-response
     */
    postOpTriageSimulateResponseCreate: (
      id: string,
      data: PostOpTriageSimulateResponseRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/PostOpTriage/${id}/simulate-response`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PostOpTriage
     * @name PostOpTriageResolveCreate
     * @request POST:/api/PostOpTriage/{id}/resolve
     */
    postOpTriageResolveCreate: (
      id: string,
      data: PostOpTriageResolveTriageRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/PostOpTriage/${id}/resolve`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsList
     * @request GET:/api/prescriptions
     */
    prescriptionsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/prescriptions`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsCreate
     * @request POST:/api/prescriptions
     */
    prescriptionsCreate: (data: PrescriptionDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/prescriptions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsDetail
     * @request GET:/api/prescriptions/{id}
     */
    prescriptionsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/prescriptions/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsUpdate
     * @summary BR-RX-02: Prescription Immutability & Audit Lock Once finalized, editing medications or details is forbidden.
     * @request PUT:/api/prescriptions/{id}
     */
    prescriptionsUpdate: (
      id: string,
      data: PrescriptionDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/prescriptions/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsDelete
     * @summary BR-RX-02: Deletion of finalized or archived prescriptions is strictly forbidden.
     * @request DELETE:/api/prescriptions/{id}
     */
    prescriptionsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/prescriptions/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsFinalizeCreate
     * @summary BR-RX-02: Finalizes and digitally signs a prescription, permanently locking it.
     * @request POST:/api/prescriptions/{id}/finalize
     */
    prescriptionsFinalizeCreate: (
      id: string,
      data: FinalizePrescriptionDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/prescriptions/${id}/finalize`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Prescriptions
     * @name PrescriptionsSupersedeCreate
     * @summary BR-RX-02: Issues a superseding prescription when medication change is needed, archiving the original with a mandatory recorded clinical justification.
     * @request POST:/api/prescriptions/{id}/supersede
     */
    prescriptionsSupersedeCreate: (
      id: string,
      data: SupersedePrescriptionDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/prescriptions/${id}/supersede`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementSuppliersList
     * @request GET:/api/procurement/suppliers
     */
    procurementSuppliersList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/procurement/suppliers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementOrdersList
     * @request GET:/api/procurement/orders
     */
    procurementOrdersList: (
      query?: {
        clinicId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/procurement/orders`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementOrdersCreate
     * @request POST:/api/procurement/orders
     */
    procurementOrdersCreate: (
      data: CreatePurchaseOrderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/procurement/orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementOrdersDetail
     * @request GET:/api/procurement/orders/{id}
     */
    procurementOrdersDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/procurement/orders/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementOrdersDispatchCreate
     * @request POST:/api/procurement/orders/{id}/dispatch
     */
    procurementOrdersDispatchCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/procurement/orders/${id}/dispatch`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Procurement
     * @name ProcurementOrdersReceiveCreate
     * @request POST:/api/procurement/orders/{id}/receive
     */
    procurementOrdersReceiveCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/procurement/orders/${id}/receive`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PublicBooking
     * @name PublicClinicsBookingDataList
     * @request GET:/api/public/clinics/{slug}/booking-data
     */
    publicClinicsBookingDataList: (slug: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/public/clinics/${slug}/booking-data`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PublicBooking
     * @name PublicClinicsDoctorsAvailableSlotsList
     * @request GET:/api/public/clinics/{slug}/doctors/{doctorId}/available-slots
     */
    publicClinicsDoctorsAvailableSlotsList: (
      slug: string,
      doctorId: string,
      query?: {
        date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/clinics/${slug}/doctors/${doctorId}/available-slots`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags PublicBooking
     * @name PublicClinicsBookAppointmentCreate
     * @request POST:/api/public/clinics/{slug}/book-appointment
     */
    publicClinicsBookAppointmentCreate: (
      slug: string,
      data: PublicAppointmentBookingRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/public/clinics/${slug}/book-appointment`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyCentersList
     * @request GET:/api/Radiology/centers
     */
    radiologyCentersList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Radiology/centers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyCentersCreate
     * @request POST:/api/Radiology/centers
     */
    radiologyCentersCreate: (
      data: CreateRadiologyCenterDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/centers`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyCentersUpdate
     * @request PUT:/api/Radiology/centers/{id}
     */
    radiologyCentersUpdate: (
      id: string,
      data: CreateRadiologyCenterDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/centers/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyCentersDelete
     * @request DELETE:/api/Radiology/centers/{id}
     */
    radiologyCentersDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Radiology/centers/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsList
     * @request GET:/api/Radiology/records
     */
    radiologyRecordsList: (
      query?: {
        doctorId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCreate
     * @request POST:/api/Radiology/records
     */
    radiologyRecordsCreate: (
      data: CreateRadiologyRecordDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsUpdate
     * @request PUT:/api/Radiology/records/{id}
     */
    radiologyRecordsUpdate: (
      id: string,
      data: CreateRadiologyRecordDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsDelete
     * @request DELETE:/api/Radiology/records/{id}
     */
    radiologyRecordsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsAiAnalyzeCreate
     * @request POST:/api/Radiology/records/{id}/ai-analyze
     */
    radiologyRecordsAiAnalyzeCreate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ai-analyze`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsAiSyncOdontogramCreate
     * @request POST:/api/Radiology/records/{id}/ai-sync-odontogram
     */
    radiologyRecordsAiSyncOdontogramCreate: (
      id: string,
      data: SyncAiFindingsRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ai-sync-odontogram`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsDicomMetadataList
     * @request GET:/api/Radiology/records/{id}/dicom-metadata
     */
    radiologyRecordsDicomMetadataList: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/dicom-metadata`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsDicomSlicesList
     * @request GET:/api/Radiology/records/{id}/dicom-slices
     */
    radiologyRecordsDicomSlicesList: (
      id: string,
      query?: {
        /** @default "Axial" */
        orientation?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/dicom-slices`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCephAnalysisList
     * @request GET:/api/Radiology/records/{id}/ceph-analysis
     */
    radiologyRecordsCephAnalysisList: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ceph-analysis`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCephReportCreate
     * @request POST:/api/Radiology/records/{id}/ceph-report
     */
    radiologyRecordsCephReportCreate: (
      id: string,
      data: SaveCephalometricReportDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ceph-report`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCephReportList
     * @request GET:/api/Radiology/records/{id}/ceph-report
     */
    radiologyRecordsCephReportList: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ceph-report`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCephRecalculateCreate
     * @request POST:/api/Radiology/records/{id}/ceph-recalculate
     */
    radiologyRecordsCephRecalculateCreate: (
      id: string,
      data: RecalculateCephRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ceph-recalculate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsCephVtoCreate
     * @request POST:/api/Radiology/records/{id}/ceph-vto
     */
    radiologyRecordsCephVtoCreate: (
      id: string,
      data: CephalometricVtoSimulationRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/ceph-vto`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsEndodonticList
     * @request GET:/api/Radiology/records/{id}/endodontic
     */
    radiologyRecordsEndodonticList: (
      id: string,
      query?: {
        /**
         * @format int32
         * @default 36
         */
        toothNumber?: number;
        canalName?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/endodontic`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsEndodonticCreate
     * @request POST:/api/Radiology/records/{id}/endodontic
     */
    radiologyRecordsEndodonticCreate: (
      id: string,
      data: SaveEndodonticAnalysisRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/endodontic`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Radiology
     * @name RadiologyRecordsEndodonticRecalculateCreate
     * @request POST:/api/Radiology/records/{id}/endodontic/recalculate
     */
    radiologyRecordsEndodonticRecalculateCreate: (
      id: string,
      data: RecalculateEndodonticCanalRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Radiology/records/${id}/endodontic/recalculate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Search
     * @name SearchList
     * @request GET:/api/search
     */
    searchList: (
      query?: {
        q?: string;
        /**
         * @format int32
         * @default 8
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/search`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Specializations
     * @name SpecializationsList
     * @request GET:/api/Specializations
     */
    specializationsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Specializations`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name SterilizationTelemetryList
     * @request GET:/api/Sterilization/telemetry
     */
    sterilizationTelemetryList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Sterilization/telemetry`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name EquipmentSterilizationTelemetryList
     * @request GET:/api/equipment/sterilization/telemetry
     */
    equipmentSterilizationTelemetryList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/equipment/sterilization/telemetry`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name SterilizationCyclesList
     * @request GET:/api/Sterilization/cycles
     */
    sterilizationCyclesList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Sterilization/cycles`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name EquipmentSterilizationCyclesList
     * @request GET:/api/equipment/sterilization/cycles
     */
    equipmentSterilizationCyclesList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/equipment/sterilization/cycles`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name SterilizationCyclesDetail
     * @request GET:/api/Sterilization/cycles/{id}
     */
    sterilizationCyclesDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Sterilization/cycles/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name EquipmentSterilizationCyclesDetail
     * @request GET:/api/equipment/sterilization/cycles/{id}
     */
    equipmentSterilizationCyclesDetail: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/equipment/sterilization/cycles/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name SterilizationCyclesValidateCreate
     * @request POST:/api/Sterilization/cycles/validate
     */
    sterilizationCyclesValidateCreate: (
      data: SterilizationValidateAutoclaveCycleRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Sterilization/cycles/validate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sterilization
     * @name EquipmentSterilizationCyclesValidateCreate
     * @request POST:/api/equipment/sterilization/cycles/validate
     */
    equipmentSterilizationCyclesValidateCreate: (
      data: SterilizationValidateAutoclaveCycleRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/equipment/sterilization/cycles/validate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersRequestCreate
     * @request POST:/api/inventory/transfers/request
     */
    inventoryTransfersRequestCreate: (
      data: CreateStockTransferRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/request`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersList
     * @request GET:/api/inventory/transfers
     */
    inventoryTransfersList: (
      query?: {
        clinicId?: string;
        status?: string;
        /** @default "all" */
        direction?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/inventory/transfers`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersDetail
     * @request GET:/api/inventory/transfers/{id}
     */
    inventoryTransfersDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersApproveUpdate
     * @request PUT:/api/inventory/transfers/{id}/approve
     */
    inventoryTransfersApproveUpdate: (
      id: string,
      data: ApproveStockTransferDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/${id}/approve`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersDispatchUpdate
     * @request PUT:/api/inventory/transfers/{id}/dispatch
     */
    inventoryTransfersDispatchUpdate: (
      id: string,
      data: DispatchStockTransferDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/${id}/dispatch`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersReceiveUpdate
     * @request PUT:/api/inventory/transfers/{id}/receive
     */
    inventoryTransfersReceiveUpdate: (
      id: string,
      data: ReceiveStockTransferDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/${id}/receive`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags StockTransfers
     * @name InventoryTransfersCancelUpdate
     * @request PUT:/api/inventory/transfers/{id}/cancel
     */
    inventoryTransfersCancelUpdate: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/inventory/transfers/${id}/cancel`,
        method: "PUT",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsStatusList
     * @request GET:/api/subscriptions/status
     */
    subscriptionsStatusList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/subscriptions/status`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsValidatePromoCreate
     * @request POST:/api/subscriptions/validate-promo
     */
    subscriptionsValidatePromoCreate: (
      data: PromoValidationRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/subscriptions/validate-promo`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsActivateManualCreate
     * @request POST:/api/subscriptions/activate-manual
     */
    subscriptionsActivateManualCreate: (
      data: PromoValidationRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/subscriptions/activate-manual`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsUploadReceiptCreate
     * @request POST:/api/subscriptions/upload-receipt
     */
    subscriptionsUploadReceiptCreate: (
      data: {
        /** @format binary */
        file?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/subscriptions/upload-receipt`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsUpgradeTierCreate
     * @summary REQ-SUB-01: Upgrade subscription tier or request quota seat expansion.
     * @request POST:/api/subscriptions/upgrade-tier
     */
    subscriptionsUpgradeTierCreate: (
      data: TierUpgradeRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/subscriptions/upgrade-tier`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsCreate
     * @request POST:/api/Telehealth/sessions
     */
    telehealthSessionsCreate: (
      data: CreateTelehealthSessionRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsDetail
     * @request GET:/api/Telehealth/sessions/{token}
     */
    telehealthSessionsDetail: (token: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsStartCreate
     * @request POST:/api/Telehealth/sessions/{token}/start
     */
    telehealthSessionsStartCreate: (
      token: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/start`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsEndCreate
     * @request POST:/api/Telehealth/sessions/{token}/end
     */
    telehealthSessionsEndCreate: (
      token: string,
      data: EndTelehealthSessionRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/end`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsSyncViewportCreate
     * @request POST:/api/Telehealth/sessions/{token}/sync-viewport
     */
    telehealthSessionsSyncViewportCreate: (
      token: string,
      data: ViewportSyncDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/sync-viewport`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsTelePrescriptionCreate
     * @request POST:/api/Telehealth/sessions/{token}/tele-prescription
     */
    telehealthSessionsTelePrescriptionCreate: (
      token: string,
      data: IssueTelePrescriptionRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/tele-prescription`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsTelePrescriptionsList
     * @request GET:/api/Telehealth/sessions/{token}/tele-prescriptions
     */
    telehealthSessionsTelePrescriptionsList: (
      token: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/tele-prescriptions`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsAuditDossierList
     * @request GET:/api/Telehealth/sessions/{token}/audit-dossier
     */
    telehealthSessionsAuditDossierList: (
      token: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/audit-dossier`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Telehealth
     * @name TelehealthSessionsVerifyAuditCreate
     * @request POST:/api/Telehealth/sessions/{token}/verify-audit
     */
    telehealthSessionsVerifyAuditCreate: (
      token: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Telehealth/sessions/${token}/verify-audit`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Tenants
     * @name TenantsOnboardCreate
     * @request POST:/api/tenants/onboard
     */
    tenantsOnboardCreate: (
      data: OnboardTenantRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/tenants/onboard`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Tenants
     * @name TenantsResolveDetail
     * @request GET:/api/tenants/resolve/{subdomain}
     */
    tenantsResolveDetail: (subdomain: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tenants/resolve/${subdomain}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags VoiceScribe
     * @name VoiceScribeAnalyzeCreate
     * @request POST:/api/voice-scribe/analyze
     */
    voiceScribeAnalyzeCreate: (
      data: {
        /** @format binary */
        audio?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/voice-scribe/analyze`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WebAuthn
     * @name WebauthnRegisterOptionsCreate
     * @request POST:/api/webauthn/register/options
     */
    webauthnRegisterOptionsCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/webauthn/register/options`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags WebAuthn
     * @name WebauthnRegisterCreate
     * @request POST:/api/webauthn/register
     */
    webauthnRegisterCreate: (
      data: WebAuthnRegisterRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/webauthn/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WebAuthn
     * @name WebauthnAuthenticateOptionsCreate
     * @request POST:/api/webauthn/authenticate/options
     */
    webauthnAuthenticateOptionsCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/webauthn/authenticate/options`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags WebAuthn
     * @name WebauthnAuthenticateCreate
     * @request POST:/api/webauthn/authenticate
     */
    webauthnAuthenticateCreate: (
      data: WebAuthnAuthenticateRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/webauthn/authenticate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsAppWebhook
     * @name WebhooksWhatsappCreate
     * @request POST:/api/webhooks/whatsapp
     */
    webhooksWhatsappCreate: (
      data: WhatsAppWebhookPayload,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/webhooks/whatsapp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
}
