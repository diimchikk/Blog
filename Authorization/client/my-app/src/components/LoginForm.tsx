import React, { FC, useState, useContext,useEffect } from 'react';
import { Context } from '../index.tsx';
import { observer } from 'mobx-react-lite';
import { data, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthResponse } from "../models/Response/AuthResponse.ts";
import { API_URL } from "../http/index.tsx";
import { argv0 } from 'process';
const LoginForm: FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const[confirmPassword, setConfirmPassword] = useState<string>('');
    const[passwordError, setPasswordError] = useState<string|null>(null);
    const { store } = useContext(Context); 
    const location = useLocation();
    const navigate = useNavigate();
    const isRegistrationPage = location.pathname === '/registration';
    useEffect(()=>{
        const tab1 = document.getElementById('tab-1') as HTMLInputElement;
        const tab2 = document.getElementById('tab-2') as HTMLInputElement;
        if(tab1 && tab2){
            tab1.checked =!isRegistrationPage;
            tab2.checked =isRegistrationPage;
        }
        const handleTabChange = () =>{
            if (tab1?.checked){
                navigate('/login');
            }else if(tab2?.checked){
                navigate('/registration');
            }
        };
        tab1.addEventListener('change',handleTabChange);
        tab2.addEventListener('change',handleTabChange);

        return () =>{
            tab1?.removeEventListener('change',handleTabChange);
            tab2?.removeEventListener('change',handleTabChange);
        };
    },[navigate,isRegistrationPage]);

    const handleConfirmPassword = (value: string) =>{
        setConfirmPassword(value);
        if(value !== password){
            setPasswordError('Неверный пароль');
        }else{
            setPasswordError(null);
        }
    }
    const handleRegistration = async() =>{
        try{
            /*const response =*/ await axios.post('http://localhost:5000/api/registration',{email, password, withCredentials:true,});
            //const token = response.data.accessToken;
            //console.log('token от сервера:',token);
            //if(token){localStorage.setItem('refreshToken',token);}
            alert("Вы успешно зарегистрировались");
            await store.registration(email, password);
            //navigate("/");
            //window.location.href ="http://localhost:5000";
        }catch(err){
            console.error(err);
            alert('Ошибка регистрации');
        }
    }
    /*const handleLogin = async() =>{
        try{
            const response = await axios.post(
                'http://localhost:5000/api/login',
                {email,password},
                {withCredentials: true}
            );

            const token = response.data.token//Может быть ошибка из того сервер не возвращает токен 

        }catch{}
    }*/
    const handleLogin = async() =>{
        try{
            const response = await axios.post('http://localhost:5000/api/login',{email, password,withCredentials:true});
            const token = response.data.accessToken;
            console.log('token от сервера:',token);
            if(token){
            localStorage.setItem('refreshToken',token);}
            store.login(email, password);
            //await axios.get('http://localhost:5000/api/refresh', { withCredentials: true });
            //alert("Вы успешно вошли");
            //navigate("/");
            setTimeout(() =>{window.location.href = "http://localhost:5000";},500);
            
            
        }catch(err){
            console.error(err);
            alert('Ошибка регистрации');
        }
    }
    return (
        <div>
            <div className="b-tabs">
            <input type="radio" name="t" id="tab-1" defaultChecked={!isRegistrationPage} />
            <label htmlFor="tab-1"><span>Log In</span></label>
            <input type="radio" name="t" id="tab-2"defaultChecked={isRegistrationPage} />
            <label htmlFor="tab-2"><span>Registration</span></label>

            <div id="tab-content-1">
                <form action="" className="form">
                    <h1 className="form_title">Log into Blog</h1>  
                    <div className="form_group">
                        <input
                            onChange={e => setEmail(e.target.value)}
                            value={email}
                            type="text"
                            className="form_input"
                            placeholder=""
                        />
                        <label className="form_label">Email</label>
                    </div>
                    <div className="form_group">
                        <input
                            onChange={e => setPassword(e.target.value)}
                            value={password}
                            className="form_input"
                            type="Password"
                            name="Password"
                            placeholder=""
                            required
                        />
                        <label className="form_label">Password</label>
                    </div>
                    <button
                        className="form_button"
                        type="button"
                        onClick={handleLogin}
                    >
                        Log In
                    </button>
                </form>
            </div>
                <div id="tab-content-2">
                <form action="" className="form">
                    <h1 className="form_title">Registration</h1>
                    <div className="form_group">
                    <input
                            onChange={e => setEmail(e.target.value)}
                            value={email}
                            type="text"
                            className="form_input"
                            placeholder=""
                        />
                        <label className="form_label">Email</label>
                    </div>
                    <div className="form_group">
                    <input
                            onChange={e => setPassword(e.target.value)}
                            value={password}
                            className="form_input"
                            type="Password"
                            name="Password"
                            placeholder=""
                            required
                        />
                        <label className="form_label" >Password</label>
                    </div>
                    <div className="form_group">
                        <input value={confirmPassword} 
                        onChange={e => handleConfirmPassword(e.target.value)}
                        className="form_input" 
                        type = "Password" name="Password"  
                        placeholder="" 
                        required/>
                        <label className="form_label" >Confirm Password</label>
                    </div>
                    {passwordError && (
                            <div style={{ color: "red", fontSize: "14px" }}>
                                {passwordError}
                            </div>
                        )}
                    <button
                        className="form_button"
                        type="button"
                        disabled={passwordError !== null || !password|| !confirmPassword}
                        onClick={handleRegistration} 
                    >
                        Registration
                    </button>
                </form>
            </div>
        </div>
        </div>
    );
};

export default  observer (LoginForm);


