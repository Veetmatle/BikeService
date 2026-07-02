export interface ServiceOrderSummary {
  id: number;
  status: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  bikeBrand: string;
  bikeModel: string;
  estimatedPrice?: number;
  estimatedPickupDate?: string;
  createdAt: string;
  createdBy: string;
  lastEditedBy?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface OrderPhoto {
  id: number;
  fileName: string;
  url: string;
  uploadedAt: string;
}

export interface TaggedUser {
  id: number;
  username: string;
}

export interface ServiceOrder {
  id: number;
  status: string;
  trackingToken: string;
  rowVersion: number;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  bikeBrand: string;
  bikeModel: string;
  bikeType: string;
  bikeFrameNumber?: string;
  bikeColor?: string;
  description: string;
  notes?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  estimatedPickupDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
  lastEditedBy?: string;
  photos: OrderPhoto[];
  taggedUsers: TaggedUser[];
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
}

export interface OrderTrackingResponse {
  status: string;
  bikeBrand: string;
  bikeModel: string;
  description: string;
  estimatedPrice?: number;
  finalPrice?: number;
  estimatedPickupDate?: string;
  createdAt: string;
  updatedAt: string;
  photos: OrderPhoto[];
}

export interface Notification {
  id: number;
  orderId: number;
  clientName: string;
  taggedBy: string;
  isRead: boolean;
  createdAt: string;
}

export interface MentionableUser {
  id: number;
  username: string;
}
