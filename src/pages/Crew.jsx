import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { boatCrew, boats, profile, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';
import { useAuth0 } from "@auth0/auth0-react";

const Crew = () => {
    const { getAccessTokenSilently } = useAuth0();
    const { profileData } = useProfile();
    const [crewList, setCrewList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Invite State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // User to invite
    const [myBoats, setMyBoats] = useState([]); // List of boats I can invite to
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchCrew = async () => {
        if (!profileData) return;

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            // Fetch My Crew (people on my boats)
            const res = await boatCrew.getMyCrew(profileData.id);
            setCrewList(res.data);

            // Fetch My Boats (for invite dropdown)
            const boatsRes = await boats.getByProfile(profileData.id);
            setMyBoats(boatsRes.data);

        } catch (error) {
            console.error("Error fetching crew:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrew();
    }, [profileData]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);
            const res = await profile.search(searchQuery);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Error searching profiles:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const openSafeInvite = (user) => {
        setSelectedUser(user);
        setIsInviteModalOpen(true);
    };

    const handleInvite = async (boatId) => {
        if (!selectedUser || !boatId) return;

        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            await boatCrew.create({
                profileId: selectedUser.id,
                boatId: parseInt(boatId),
                status: 'I', // Invited
                isAdmin: false
            });

            alert(`Invited ${selectedUser.name}!`);
            setIsInviteModalOpen(false);
            setSelectedUser(null);
            // Refresh list to show them as invited (if supported by backend query)
            fetchCrew();
        } catch (error) {
            console.error("Error inviting user:", error);
            alert("Failed to invite user. They might already be on the crew.");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-calm-blue"></div>
            </div>
        );
    }

    // Group by boat
    const groupedCrew = crewList.reduce((acc, item) => {
        const boatName = item.boat?.name || 'Unknown Boat';
        if (!acc[boatName]) acc[boatName] = [];
        acc[boatName].push(item);
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-8 relative">
            <Header
                title="My Crew"
                rightAction={
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">search</span>
                        <span>Find Crew</span>
                    </button>
                }
            />

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-background-dark rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-skipper-neutral-text dark:text-white">Find Crew</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark focus:ring-2 focus:ring-skipper-primary outline-none text-skipper-neutral-text dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-4 py-2 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 disabled:opacity-50"
                                >
                                    {isSearching ? '...' : 'Search'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {searchResults.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    {isSearching ? 'Searching...' : 'No results found.'}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700 shrink-0"
                                                    style={{ backgroundImage: user.image ? `url("${user.image}")` : 'none', backgroundColor: user.image ? 'transparent' : '#eee' }}
                                                >
                                                    {!user.image && (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                            {(user.name || '?').substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-skipper-neutral-text dark:text-white">{user.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openSafeInvite(user)}
                                                className="px-3 py-1 text-sm font-bold text-skipper-primary hover:bg-skipper-primary/10 rounded transition-colors"
                                            >
                                                Invite
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal - Select Boat */}
            {isInviteModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-background-dark rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-skipper-neutral-text dark:text-white mb-2">Invite to Boat</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Select a boat to invite <strong>{selectedUser.name}</strong> to:</p>

                        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mb-4">
                            {myBoats.length === 0 ? (
                                <p className="text-red-500">You don't have any boats to invite people to.</p>
                            ) : (
                                myBoats.map(boat => (
                                    <button
                                        key={boat.id}
                                        onClick={() => handleInvite(boat.id)}
                                        className="text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-skipper-primary hover:bg-skipper-primary/5 transition-all flex items-center gap-3"
                                    >
                                        <span className="material-symbols-outlined text-gray-400">sailing</span>
                                        <span className="font-medium text-skipper-neutral-text dark:text-white">{boat.name}</span>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => { setIsInviteModalOpen(false); setSelectedUser(null); }}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {Object.keys(groupedCrew).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <span className="material-symbols-outlined !text-6xl text-gray-300 dark:text-gray-600 mb-4">group_off</span>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No crew members found.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {Object.entries(groupedCrew).map(([boatName, members]) => {
                        const boat = members[0]?.boat;
                        let initial = "";
                        if (boat) {
                            if (boat.shortName && boat.shortName.trim().length > 0) {
                                initial = boat.shortName.trim().toUpperCase();
                            } else {
                                const words = (boat.name || '').trim().split(/\s+/);
                                initial = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
                            }
                            if (initial.length === 0) initial = "???";
                        }

                        return (
                            <div key={boatName} className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5">
                                    <h2 className="text-lg font-bold text-skipper-neutral-text dark:text-white flex items-center gap-2">
                                        {boat?.image ? (
                                            <div
                                                className="w-8 h-8 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                                                style={{ backgroundImage: `url("${boat.image.startsWith('data:') ? boat.image : `data:image/jpeg;base64,${boat.image}`}")` }}
                                            ></div>
                                        ) : (
                                            <div
                                                className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-white dark:border-gray-800 shrink-0"
                                                style={{ backgroundColor: boat?.calendarColor || '#3B82F6' }}
                                            >
                                                <span className="text-[10px] font-bold text-white drop-shadow-sm">{initial}</span>
                                            </div>
                                        )}
                                        {boatName}
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {members.map((member) => (
                                        <Link key={member.id} to={`/profile/${member.profileId}`} className="block p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {member.profile?.image ? (
                                                        <div
                                                            className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                                                            style={{ backgroundImage: `url("${member.profile.image}")` }}
                                                        ></div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-skipper-primary text-white flex items-center justify-center font-bold text-sm">
                                                            {(member.profile?.name || '?').substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {member.isAdmin && (
                                                        <span className="absolute -bottom-1 -right-1 bg-skipper-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-900">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-skipper-neutral-text dark:text-white group-hover:text-skipper-primary dark:group-hover:text-vibrant-teal transition-colors">{member.profile?.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.profile?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${member.status === 'A'
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50'
                                                    : member.status === 'P'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50'
                                                        : member.status === 'I'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                    {member.status === 'A' ? 'Active' : member.status === 'P' ? 'Pending' : member.status === 'I' ? 'Invited' : member.status}
                                                </div>
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-skipper-primary dark:group-hover:text-vibrant-teal transition-colors">chevron_right</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Crew;
