import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Heart, Search, Settings, LogOut, MapPin, Plane, Building2, Car, Clock, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { User as UserType, getProfile, updateProfile, signOut, getBookingHistory, getSavedSearches, deleteSavedSearch, getWishlist } from '../lib/auth';
import { images } from '../data/images';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onLogout: () => void;
  onRunSearch: (searchType: string, searchParams: any) => void;
}

type TabType = 'profile' | 'bookings' | 'wishlist' | 'searches' | 'settings';

const UserDashboard: React.FC<UserDashboardProps> = ({ isOpen, onClose, user, onLogout, onRunSearch }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    nationality: user.nationality || '',
    dateOfBirth: user.dateOfBirth || ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserData();
    }
  }, [isOpen, user.id, activeTab]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const data = await getBookingHistory(user.id);
        setBookings(data);
      } else if (activeTab === 'searches') {
        const data = await getSavedSearches(user.id);
        setSavedSearches(data);
      } else if (activeTab === 'wishlist') {
        const data = await getWishlist(user.id);
        // Map wishlist items to actual data
        const items = data.map(item => {
          if (item.type === 'destination') {
            return { ...item, data: images.destinations.find(d => d.id === item.id) || item.data };
          } else if (item.type === 'hotel') {
            return { ...item, data: images.hotels.find(h => h.id === item.id) || item.data };
          }
          return item;
        }).filter(item => item.data);
        setWishlistItems(items);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoading(false);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setSaveMessage('');
    
    const result = await updateProfile(user.id, profileData);
    
    setSaving(false);
    if (result.success) {
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('Failed to update profile');
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    const success = await deleteSavedSearch(searchId);
    if (success) {
      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    }
  };

  const handleRunSearch = (search: any) => {
    onRunSearch(search.search_type, search.search_params);
    onClose();
  };

  const handleLogout = () => {
    signOut();
    onLogout();
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'wishlist' as TabType, label: 'Wishlist', icon: Heart },
    { id: 'searches' as TabType, label: 'Saved Searches', icon: Search },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="w-5 h-5" />;
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.fullName}</h2>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-4 hidden md:block">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </nav>
          </div>

          {/* Mobile Tab Bar */}
          <div className="md:hidden flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 min-w-[70px] ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>
                    
                    {saveMessage && (
                      <div className={`mb-4 p-3 rounded-xl text-sm ${
                        saveMessage.includes('success') 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {saveMessage}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        <input
                          type="text"
                          value={profileData.nationality}
                          onChange={(e) => setProfileData(prev => ({ ...prev, nationality: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="United States"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Booking History</h3>
                    
                    {bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No bookings yet</p>
                        <p className="text-sm text-gray-400 mt-1">Your booking history will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  booking.booking_type === 'hotel' ? 'bg-purple-100 text-purple-600' :
                                  booking.booking_type === 'flight' ? 'bg-pink-100 text-pink-600' :
                                  'bg-orange-100 text-orange-600'
                                }`}>
                                  {getBookingIcon(booking.booking_type)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{booking.item_name}</h4>
                                  <p className="text-sm text-gray-500">Ref: {booking.booking_reference}</p>
                                  {booking.check_in && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {new Date(booking.check_in).toLocaleDateString()} 
                                      {booking.check_out && ` - ${new Date(booking.check_out).toLocaleDateString()}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">${booking.total_price}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">My Wishlist</h3>
                    
                    {wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Your wishlist is empty</p>
                        <p className="text-sm text-gray-400 mt-1">Save destinations and hotels you love</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {wishlistItems.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                            <img
                              src={item.data?.image}
                              alt={item.data?.name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-4">
                              <h4 className="font-bold text-gray-900">{item.data?.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-bold text-purple-600">
                                  ${item.data?.price}
                                </span>
                                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center">
                                  View <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Searches Tab */}
                {activeTab === 'searches' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Saved Searches</h3>
                    
                    {savedSearches.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No saved searches</p>
                        <p className="text-sm text-gray-400 mt-1">Save your searches to quickly find them later</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedSearches.map((search) => (
                          <div key={search.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-all">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                search.search_type === 'hotels' ? 'bg-purple-100 text-purple-600' :
                                search.search_type === 'flights' ? 'bg-pink-100 text-pink-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {search.search_type === 'hotels' ? <Building2 className="w-5 h-5" /> :
                                 search.search_type === 'flights' ? <Plane className="w-5 h-5" /> :
                                 <Car className="w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{search.name}</h4>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(search.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleRunSearch(search)}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all"
                              >
                                Search
                              </button>
                              <button
                                onClick={() => handleDeleteSearch(search.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Account Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Email Notifications</h4>
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm text-gray-600">Booking confirmations</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer mt-3">
                          <span className="text-sm text-gray-600">Price alerts</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer mt-3">
                          <span className="text-sm text-gray-600">Newsletter</span>
                          <input type="checkbox" className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500" />
                        </label>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Currency & Language</h4>
                        <div className="space-y-3">
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>USD - US Dollar</option>
                            <option>EUR - Euro</option>
                            <option>GBP - British Pound</option>
                            <option>JPY - Japanese Yen</option>
                          </select>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-xl p-4">
                        <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                        <p className="text-sm text-red-600 mb-3">Once you delete your account, there is no going back.</p>
                        <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
