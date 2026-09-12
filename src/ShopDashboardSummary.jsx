import React from 'react';

const ShopDashboardSummary = ({ orders }) => {
  // టోటల్ ఆర్డర్స్ మరియు టోటల్ రెవెన్యూ లెక్కించడం
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '130px' }}>
        <h4>Total Orders</h4>
        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{totalOrders}</p>
      </div>
      <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '130px' }}>
        <h4>Total Revenue</h4>
        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#2e7d32' }}>₹{totalRevenue}</p>
      </div>
      <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', flex: '1', minWidth: '130px' }}>
        <h4>Completed</h4>
        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#ef6c00' }}>{completedOrders}</p>
      </div>
    </div>
  );
};

export default ShopDashboardSummary;