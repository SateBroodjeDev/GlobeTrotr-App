import assert from "node:assert/strict";
import test from "node:test";
import { effectiveAgencyPermissions, protectAgencyTripUpdate } from "./agency-permissions.ts";
import type { Trip } from "./types.ts";
const current:Trip={id:"x",revision:"1",name:"Reis",template:"citytrip",start:"2026-09-09",end:"2026-09-10",budget:100,stops:[],itinerary:[],expenses:[],members:[],public:false,archived:false};
test("Agency-rolstandaard en gebruikersafwijking worden gecombineerd",()=>{const p=effectiveAgencyPermissions("advisor",{expenses_manage:false},{members_manage:true});assert.equal(p.trips_plan,true);assert.equal(p.expenses_manage,false);assert.equal(p.members_manage,true)});
test("Agency-reiswrite bewaart velden zonder recht",()=>{const submitted={...current,name:"Gewijzigd",public:true,expenses:[{id:"e",date:"2026-09-09",title:"X",category:"other" as const,amount:2,currency:"EUR",paidBy:"A",billable:false}]};const result=protectAgencyTripUpdate(current,submitted,effectiveAgencyPermissions("finance"));assert.equal(result.name,"Reis");assert.equal(result.public,false);assert.equal(result.expenses.length,1)});
