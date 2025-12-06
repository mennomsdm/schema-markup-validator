export enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface SchemaIssue {
  severity: ValidationSeverity;
  type: 'syntax' | 'schema' | 'inconsistency';
  message: string;
  entity?: string;
  property?: string;
}

export interface DetectedEntity {
  type: string;
  propertiesFound: string[];
  missingRequired: string[];
  missingRecommended: string[];
}

export interface SchemaAnalysisResult {
  summary: string;
  detectedTypes: string[];
  entities: DetectedEntity[];
  issues: SchemaIssue[];
  healthScore: number;
  correctedJsonLd: Record<string, any>;
}

export enum AnalysisStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
