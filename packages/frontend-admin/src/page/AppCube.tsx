import usePromise from "react-use-promise";
import { Avatar } from "antd";
import React from "react";
import { appInfo } from "@api/apps";

interface AppCubeProps {
    id: string;
}

export default function AppCube(props: AppCubeProps) {
    const [status] = usePromise(() => appInfo(props?.id), []);
    
    return (
        <div>
            <Avatar size={64}> {status?.id} </Avatar>
            <div> {status?.name} </div>
        </div>
    )
}