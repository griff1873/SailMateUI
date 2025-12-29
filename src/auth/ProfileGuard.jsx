import { useEffect, useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Outlet } from 'react-router-dom';
import { profile, setAuthToken } from '../services/api';

const ProfileGuard = () => {
    const { user, getAccessTokenSilently, isLoading } = useAuth0();
    const [hasProfile, setHasProfile] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkProfile = async () => {
            if (user?.email) {
                try {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);
                    // We use getByEmail to check if the profile exists.
                    // Ideally, the backend returns 200 if found, 404 if not.
                    // If 404, axios throws an error (by default for non-2xx).
                    await profile.getByEmail(user.email);
                    setHasProfile(true);
                } catch (error) {
                    console.log("Profile check failed or not found:", error);
                    setHasProfile(false);
                } finally {
                    setChecking(false);
                }
            } else if (!isLoading && !user) {
                // Not logged in, technically AuthGuard handles this but...
                setChecking(false);
                setHasProfile(false);
            }
        };

        if (!isLoading) {
            checkProfile();
        }
    }, [user, isLoading, getAccessTokenSilently]);

    if (isLoading || checking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-off-white dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm-blue"></div>
            </div>
        );
    }

    if (!hasProfile) {
        return <Navigate to="/profile" replace />;
    }

    return <Outlet />;
};

export default ProfileGuard;
