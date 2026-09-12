import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "./changelog";
export const Route=createFileRoute("/updates")({head:()=>({meta:[{title:"Product updates — GlobeTrotr"},{name:"description",content:"Follow new GlobeTrotr beta features, fixes and improvements."}]}),component:ChangelogPage});
