import usePromise from "react-use-promise";
import { Avatar, Button } from "antd";
import React from "react";
import { appInfo } from "@api/apps";

interface AppCubeProps {
    id: string;
}

export default function AppCube(props: AppCubeProps) {
    const [status] = usePromise(() => appInfo(props?.id), []);
    const [hover, setHover] = React.useState(false);
    
    const onHover = () => { setHover(true); };
    const onLeave = () => { setHover(false); };

    return (
        <div onPointerEnter={onHover} onPointerLeave={onLeave}>
            {
                !hover ?
            <div style={{height: 100}} >
                <Avatar size={64}> {status?.id} </Avatar>
                <div> {status?.name} </div>
            </div> :
            <div style={{height: 100}}>
                <Button type="primary"> 打开App </Button>
                <Button type="primary"> 查看详情 </Button>
            </div>}
        </div>
    )
}