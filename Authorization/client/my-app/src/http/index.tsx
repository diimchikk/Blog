import axios, {AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { error } from "console";
import { config } from "dotenv";
import { response } from "express";
import { AuthResponse } from "../models/Response/AuthResponse";


export const API_URL =`http://localhost:5000/api`
const $api = axios.create({
    baseURL:API_URL,
    withCredentials:true,
});

$api.interceptors.request.use((config:InternalAxiosRequestConfig) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
    return config; 
})

$api.interceptors.response.use((config:AxiosResponse)=> {
    return config
}, async (error) => {
    const originalRequest = error.config;
    if(error.response.status == 401 && !error.config._isRetry){
        originalRequest._isRetry = true;
        try{
        const response = await axios.get<AuthResponse>(`${API_URL}/refresh`,{withCredentials:true});
        localStorage.setItem('token', response.data.accessToken);
        return $api.request(originalRequest);
    }catch(e){
        console.log('Не авторизован')
    }
}   
throw error;
})
export default $api;