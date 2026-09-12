import ShopOrders from './ShopOrders';

function ShopOwnerApp() {
  const shopId = 1; // మీ లాగిన్ అయిన షాప్ ఐడీ ఇక్కడ ఇవ్వండి

  return (
    <div>
      <h1>Shop Owner Dashboard</h1>
      {/* ఇక్కడ లైవ్ ఆర్డర్స్ కాంపోనెంట్ వస్తుంది */}
      <ShopOrders shopId={shopId} />
    </div>
  );
}

export default ShopOwnerApp;