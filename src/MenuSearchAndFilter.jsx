import React, { useState } from 'react';

const MenuSearchAndFilter = ({ menuItems, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // కేటగిరీస్ లిస్ట్
  const categories = ['All', 'Veg', 'Non-Veg', 'Tiffins', 'Snacks', 'Beverages'];

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterItems(term, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    filterItems(searchTerm, category);
  };

  const filterItems = (term, category) => {
    let filtered = menuItems.filter(item => 
      item.itemName.toLowerCase().includes(term.toLowerCase())
    );
    if (category !== 'All') {
      filtered = filtered.filter(item => item.category === category);
    }
    onFilterChange(filtered);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* సెర్చ్ బార్ */}
      <input
        type="text"
        placeholder="🔍 Search menu items..."
        value={searchTerm}
        onChange={handleSearch}
        style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' }}
      />

      {/* కేటగిరీ ఫిల్టర్ బటన్స్ */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === cat ? '#ff4757' : '#f1f2f6',
              color: selectedCategory === cat ? '#fff' : '#333',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '500'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuSearchAndFilter;