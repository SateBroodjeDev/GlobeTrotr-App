const clean=(value,max=300)=>String(value||'').replace(/\s+/g,' ').trim().slice(0,max);
const first=(text,patterns)=>{for(const pattern of patterns){const hit=text.match(pattern);if(hit?.[1])return clean(hit[1],120)}return undefined};
export function parseBookingMail({subject='',body='',sender=''}){
 const text=clean(`${subject}\n${body}`,20000),lower=text.toLowerCase();let bookingType='unknown';
 if(/\b(flight|vlucht|boarding|airline|airport)\b/.test(lower))bookingType='flight';else if(/\b(hotel|hostel|accommodation|verblijf|check-in|room)\b/.test(lower))bookingType='lodging';else if(/\b(rental car|huurauto|car rental|autohuur)\b/.test(lower))bookingType='car_rental';else if(/\b(train|trein|bus|ferry|transfer|transport)\b/.test(lower))bookingType='transport';else if(/\b(activity|activiteit|tour|ticket|excursion)\b/.test(lower))bookingType='activity';
 const bookingReference=first(text,[/(?:booking|reservation|confirmation|boekings)(?:\s+(?:reference|number|nummer))?\s*[:#-]\s*([A-Z0-9-]{4,24})/i,/(?:PNR)\s*[:#-]\s*([A-Z0-9]{4,12})/i]);
 const flightNumber=bookingType==='flight'?first(text,[/\b([A-Z]{2,3}\s?\d{2,4})\b/]):undefined;const date=first(text,[/\b(20\d{2}-\d{2}-\d{2})\b/,/\b(\d{2}[/-]\d{2}[/-]20\d{2})\b/]);
 const provider=clean(sender.split('@')[1]?.split('.')[0]||'',80)||undefined;const changeKind=/\b(cancelled|canceled|annulering|geannuleerd)\b/.test(lower)?'cancelled':/\b(changed|change|wijziging|gewijzigd|updated)\b/.test(lower)?'changed':'new';const parsedData={title:clean(subject,160)||'Imported booking',provider,bookingReference,flightNumber,date,changeKind};Object.keys(parsedData).forEach(k=>parsedData[k]===undefined&&delete parsedData[k]);
 const signals=[bookingType!=='unknown',Boolean(bookingReference),Boolean(date),Boolean(flightNumber)].filter(Boolean).length;return{bookingType,parsedData,confidence:Math.min(.98,.3+signals*.17)};
}
