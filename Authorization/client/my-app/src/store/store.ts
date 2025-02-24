import { IUser } from "../models/IUsers"
import {makeAutoObservable} from "mobx";
import AuthService from "../service/AuthService.ts";
import axios from "axios";
import { storeAnnotation } from "mobx/dist/internal";
import { AuthResponse } from "../models/Response/AuthResponse.ts";
import { API_URL } from "../http/index.tsx";

export default class Store{
    user = {} as IUser;
    isAuth = false;
    isLoading = false;

    constructor(){
        makeAutoObservable(this);
    }
    setAuth(bool: boolean){
        this.isAuth = bool;
    }
    setUser(user: IUser){
        this.user = user;
    }
    setLoading(bool: boolean){
        this.isLoading = bool;
    }
    
    async login(email: string, password: string){
        try{
            const response = await AuthService.login(email, password);
            console.log(response);
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        }catch(e){
            console.log(e.response?.data?.message);
        }

    }
    async registration(email: string, password: string){
        try{
            const response = await AuthService.registration(email, password);
            console.log(response);
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        }catch(e){
            console.log(e.response?.data?.message);
        }

    }
    async logout(){
        try{
            const response = await AuthService.logout();
            console.log(response);
            localStorage.removeItem('token');
            this.setAuth(false);
            this.setUser({} as IUser);
        }catch(e){
            console.log(e.response?.data?.message);
        }

    }
    async checkAuth(){
        this.setLoading(true);
        try{
            const response = await axios.get<AuthResponse>(`${API_URL}/refresh`,{withCredentials:true});
            console.log(response);
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        } catch(e){
            console.log(e.response?.data?.message);
        }finally{
            this.setLoading(false);
        }
    }
}

    