import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch or update user profile from Supabase DB
  const fetchProfile = async (userId, userEmail) => {
    try {
      if (!userId) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
      }

      // Special rule: hoangkienqg@gmail.com is ALWAYS admin
      if (userEmail === 'hoangkienqg@gmail.com') {
        const adminProfile = {
          id: userId,
          email: userEmail,
          full_name: data?.full_name || 'Quản Trị Viên (Hoàng Kiên)',
          role: 'admin',
          avatar_url: data?.avatar_url || '',
        }
        setProfile(adminProfile)
        
        // If DB role is not admin yet, update it in background
        if (data && data.role !== 'admin') {
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)
        }
        return adminProfile
      }

      if (data) {
        setProfile(data)
        return data
      } else {
        // Fallback profile if trigger hasn't fired yet
        const defaultProfile = {
          id: userId,
          email: userEmail,
          full_name: userEmail?.split('@')[0] || 'Người dùng',
          role: 'student',
        }
        setProfile(defaultProfile)
        return defaultProfile
      }
    } catch (err) {
      console.error('Unexpected profile error:', err)
    }
  }

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email)
      }
      setLoading(false)
    })

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign up action
  const signUp = async ({ email, password, fullName, role = 'student' }) => {
    // Special admin override
    const finalRole = email === 'hoangkienqg@gmail.com' ? 'admin' : role

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: finalRole,
        },
      },
    })

    if (error) throw error

    // Fetch profile if user registered immediately
    if (data?.user) {
      await fetchProfile(data.user.id, data.user.email)
    }

    return data
  }

  // Sign in action
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data?.user) {
      await fetchProfile(data.user.id, data.user.email)
    }

    return data
  }

  // Sign out action
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  // Refresh profile action
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email)
    }
  }

  const role = profile?.role || (user?.email === 'hoangkienqg@gmail.com' ? 'admin' : 'student')

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher' || role === 'admin',
    isStudent: role === 'student',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
