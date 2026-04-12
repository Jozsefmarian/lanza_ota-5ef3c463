export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  preferences?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

// Local storage keys
const USER_KEY = 'wanderlust_user';
const TOKEN_KEY = 'wanderlust_token';
const USERS_DB_KEY = 'wanderlust_users_db';
const WISHLISTS_KEY = 'wanderlust_wishlists';
const BOOKINGS_KEY = 'wanderlust_bookings';
const SEARCHES_KEY = 'wanderlust_searches';

// Simple hash function for demo
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'wanderlust_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateToken(): string {
  return btoa(Date.now().toString() + Math.random().toString(36));
}

// Get users database from localStorage
function getUsersDB(): Record<string, any> {
  const db = localStorage.getItem(USERS_DB_KEY);
  return db ? JSON.parse(db) : {};
}

// Save users database to localStorage
function saveUsersDB(db: Record<string, any>): void {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
}

// Get stored user
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Store user
export function storeUser(user: User, token: string): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

// Clear stored user
export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// Sign up with email/password
export async function signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    // Check if user exists
    const existingUser = Object.values(db).find((u: any) => u.email === email);
    if (existingUser) {
      return { success: false, error: 'User already exists with this email' };
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);
    const token = generateToken();

    const newUser = {
      id,
      email,
      fullName: fullName || email.split('@')[0],
      passwordHash,
      avatarUrl: null,
      phone: null,
      nationality: null,
      createdAt: new Date().toISOString()
    };

    db[id] = newUser;
    saveUsersDB(db);

    const user: User = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      avatarUrl: newUser.avatarUrl || undefined
    };

    storeUser(user, token);

    return {
      success: true,
      user,
      token,
      message: 'Account created successfully'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    const foundUser = Object.values(db).find((u: any) => u.email === email) as any;
    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== foundUser.passwordHash) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = generateToken();

    const user: User = {
      id: foundUser.id,
      email: foundUser.email,
      fullName: foundUser.fullName,
      avatarUrl: foundUser.avatarUrl,
      phone: foundUser.phone,
      nationality: foundUser.nationality
    };

    storeUser(user, token);

    return {
      success: true,
      user,
      token,
      message: 'Login successful'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign in with Google (simulated)
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    // Simulate Google OAuth - create a demo user
    const email = `demo_${Date.now()}@gmail.com`;
    const name = 'Demo User';
    const avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

    let foundUser = Object.values(db).find((u: any) => u.email === email) as any;

    if (!foundUser) {
      const id = generateId();
      foundUser = {
        id,
        email,
        fullName: name,
        passwordHash: '',
        avatarUrl,
        phone: null,
        nationality: null,
        createdAt: new Date().toISOString()
      };
      db[id] = foundUser;
      saveUsersDB(db);
    }

    const token = generateToken();

    const user: User = {
      id: foundUser.id,
      email: foundUser.email,
      fullName: foundUser.fullName,
      avatarUrl: foundUser.avatarUrl
    };

    storeUser(user, token);

    return {
      success: true,
      user,
      token,
      message: 'Google login successful'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign out
export function signOut(): void {
  clearStoredUser();
}

// Forgot password
export async function forgotPassword(email: string): Promise<AuthResponse> {
  // In a real app, this would send an email
  return {
    success: true,
    message: 'If an account exists with this email, a reset link has been sent'
  };
}

// Reset password
export async function resetPassword(email: string, newPassword: string, resetToken: string): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    for (const id in db) {
      if (db[id].email === email) {
        db[id].passwordHash = await hashPassword(newPassword);
        saveUsersDB(db);
        return { success: true, message: 'Password reset successfully' };
      }
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update profile
export async function updateProfile(userId: string, profileData: Partial<User>): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    if (!db[userId]) {
      return { success: false, error: 'User not found' };
    }

    if (profileData.fullName) db[userId].fullName = profileData.fullName;
    if (profileData.phone) db[userId].phone = profileData.phone;
    if (profileData.nationality) db[userId].nationality = profileData.nationality;
    if (profileData.dateOfBirth) db[userId].dateOfBirth = profileData.dateOfBirth;
    if (profileData.avatarUrl) db[userId].avatarUrl = profileData.avatarUrl;

    saveUsersDB(db);

    const user: User = {
      id: db[userId].id,
      email: db[userId].email,
      fullName: db[userId].fullName,
      avatarUrl: db[userId].avatarUrl,
      phone: db[userId].phone,
      nationality: db[userId].nationality
    };

    const token = localStorage.getItem(TOKEN_KEY) || '';
    storeUser(user, token);

    return {
      success: true,
      user,
      message: 'Profile updated successfully'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get profile
export async function getProfile(userId: string): Promise<AuthResponse> {
  try {
    const db = getUsersDB();
    
    if (!db[userId]) {
      return { success: false, error: 'User not found' };
    }

    const u = db[userId];
    return {
      success: true,
      user: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        nationality: u.nationality,
        dateOfBirth: u.dateOfBirth
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Wishlist functions
export async function syncWishlist(userId: string, items: Array<{ type: string; id: number; data: any }>): Promise<void> {
  try {
    const wishlists = JSON.parse(localStorage.getItem(WISHLISTS_KEY) || '{}');
    wishlists[userId] = items;
    localStorage.setItem(WISHLISTS_KEY, JSON.stringify(wishlists));
  } catch (error) {
    console.error('Error syncing wishlist:', error);
  }
}

export async function getWishlist(userId: string): Promise<Array<{ type: string; id: number; data: any }>> {
  try {
    const wishlists = JSON.parse(localStorage.getItem(WISHLISTS_KEY) || '{}');
    return wishlists[userId] || [];
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
}

// Saved searches functions
export async function saveSearch(userId: string, name: string, searchType: string, searchParams: any): Promise<boolean> {
  try {
    const searches = JSON.parse(localStorage.getItem(SEARCHES_KEY) || '{}');
    if (!searches[userId]) searches[userId] = [];
    
    searches[userId].push({
      id: generateId(),
      name,
      search_type: searchType,
      search_params: searchParams,
      created_at: new Date().toISOString()
    });
    
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(searches));
    return true;
  } catch (error) {
    console.error('Error saving search:', error);
    return false;
  }
}

export async function getSavedSearches(userId: string): Promise<any[]> {
  try {
    const searches = JSON.parse(localStorage.getItem(SEARCHES_KEY) || '{}');
    return searches[userId] || [];
  } catch (error) {
    console.error('Error getting saved searches:', error);
    return [];
  }
}

export async function deleteSavedSearch(searchId: string): Promise<boolean> {
  try {
    const searches = JSON.parse(localStorage.getItem(SEARCHES_KEY) || '{}');
    for (const userId in searches) {
      searches[userId] = searches[userId].filter((s: any) => s.id !== searchId);
    }
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(searches));
    return true;
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return false;
  }
}

// Booking history functions
export async function getBookingHistory(userId: string): Promise<any[]> {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}');
    return bookings[userId] || [];
  } catch (error) {
    console.error('Error getting booking history:', error);
    return [];
  }
}

export async function saveBooking(userId: string, booking: any): Promise<boolean> {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}');
    if (!bookings[userId]) bookings[userId] = [];
    
    bookings[userId].push({
      id: generateId(),
      booking_type: booking.type,
      booking_reference: booking.reference || `WL${Date.now().toString(36).toUpperCase()}`,
      item_name: booking.itemName || booking.item?.name || 'Booking',
      item_details: booking.item || booking.itemDetails,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      total_price: booking.totalPrice || booking.item?.price || 0,
      currency: 'USD',
      status: 'confirmed',
      guest_details: booking.guestDetails,
      created_at: new Date().toISOString()
    });
    
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.error('Error saving booking:', error);
    return false;
  }
}
