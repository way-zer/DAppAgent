import { recentAppList } from "../api/apps";
import AppList from "./AppList";
import React from "react";

export default function RecentApp() {
    return (
        <div>
            <AppList title="最近使用" appList={recentAppList} />
        </div>
    )
}