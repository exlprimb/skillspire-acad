import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '@/types';
import apiClient from '@/lib/axios';

// Tipe untuk data user yang diterima dari Laravel
interface LaravelUser {
  id: number;
  name: string;
  email: string;
  profile: AppUser; // Relasi profile
}

interface AuthContextType {
  user: LaravelUser | null;
  profile: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<LaravelUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    // --- BYPASS LOGIN UNTUK DEVELOPMENT ---
    // Kode ini membuat Anda seolah-olah sudah login sebagai admin.
    // Untuk mengaktifkan kembali sistem login, hapus bagian ini dan
    // aktifkan kembali bagian "KODE ASLI" di bawah.
    console.warn("MODE BYPASS LOGIN AKTIF: Anda otomatis login sebagai Admin Developer.");

    const mockLaravelUser: LaravelUser = {
        id: 1, // ID User palsu
        name: 'Admin Dev',
        email: 'admin.dev@web.com',
        profile: {
            id: 1, // ID Profile palsu
            user_id: 1,
            full_name: 'Admin Developer',
            headline: 'Super Admin',
            bio: 'Akun bypass untuk keperluan development.',
            role: 'admin', // Bisa diganti menjadi 'pengajar' atau 'pelajar' untuk tes
            created_at: new Date().toISOString(),
        }
    };
    setUser(mockLaravelUser);
    setProfile(mockLaravelUser.profile);
    setLoading(false); // Selesai loading dengan data palsu
    // --- AKHIR DARI KODE BYPASS ---


    // --- KODE ASLI (JANGAN HAPUS) ---
    /*
    const fetchUserOnLoad = async () => {
      try {
        const { data } = await apiClient.get('/api/user');
        setUser(data);
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.log('User not authenticated');
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserOnLoad();
    */
  }, []);

  // Fungsi-fungsi lain (signIn, signUp, dll.) tidak perlu diubah
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await apiClient.get('/sanctum/csrf-cookie');
      const { data } = await apiClient.post('/api/register', {
        name: fullName,
        email,
        password,
        password_confirmation: password,
      });
      setUser(data);
      if (data.profile) {
        setProfile(data.profile);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || { message: 'Registration failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await apiClient.get('/sanctum/csrf-cookie');
      const { data } = await apiClient.post('/api/login', {
        email,
        password,
      });
      setUser(data);
      if (data.profile) {
        setProfile(data.profile);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || { message: 'Login failed' } };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post('/api/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return { error: { message: 'No user logged in' } };
    
    try {
      const { data } = await apiClient.put('/api/user/profile', updates);
      setProfile(data);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || { message: 'Update failed' } };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
