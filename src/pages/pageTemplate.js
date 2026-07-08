// Template-based page generation helper
// Generates standard page JSX content

const pages = [
  { name: 'PurchaseBooking', file: 'PurchaseBooking', icon: 'fa-file-pen', col: 'ob', idPrefix: 'OB', title: 'Order Booking', subtitle: 'Purchase order booking records', fields: ['sellerName','regNo','amount','status'] },
  { name: 'SalesFollowUp', file: 'SalesFollowUp', icon: 'fa-comments', col: 'sfu', idPrefix: 'SFU', title: 'Sales Follow-Up', subtitle: 'Follow-up on sales inquiries', fields: ['buyerName','mobile','status','nextFU'] },
  { name: 'SalesCloser', file: 'SalesCloser', icon: 'fa-trophy', col: 'scl', idPrefix: 'SCL', title: 'Sales Closer', subtitle: 'Finalize sales deals', fields: ['buyerName','regNo','final','status'] },
  { name: 'SalesBooking', file: 'SalesBooking', icon: 'fa-clipboard-list', col: 'sob', idPrefix: 'SOB', title: 'Sales Order Booking', subtitle: 'Sales order booking records', fields: ['buyerName','regNo','amount','status'] },
  { name: 'Workshop', file: 'Workshop', icon: 'fa-screwdriver-wrench', col: 'ws', idPrefix: 'WS', title: 'Workshop / Refurb', subtitle: 'Vehicle workshop and refurbishment jobs', fields: ['regNo','jStat','total','notes'] },
  { name: 'Payment', file: 'Payment', icon: 'fa-credit-card', col: 'pay', idPrefix: 'PAY', title: 'Payment', subtitle: 'Purchase & sale payment records', fields: ['name','type','amount','status'] },
  { name: 'Delivery', file: 'Delivery', icon: 'fa-truck', col: 'del', idPrefix: 'DEL', title: 'Delivery', subtitle: 'Vehicle delivery records', fields: ['buyerName','regNo','status','delDate'] },
];

// This file is just documentation - not imported
module.exports = pages;
