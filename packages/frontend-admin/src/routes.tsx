import {BrowserRouter, Navigate, Route, Routes, useParams} from 'react-router-dom';
import React from 'react';
import Home from './page/Home';
import Setting from './page/Setting';
import App from './page/App';
import {PermissionRequest} from './extPage/permission';
import AppDetail from './page/Detail';

export default function AppRouter() {
    return <BrowserRouter>
        <Routes>
            <Route path="/" element={<App/>}>
                <Route path="setting" element={<Setting/>}/>
                <Route path="/" element={<Home/>}>
                    <Route path="detail/:id" element={<AppDetail/>}/>
                </Route>
            </Route>
            <Route path="/permission" element={<PermissionRequest/>}/>
            <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
    </BrowserRouter>;
}
