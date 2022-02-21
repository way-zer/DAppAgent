import usePromise from "react-use-promise";
import AppCube from "./AppCube";
import { Card } from "antd";
import React from "react";

interface AppListProps {
    title: string;
    appList: any;
}

export default function AppList (props: AppListProps) {
    const [status] = usePromise(() => props.appList(), []);
    const gridStyle = {
        width: '25%',
        textAlign: 'center',
      };
    return (
        <Card title={props.title}> 
        {status?.map(item => {
                return (
                    <Card.Grid style={gridStyle} key={item}>
                        <AppCube key={item} id={item} />
                    </Card.Grid>
                );
            })}
        </Card>
    );
}