import { IUser } from "../IUsers";

export interface AuthResponse {
    accessToken:string;
    refreshToken:string;
    user: IUser;
}