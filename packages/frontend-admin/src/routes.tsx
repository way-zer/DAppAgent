import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import React from 'react';
import Home from './page/Home';
import Setting from './page/Setting';
import App from './page/App';
import {PermissionRequest} from './extPage/permission';

export default function AppRouter() {
    return <BrowserRouter>
        <Routes>
            <Route path="/" element={<App/>}>
                <Route index element={<Home/>}/>
                <Route path="setting" element={<Setting/>}/>
            </Route>
            <Route path="/permission" element={<PermissionRequest/>}/>
            <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
    </BrowserRouter>;
}
