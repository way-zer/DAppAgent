import React, {useEffect, useState} from 'react'
import {status} from '@api/ipfs'

export default function () {
    const [status0, setStatus] = useState({})
    useEffect(() => {
        status().then(setStatus)
    })
    return (<div>
        Hello World
        <pre>{JSON.stringify(status0)}</pre>
    </div>)
}