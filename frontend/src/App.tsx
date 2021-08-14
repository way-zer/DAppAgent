import React, {useEffect, useState} from 'react'
import {status} from '@api/ipfs'
import {create} from '@api/apps'

function B(){
    return (<span>TEST4</span>
    )
}

export default function () {
    const [status0, setStatus] = useState({})
    useEffect(() => {
        status().then(setStatus)
    },[])

    const [name, setName] = useState("")
    const [result, setResult] = useState("")
    function createApp(){
        create(name).then(setResult)
    }

    return (<div>
        Hello World
        <pre>{JSON.stringify(status0)}</pre>
        <input value={name} onChange={(event => setName(event.target.value))}/>
        <button onClick={createApp}>创建APP测试</button>
        <span>{result}</span>
        <B/>
    </div>)
}