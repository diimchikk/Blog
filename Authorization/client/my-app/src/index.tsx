import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Store from './store/store.ts';
import './Styles/regist_style.css';
import './Styles/Styles.css';
export const Context = React.createContext({ store: new Store() });

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <Context.Provider value={{ store: new Store() }}>
        <App />
    </Context.Provider>
);



