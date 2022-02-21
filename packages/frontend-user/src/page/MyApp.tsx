import React from "react";
import AppList from "./AppList";
import { myAppList } from "../api/apps";

export default function MyApp() {
  return (
    <div> 
      <AppList title="我的应用" appList={myAppList} />
    </div>
  );
}


