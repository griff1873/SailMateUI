import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { profile, setAuthToken } from '../services/api';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    const { user, getAccessTokenSilently } = useAuth0();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (user && user.email) {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);
                // Try to get profile
                const res = await profile.getByEmail(user.email);
                setProfileData(res.data);
            } catch (error) {
                // If profile doesn't exist, we just leave profileData as null
                // We don't log error here as "profile not found" is a valid state for new users
                setProfileData(null);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user, getAccessTokenSilently]);

    const refreshProfile = async () => {
        await fetchProfile();
    };

    const updateProfileState = (newData) => {
        setProfileData(newData);
    };

    return (
        <ProfileContext.Provider value={{ profileData, loading, refreshProfile, updateProfileState }}>
            {children}
        </ProfileContext.Provider>
    );
};
