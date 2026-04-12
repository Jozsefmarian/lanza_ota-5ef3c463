import React, { useState } from 'react';
import { X, Star, SlidersHorizontal } from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    priceRange: [number, number];
    starRating: number[];
    amenities: string[];
    categories: string[];
  };
  onFilterChange: (filters: any) => void;
  type: 'destinations' | 'hotels' | 'flights' | 'cars';
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  type
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const amenityOptions = ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Beach', 'Parking', 'Pet Friendly'];
  const categoryOptions = ['Beach', 'City', 'Nature', 'Adventure', 'Luxury'];

  const handlePriceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...localFilters.priceRange] as [number, number];
    newRange[index] = value;
    setLocalFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  const toggleStarRating = (star: number) => {
    const newRatings = localFilters.starRating.includes(star)
      ? localFilters.starRating.filter(s => s !== star)
      : [...localFilters.starRating, star];
    setLocalFilters(prev => ({ ...prev, starRating: newRatings }));
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    setLocalFilters(prev => ({ ...prev, amenities: newAmenities }));
  };

  const toggleCategory = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter(c => c !== category)
      : [...localFilters.categories, category];
    setLocalFilters(prev => ({ ...prev, categories: newCategories }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilters = {
      priceRange: [0, 2000] as [number, number],
      starRating: [],
      amenities: [],
      categories: []
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 left-0 h-full lg:h-auto w-80 bg-white shadow-xl lg:shadow-lg rounded-none lg:rounded-2xl z-50 lg:z-auto transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Price Range */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Max"
                />
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                value={localFilters.priceRange[1]}
                onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          {/* Star Rating */}
          {(type === 'hotels' || type === 'destinations') && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Star Rating</h4>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    onClick={() => toggleStarRating(star)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                      localFilters.starRating.includes(star)
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${localFilters.starRating.includes(star) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{star}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {type === 'destinations' && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category.toLowerCase())}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      localFilters.categories.includes(category.toLowerCase())
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {type === 'hotels' && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
              <div className="grid grid-cols-2 gap-2">
                {amenityOptions.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={applyFilters}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset All
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
