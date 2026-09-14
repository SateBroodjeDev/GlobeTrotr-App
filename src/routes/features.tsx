import { createFileRoute } from "@tanstack/react-router";
import { FeaturesPage } from "./mogelijkheden";
export const Route=createFileRoute("/features")({head:()=>({meta:[{title:"Features — GlobeTrotr"},{name:"description",content:"Discover route planning, bookings, expenses, sharing and Agency tools in GlobeTrotr."}]}),component:FeaturesPage});
