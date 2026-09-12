import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "./prijzen";
export const Route=createFileRoute("/pricing")({head:()=>({meta:[{title:"Pricing — GlobeTrotr"},{name:"description",content:"Compare GlobeTrotr Free, Pro and Agency."}]}),component:PricingPage});
