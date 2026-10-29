export type AppLanguage = 'ru' | 'uz' | 'en';
export type UserRole = 'traveler' | 'manager' | 'admin';
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'completed';
export type PaymentGateway = 'payme' | 'click' | 'uzum';

export interface ActivityBlock {
  activity: string;
  cost_uzs: number;
}

export interface AccommodationBlock {
  name: string;
  cost_uzs: number;
}

export interface DailyItineraryItem {
  day_number: number;
  location: string;
  morning: ActivityBlock;
  afternoon: ActivityBlock;
  evening: ActivityBlock;
  accommodation: AccommodationBlock;
}

export interface GeneratedTourPlan {
  trip_title: string;
  summary: string;
  estimated_total_cost_uzs: number;
  daily_itinerary: DailyItineraryItem[];
  local_tips: string[];
}

export interface GenerateItineraryRequest {
  destination: string;
  duration_days: number;
  travelers_count: number;
  adults?: number;
  children?: number;
  budget_uzs: number;
  interests: string[];
  special_requests?: string;
  language?: AppLanguage;
}

export interface GenerateItineraryResponse {
  success: boolean;
  meta?: {
    model_used: string;
    fallback_triggered: boolean;
    sanitized: boolean;
    execution_ms: number;
    language?: AppLanguage;
  };
  data: {
    itinerary_id: string;
    trip_title: string;
    summary: string;
    estimated_total_cost_uzs: number;
    daily_itinerary: DailyItineraryItem[];
    local_tips: string[];
    support: {
      director: string;
      phone: string;
    };
  };
}

export interface BookingRecord {
  id: string;
  itinerary_id: string;
  user_full_name: string;
  user_phone: string;
  user_email?: string;
  total_amount_uzs: string; // serialized BIGINT
  status: BookingStatus;
  manager_contact_phone: string;
  director_name: string;
  created_at: string;
  transaction?: {
    id: string;
    provider: PaymentGateway;
    provider_tx_id: string;
    amount_uzs: string;
    is_success: boolean;
    created_at: string;
  };
}
