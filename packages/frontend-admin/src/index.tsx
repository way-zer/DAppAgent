import React from 'react'
import ReactDOM from 'react-dom'
import './index.styl'
import App from './App'
import {initAxios} from '@api/axios'

initAxios()
ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root'),
)