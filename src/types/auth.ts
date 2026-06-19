export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface GoogleAuthPayload {
  accessToken: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  token: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string;
    role: string;
  };
}

export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  accessToken: string;
}

export interface FacebookAuthPayload {
  accessToken: string;
}

export interface FacebookAuthResponse {
  success: boolean;
  message: string;
  token: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string;
    role: string;
  };
}
