import $api from "../http/index.tsx";
import { Axios, AxiosResponse } from "axios";
import { AuthResponse } from "../models/Response/AuthResponse";
import { IUser } from "../models/IUsers";
export default class UserService {
    static fetchUsers(): Promise<AxiosResponse<IUser[]>>{
           return $api.get<IUser[]>('/users') 
        }
    }

