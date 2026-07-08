// Centralized calculation logic ported from USED CAR FINAL.html

export const calcLoan = (sp, dp, roi, ten) => {
  const salePrice = parseFloat(sp) || 0;
  const downPay = parseFloat(dp) || 0;
  const rate = parseFloat(roi) || 0;
  const months = parseInt(ten) || 12;

  const loanAmt = salePrice - downPay;
  if (loanAmt <= 0) return { loanAmt: 0, emi: 0, totalInt: 0, totalPay: 0 };

  const r = rate / 12 / 100;
  let emi = 0;
  if (r > 0) {
    emi = (loanAmt * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  } else {
    emi = loanAmt / months;
  }

  const totalPayable = emi * months;
  const totalInterest = totalPayable - loanAmt;

  return {
    loanAmt: Math.round(loanAmt),
    emi: Math.round(emi),
    totalInt: Math.round(totalInterest),
    totalPay: Math.round(totalPayable)
  };
};

export const calcNego = (nego, offer) => {
  const n = parseFloat(nego) || 0;
  const o = parseFloat(offer) || 0;
  return Math.round(n - o);
};

export const calcGST = (sp, rate) => {
  const salePrice = parseFloat(sp) || 0;
  const gstRate = parseFloat(rate) || 0;
  const gstAmt = (salePrice * gstRate) / 100;
  const cgst = gstAmt / 2;
  const sgst = gstAmt / 2;
  const total = salePrice + gstAmt;

  return {
    gstAmt: Math.round(gstAmt),
    cgst: Math.round(cgst),
    sgst: Math.round(sgst),
    total: Math.round(total)
  };
};

export const calcTotalAmt = (base, other) => {
  return (parseFloat(base) || 0) + (parseFloat(other) || 0);
};
