import assert from "node:assert/strict";
import { test } from "node:test";
import { GPX_MAX_POINTS, isDuplicateGpxPoint, parseGpx } from "./gpx-import.ts";

test("parses waypoints, route points and track points in source order", () => {
  const points=parseGpx(`<?xml version="1.0"?><gpx><wpt lat="52.1" lon="5.1"><name>Utrecht &amp; omgeving</name></wpt><rte><rtept lat="52.2" lon="5.2"><name><![CDATA[Stop 2]]></name></rtept></rte><trk><trkseg><trkpt lat="52.3" lon="5.3"/></trkseg></trk></gpx>`);
  assert.deepEqual(points.map(({name,source})=>({name,source})),[
    {name:"Utrecht & omgeving",source:"waypoint"},{name:"Stop 2",source:"route"},{name:"GPX point 3",source:"track"},
  ]);
});

test("rejects unsafe, invalid and excessive GPX input", () => {
  assert.throws(()=>parseGpx('<!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///etc/passwd">]><gpx/>'),/GPX_UNSAFE_XML/);
  assert.throws(()=>parseGpx("<xml/>"),/GPX_INVALID/);
  assert.throws(()=>parseGpx("<gpx><wpt lat=\"999\" lon=\"2\"/></gpx>"),/GPX_NO_VALID_POINTS/);
  const many=Array.from({length:GPX_MAX_POINTS+1},(_,i)=>`<wpt lat="1" lon="${i%180}"/>`).join("");
  assert.throws(()=>parseGpx(`<gpx>${many}</gpx>`),/GPX_TOO_MANY_POINTS/);
});

test("recognises coordinate duplicates within roughly eleven metres", () => {
  assert.equal(isDuplicateGpxPoint({lat:52.10005,lon:5.10005},[{lat:52.1,lon:5.1}]),true);
  assert.equal(isDuplicateGpxPoint({lat:52.2,lon:5.2},[{lat:52.1,lon:5.1}]),false);
});
