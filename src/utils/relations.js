import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// ─── Generic helper: query a collection by a field ───
const findOne = async (col, field, value) => {
  if (!value) return null;
  try {
    const q = query(collection(db, col), where(field, '==', value));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data();
  } catch (e) {
    console.error(`findOne(${col}, ${field}=${value}):`, e);
  }
  return null;
};

// ─── Purchase Inquiry auto-fill (used by: Valuation, PurchaseFollowUp, PurchaseCloser, Workshop) ───
export const autoFillFromInq = async (inqId) => {
  if (!inqId) return null;
  const data = await findOne('pur_inq', 'inqId', inqId);
  if (data) return data;
  // Fallback: full scan by doc ID
  try {
    const all = await getDocs(collection(db, 'pur_inq'));
    const doc = all.docs.find(d => d.id === inqId);
    if (doc) return doc.data();
  } catch (e) {}
  return null;
};

// ─── Valuation auto-fill (used by: Workshop) ───
export const autoFillFromVal = async (inqId) => {
  if (!inqId) return null;
  return await findOne('val', 'v_inqid', inqId);
};

// ─── Sales Inquiry auto-fill (used by: SalesFollowUp, SalesCloser, TestDrive) ───
export const autoFillFromSalInq = async (salId) => {
  if (!salId) return null;
  return await findOne('sal_inq', 'salId', salId);
};

// ─── Stock auto-fill by Reg No (used by: Workshop, SalesCloser, Delivery) ───
export const autoFillFromStock = async (regNo) => {
  if (!regNo) return null;
  return await findOne('stk', 'regNo', regNo);
};

// ─── Stock auto-fill by Stock ID ───
export const autoFillFromStockId = async (stkId) => {
  if (!stkId) return null;
  return await findOne('stk', 'stkId', stkId);
};

// ─── Purchase Closer auto-fill (used by: OrderBooking) ───
export const autoFillFromPcl = async (pclId) => {
  if (!pclId) return null;
  return await findOne('pcl', 'pclId', pclId);
};

// ─── Sales Order Booking auto-fill (used by: Delivery) ───
export const autoFillFromSob = async (sobId) => {
  if (!sobId) return null;
  return await findOne('sob', 'sobId', sobId);
};

// ─── Sales Booking (OB) auto-fill (used by: Delivery) ───
export const autoFillFromOb = async (obId) => {
  if (!obId) return null;
  return await findOne('ob', 'obId', obId);
};

// ─── Document auto-fill (used by: Stock) ───
export const autoFillFromDoc = async (docId) => {
  if (!docId) return null;
  const doc = await findOne('doc', 'docId', docId);
  if (doc && doc.dc_obid) {
    const ob = await autoFillFromOb(doc.dc_obid);
    if (ob) return { ...doc, ...ob };
  }
  return doc;
};

// ─── Workshop auto-fill (used by: Stock) ───
export const autoFillFromWs = async (stkId, regNo) => {
  if (stkId) {
    const ws = await findOne('ws', 'ws_stkid', stkId);
    if (ws) return ws;
  }
  if (regNo) {
    const ws = await findOne('ws', 'ws_vnum', regNo);
    if (ws) return ws;
  }
  return null;
};

// ─── Legacy exports ───
export const loadBrands = () => [
  'Maruti Suzuki','Hyundai','Tata','Honda','Toyota','Mahindra','Ford',
  'Volkswagen','Kia','Renault','Nissan','MG','Skoda','Jeep','Audi','BMW','Mercedes','Others'
];

export const loadModels = (make) => {
  const MODELS = {
    'Maruti Suzuki': ['Swift','Alto','Baleno','WagonR','Brezza','Ertiga','Dzire','Ciaz','Ignis','S-Presso'],
    'Hyundai': ['i20','i10','Creta','Venue','Verna','Tucson','Alcazar','Aura','Grand i10','Santro'],
    'Tata': ['Nexon','Harrier','Safari','Punch','Altroz','Tiago','Tigor','Hexa','Nano'],
    'Honda': ['City','Amaze','WR-V','Jazz','CR-V','HR-V','Elevate'],
    'Toyota': ['Innova Crysta','Fortuner','Camry','Glanza','Urban Cruiser Hyryder','Yaris'],
    'Mahindra': ['Scorpio','Thar','XUV700','Bolero','XUV300','Marazzo','BE6'],
    'Ford': ['EcoSport','Figo','Aspire','Endeavour'],
    'Volkswagen': ['Polo','Vento','Taigun','Virtus'],
    'Kia': ['Seltos','Sonet','Carnival','EV6'],
    'Renault': ['Kwid','Duster','Triber','Kiger'],
    'Others': ['Other Model']
  };
  return MODELS[make] || ['Other'];
};

export const loadYears = () => {
  const years = [];
  for (let y = new Date().getFullYear(); y >= 1998; y--) years.push(y);
  return years;
};
