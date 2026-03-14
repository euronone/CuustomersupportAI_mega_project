import { api } from "@/lib/api";
import type { LoginRequest, SignupRequest, User, AuthTokens } from "@/types";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/auth/login", data);
  },

  async signup(data: SignupRequest): Promise<{ message: string }> {
    return api.post("/auth/signup", data);
  },

  async getMe(): Promise<{ data: User }> {
    return api.get("/auth/me");
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return api.post("/auth/refresh", { refresh_token: refreshToken });
  },
};
