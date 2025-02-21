import React, {FC, useContext, useEffect, useState} from 'react';
import LoginForm from './components/LoginForm.tsx';
import { Context } from './index.tsx';
import {observer} from "mobx-react-lite";
import { IUser } from './models/IUsers.ts';
import UserService from './service/UserService.ts';
import { error } from 'console';
import{BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';




const App: FC = () => {
  const {store} = useContext(Context);
  const [users, setUsers] = useState<IUser[]>([]);
  const [state, setState] = useState(null);
  useEffect(() => {
    if(localStorage.getItem('token')){
      store.checkAuth();
    }
  }, [])
   /*async function getUser(){
        try{
          const response = await UserService.fetchUsers();
          setUsers(response.data);
        }catch(e){
          console.log(e);
        }
  }*/
  if(store.isLoading){
    return <div>Загрузка...</div>
  }
  //if(!store.isAuth){
    return(
      <div>
        <Router>
          <Routes>
          <Route path='/' element={<Navigate to='/login'/>}/>
          <Route path='/login' element={<LoginForm/>}/>
          <Route path='/registration' element={<LoginForm/>}/>
        </Routes>
        </Router>
      </div>
      
      
    )
  //}

  /*return (
  <div>
    <div>
      <h1>{store.isAuth ? `Пользователь авторизован ${store.user.email}`: "АВТОРИЗУЙТЕСЬ" }</h1>
      <h1>{store.user.isActivated ? "Акаунт подтвержден" : "Подтвердите Акаунт!"}</h1>
      <button onClick={() => store.logout()}>Выйти</button>
      <div>
        <button onClick ={getUser}>Получить Пользователей</button>
      </div>
      {users.map(user => 
        <div key = {user.email} >{user.email}</div>
      )}
    
    <div>{state}</div>
    </div>
  </div>
  );*/
};


export default observer (App);



