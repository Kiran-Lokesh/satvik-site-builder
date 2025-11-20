const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

export interface UpdateProfileRequest {
  email?: string;
  displayName?: string;
  whatsappNumber?: string;
  role?: string;
  defaultAddress?: string;
}

export interface CurrentUserProfile {
  id: string;
  firebaseUid?: string;
  email?: string;
  displayName?: string;
  role?: string;
  whatsappNumber?: string;
  defaultAddress?: string;
}

export class UsersApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  async updateProfile(data: UpdateProfileRequest, idToken: string): Promise<void> {
    const url = this.resolveUrl('/api/user/profile');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Failed to update profile');
    }
  }

  async getCurrentUser(idToken: string): Promise<CurrentUserProfile> {
    const url = this.resolveUrl('/api/user/me');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Failed to load user profile');
    }

    return response.json();
  }
}

export const usersApiClient = new UsersApiClient();
