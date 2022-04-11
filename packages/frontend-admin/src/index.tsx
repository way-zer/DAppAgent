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
            if (error.response?.status == 400) {
                message.error(error.response?.data).then();
            }
        }
        throw error;
    }));
}