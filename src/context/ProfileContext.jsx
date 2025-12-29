import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { boatCrew, boats, profile, setAuthToken } from '../services/api';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    const { user, getAccessTokenSilently } = useAuth0();
    const [profileData, setProfileData] = useState(null);
    const [ownedBoats, setOwnedBoats] = useState([]);
    const [isBoatAdmin, setIsBoatAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (user && user.email) {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);
                // Try to get profile
                const res = await profile.getByEmail(user.email);
                setProfileData(res.data);

                // Fetch boats and crew status if profile exists
                if (res.data?.id) {
                    try {
                        const [ownedRes, crewRes] = await Promise.all([
                            boats.getByProfile(res.data.id),
                            boatCrew.getByProfile(res.data.id)
                        ]);

                        const ownedRaw = ownedRes.data || [];
                        // GetBoatsByProfile returns both owned and crew boats. We need to filter for actual ownership.
                        const owned = ownedRaw.filter(b => b.profileId === res.data.id);

                        const crew = crewRes.data || [];
                        // Filter out crew memberships for deleted boats
                        const activeAvailableCrew = crew.filter(c => c.boat && !c.boat.isDeleted);
                        const adminCrew = activeAvailableCrew.filter(c => c.isAdmin && !c.isDeleted && c.status === 'A');

                        console.log("DEBUG ProfileContext:");
                        console.log("Owned Boats Count (Filtered):", owned.length);
                        if (owned.length > 0) console.log("Owned Boat Names:", owned.map(b => b.name));

                        console.log("All Crew Memberships:", crew);
                        console.log("Active Available Crew:", activeAvailableCrew);
                        console.log("Admin Crew Count (Accepted & Active Boat):", adminCrew.length);
                        if (adminCrew.length > 0) console.log("Admin Crew Boat IDs:", adminCrew.map(c => c.boatId));

                        console.log("Is Boat Admin:", owned.length > 0 || adminCrew.length > 0);

                        setOwnedBoats(owned);
                        setIsBoatAdmin(owned.length > 0 || adminCrew.length > 0);
                    } catch (err) {
                        console.error('Error fetching boat/crew data:', err);
                        setOwnedBoats([]);
                        setIsBoatAdmin(false);
                    }
                }
            } catch (error) {
                // If profile doesn't exist, we just leave profileData as null
                setProfileData(null);
                setOwnedBoats([]);
                setIsBoatAdmin(false);
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
        <ProfileContext.Provider value={{ profileData, ownedBoats, isBoatAdmin, loading, refreshProfile, updateProfileState }}>
            {children}
        </ProfileContext.Provider>
    );
};
