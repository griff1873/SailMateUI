import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import BoatCard from '../components/dashboard/BoatCard';
import { boats as boatsService, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const MyBoats = () => {
    const { getAccessTokenSilently, user } = useAuth0();
    const { profileData } = useProfile();
    const navigate = useNavigate();

    const [ownedBoats, setOwnedBoats] = useState([]);
    const [crewBoats, setCrewBoats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBoats = async () => {
        if (profileData && profileData.id) {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);

                const res = await boatsService.getByProfile(profileData.id);
                const allBoats = res.data || [];

                // Filter owned boats
                const owned = allBoats.filter(b => b.profileId === profileData.id);
                // Filter crew boats (the API implementation of getByProfile merges them, so we filter by exclusion of ownership)
                const crew = allBoats.filter(b => b.profileId !== profileData.id);

                setOwnedBoats(owned);
                setCrewBoats(crew);
            } catch (error) {
                console.error("Error fetching boats:", error);
            } finally {
                setLoading(false);
            }
        } else if (profileData === null && user) {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoats();
    }, [profileData, getAccessTokenSilently]);

    const handleCrewColorChange = async (boatId, newColor) => {
        // Optimistic update
        setCrewBoats(prev => prev.map(b => b.id === boatId ? { ...b, calendarColor: newColor } : b));
        setOwnedBoats(prev => prev.map(b => b.id === boatId ? { ...b, calendarColor: newColor } : b));

        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);
            await boatsService.setCrewColor(boatId, {
                profileId: profileData.id,
                color: newColor
            });
        } catch (error) {
            console.error("Error setting crew color:", error);
            fetchBoats(); // Revert on failure
            alert("Failed to update color.");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-calm-blue"></div>
            </div>
        );
    }

    return (
        <>
            <Header title="My Boats" />
            <div className="p-8 space-y-8">
                {/* Header Actions */}
                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={() => navigate('/boats/search')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        <span className="material-symbols-outlined">search</span>
                        Find Boats
                    </button>
                    <button
                        onClick={() => navigate('/boats/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 transition-colors font-medium shadow-sm"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add New Boat
                    </button>
                </div>

                {/* My Fleet Section */}
                <section>
                    <h2 className="text-2xl font-bold text-skipper-neutral-text dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">My Fleet</h2>
                    {ownedBoats.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {ownedBoats.map(boat => (
                                <BoatCard
                                    key={boat.id}
                                    boat={boat}
                                    isOwner={true}
                                    onColorChange={handleCrewColorChange}
                                    onEdit={(id) => navigate(`/boats/${id}/edit`)}
                                    onDelete={async (id) => {
                                        if (confirm("Are you sure you want to delete this boat?")) {
                                            try {
                                                const token = await getAccessTokenSilently();
                                                setAuthToken(token);
                                                await boatsService.delete(id);
                                                fetchBoats();
                                            } catch (err) {
                                                console.error("Error deleting boat:", err);
                                                alert("Failed to delete boat.");
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">sailing</span>
                            <p className="text-gray-500 dark:text-gray-400">You don't own any boats yet.</p>
                        </div>
                    )}
                </section>

                {/* Crew Boats Section */}
                <section>
                    <h2 className="text-2xl font-bold text-skipper-neutral-text dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">Boats I'm Crew On</h2>
                    {crewBoats.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {crewBoats.map(boat => (
                                <BoatCard
                                    key={boat.id}
                                    boat={boat}
                                    isOwner={false}
                                    onColorChange={handleCrewColorChange}
                                    // Crew cannot edit/delete boat typically, logic handled in BoatCard or here
                                    // Passing dummy handlers or handled within BoatCard if isOwner is false
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">group</span>
                            <p className="text-gray-500 dark:text-gray-400">You haven't joined any crews yet.</p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default MyBoats;
