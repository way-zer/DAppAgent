import React from 'react';
import ReactDOM from 'react-dom';
import './index.styl';
import axios from 'axios';
import {message} from 'antd';
import AppRoutes from './routes';

initAxios();
ReactDOM.render(
    <React.StrictMode>
        <AppRoutes/>
    </React.StrictMode>,
    document.getElementById('root'),
);

function initAxios() {
    axios.interceptors.response.use(undefined, (error => {
        if (axios.isAxiosError(error)) {
            const {message: msg, data} = error.response?.data;
            message.error(msg).then();
            console.error(msg, data);
        }
        throw error;
    }));
}