export interface Sign {
  id: number;
  namePt: string;
  emoji: string;
  startDate: string;
  endDate: string;
}

export interface HoroscopeCategory {
  id: number;
  name: string;
  displayNamePt: string;
  icon?: string;
}

export interface SignNavigation {
  chave: string;
  nome: string;
  emoji: string;
  dateRange: string;
}

export interface BaseHoroscopeData {
  sign: string;
  signId: number;
  dateRange: string;
  signosNavigation: SignNavigation[];
  today: string;
}

export interface DailyHoroscopeData extends BaseHoroscopeData {
  text: string | null;
}

export interface CategoryHoroscopeData extends BaseHoroscopeData {
  text: string | null;
  category: string;
  categoryId: number;
}

export interface HoroscopeLoaderParams {
  signo: string;
}

export interface CategoryHoroscopeLoaderParams extends HoroscopeLoaderParams {
  categoria: string;
}