import assert from "node:assert/strict";import test from "node:test";import {GLOBETROTR_BRANDING,resolveBranding}from"./branding.ts";
test("niet-Agency valt altijd terug op GlobeTrotr",()=>assert.deepEqual(resolveBranding("pro",null,{brandName:"Oud merk"}),GLOBETROTR_BRANDING));
test("reisafwijking gaat voor actieve Agency-branding",()=>{const result=resolveBranding("agency",{system_name:"Agency",domain:"agency.nl",accent:200,tagline:"Samen"},null,{brandName:"Klantreis"});assert.equal(result.brandName,"Klantreis");assert.equal(result.domain,"agency.nl")});
