import { createFileRoute } from "@tanstack/react-router";
import { BetaPage } from "./beta-voorwaarden";
export const Route=createFileRoute("/beta")({head:()=>({meta:[{title:"International beta — GlobeTrotr"},{name:"description",content:"Join, test and provide feedback on the GlobeTrotr international beta."}]}),component:BetaPage});
