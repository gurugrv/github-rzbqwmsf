import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AuthError, PostgrestError } from '@supabase/supabase-js'; // Import error types

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createProfile = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: userId, email }]);
      
      if (error) throw error;
    } catch (err) {
      // Type guard for PostgrestError
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('Error creating profile:', (err as PostgrestError).message);
      } else {
        console.error('Error creating profile:', err);
      }
      throw new Error('Failed to create user profile');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;

      // Create profile for the new user
      if (data.user) {
        await createProfile(data.user.id, email);
      }
      
      // On successful signup, redirect to confirmation page
      navigate('/email-confirmation');
    } catch (err) {
      // Type guard for AuthError
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as AuthError).message : 'An error occurred during sign up';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // On successful login, user will be redirected based on App.tsx route config
    } catch (err) {
      // Type guard for AuthError
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as AuthError).message : 'Invalid login credentials';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/signin');
    } catch (err) {
       // Type guard for AuthError
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as AuthError).message : 'Error signing out';
      setError(errorMessage);
      console.error('Signout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      // Type guard for AuthError
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as AuthError).message : 'Error sending password reset email';
      setError(errorMessage);
      console.error('Password reset error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      navigate('/signin');
      return true;
    } catch (err) {
      // Type guard for AuthError
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as AuthError).message : 'Error updating password';
      setError(errorMessage);
      console.error('Password update error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    loading,
    error,
  };
};

export default useAuth;