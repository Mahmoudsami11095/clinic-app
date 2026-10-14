export interface TourStep {
  targetSelector?: string;
  titleKey: string;
  contentKey: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string;
}

export interface TourDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  roles: string[];
  icon: string;
  steps: TourStep[];
}

export interface CheatSheetStep {
  num: number;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  shortcut?: string;
}

export interface CheatSheetCard {
  id: string;
  title: string;
  titleAr: string;
  badge: string;
  badgeAr: string;
  icon: string;
  targetRole: string;
  steps: CheatSheetStep[];
}

export interface PageHelpInfo {
  routeMatch: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  tips: { en: string; ar: string }[];
  recommendedTourId?: string;
}

export interface KeyboardShortcutItem {
  keys: string[];
  description: string;
  descriptionAr: string;
  category: 'general' | 'navigation' | 'clinical';
}
