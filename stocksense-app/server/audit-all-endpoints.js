const axios = require('../client/node_modules/axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runAudit() {
  console.log('====================================================');
  console.log('       STOCKSENSE ENDPOINT & DATA AUDIT REPORT');
  console.log('====================================================\n');

  // 1. Authenticate
  let token = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@stocksense.com',
      password: 'Admin@123'
    });
    token = loginRes.data.data.token;
    console.log('✅ Authentication: SUCCESS (token acquired)');
  } catch (err) {
    console.error('❌ Authentication FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Define list of endpoints to audit
  const endpoints = [
    { name: 'Auth / Current User', path: '/auth/me' },
    { name: 'Users List', path: '/users' },
    { name: 'Roles List', path: '/roles' },
    { name: 'User Profile', path: '/profile' },
    { name: 'Categories List', path: '/categories' },
    { name: 'Units List', path: '/units' },
    { name: 'Products List', path: '/products' },
    { name: 'Warehouses List', path: '/warehouses' },
    { name: 'Locations List', path: '/locations' },
    { name: 'Inventory Stock List', path: '/inventory' },
    { name: 'Inventory Summary', path: '/inventory/summary' },
    { name: 'Goods Receipts List', path: '/goods-receipts' },
    { name: 'Deliveries List', path: '/deliveries' },
    { name: 'Stock Transfers List', path: '/stock-transfers' },
    { name: 'Purchase Orders List', path: '/purchase-orders' },
    { name: 'Stock Adjustments List', path: '/adjustments' },
    { name: 'Stock Movements History', path: '/stock-movements' },
    { name: 'Suppliers List', path: '/suppliers' },
    { name: 'Notifications List', path: '/notifications' },
    { name: 'Notifications Unread Count', path: '/notifications/unread-count' },
    { name: 'Audit Logs List', path: '/audit' },
    { name: 'Audit Logs Metadata', path: '/audit/meta' },
    { name: 'Dashboard Stats', path: '/dashboard/stats' }
  ];

  console.log(`Auditing ${endpoints.length} endpoints...\n`);

  let passCount = 0;
  let failCount = 0;

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep.path}`, { headers });
      const data = res.data?.data || res.data;
      
      // Determine count / summary info
      let info = '';
      if (Array.isArray(data)) {
        info = `${data.length} records`;
      } else if (data && typeof data === 'object') {
        if (data.inventory) info = `${data.inventory.length} records`;
        else if (data.list) info = `${data.list.length} records`;
        else if (data.deliveries) info = `${data.deliveries.length} records`;
        else if (data.transfers) info = `${data.transfers.length} records`;
        else if (data.adjustments) info = `${data.adjustments.length} records`;
        else if (data.purchase_orders) info = `${data.purchase_orders.length} records`;
        else if (data.movements) info = `${data.movements.length} records`;
        else if (data.users) info = `${data.users.length} records`;
        else if (data.roles) info = `${data.roles.length} records`;
        else if (data.notifications) info = `${data.notifications.length} records`;
        else if (data.items) info = `${data.items.length} records`;
        else if (data.stats) info = `Stats Object (${Object.keys(data.stats).length} keys)`;
        else info = `Object (${Object.keys(data).length} keys)`;
      }

      console.log(`✅ [${res.status} OK] ${ep.name.padEnd(28)} | Path: ${ep.path.padEnd(28)} | ${info}`);
      passCount++;
    } catch (err) {
      console.error(`❌ [${err.response?.status || 'ERR'}] ${ep.name.padEnd(28)} | Path: ${ep.path.padEnd(28)} | ${err.response?.data?.error?.message || err.message}`);
      failCount++;
    }
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${endpoints.length} total endpoints.`);
  console.log('====================================================');
}

runAudit();
