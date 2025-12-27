import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import BoatCard from '../components/dashboard/BoatCard';
import { boats as boatsService, events as eventsService, profile, boatCrew, crewEvent, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const Dashboard = () => {
    const { getAccessTokenSilently, user } = useAuth0();
    const { profileData } = useProfile();
    const navigate = useNavigate();

    const [boats, setBoats] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [myEventStatuses, setMyEventStatuses] = useState([]); // Map of eventId -> status
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (profileData && profileData.id) {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);

                // Fetch boats
                const boatsRes = await boatsService.getByProfile(profileData.id);
                setBoats(boatsRes.data);

                // Fetch pending requests
                try {
                    const requestsRes = await boatCrew.getPendingRequests(profileData.id);
                    setPendingRequests(requestsRes.data);
                } catch (err) {
                    console.error("Error fetching pending requests:", err);
                }

                // Fetch upcoming events
                if (boatsRes.data.length > 0) {
                    const boatIds = boatsRes.data.map(b => b.id);
                    try {
                        const eventsRes = await eventsService.getUpcoming({
                            days: 90,
                            boatIds: boatIds
                        });
                        setUpcomingEvents(eventsRes.data);
                    } catch (err) {
                        console.error("Error fetching events:", err);
                    }
                }

                // Fetch my event statuses
                try {
                    const statusRes = await crewEvent.getByProfile(profileData.id);
                    setMyEventStatuses(statusRes.data);
                } catch (err) {
                    console.error("Error fetching event statuses:", err);
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        } else if (profileData === null && user) {
            // Profile failed to load or doesn't exist
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profileData, getAccessTokenSilently]);

    const handleAcceptRequest = async (requestId, boatId, profileId) => {
        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            await boatCrew.update(requestId, {
                boatId: boatId,
                profileId: profileId,
                status: 'A', // Accept
                isAdmin: false
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Failed to accept request.");
        }
    };

    const handleDeclineRequest = async (requestId) => {
        if (confirm("Are you sure you want to decline this request?")) {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);
                await boatCrew.delete(requestId);

                // Refresh data
                fetchData();
            } catch (error) {
                console.error("Error declining request:", error);
                alert("Failed to decline request.");
            }
        }
    };

    const handleEventStatusUpdate = async (eventId, newStatus) => {
        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            const existingStatus = myEventStatuses.find(s => s.eventId === eventId);
            const currentStatusValue = existingStatus ? existingStatus.status : null;

            // Optimistic update for Crew Count
            if (newStatus === 'In' && currentStatusValue !== 'In') {
                // Increment
                setUpcomingEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, crewCount: (parseInt(e.crewCount) || 0) + 1 } : e
                ));
            } else if (currentStatusValue === 'In' && newStatus !== 'In') {
                // Decrement
                setUpcomingEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, crewCount: Math.max(0, (parseInt(e.crewCount) || 0) - 1) } : e
                ));
            }

            // Optimistic update for Button Status
            if (existingStatus) {
                // Update local state immediately
                setMyEventStatuses(prev => prev.map(s => s.eventId === eventId ? { ...s, status: newStatus } : s));

                // Call API
                const res = await crewEvent.update(existingStatus.id, { status: newStatus });
                // Re-sync with server response (optional)
                setMyEventStatuses(prev => prev.map(s => s.id === existingStatus.id ? res.data : s));
            } else {
                // Create - Optimistic update
                // We add a temporary item to the state so the button lights up immediately.
                const tempId = -1 * Date.now(); // Temp ID
                const tempStatus = { id: tempId, eventId, profileId: profileData.id, status: newStatus };

                setMyEventStatuses(prev => [...prev, tempStatus]);

                // Call API
                const payload = {
                    eventId: eventId,
                    profileId: profileData.id,
                    status: newStatus
                };
                const res = await crewEvent.create(payload);

                // Replace temp item with real item
                setMyEventStatuses(prev => prev.map(s => s.id === tempId ? res.data : s));
            }
        } catch (err) {
            console.error("Error updating event status:", err);
            fetchData(); // Fallback
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
            <Header title="Dashboard" showCreateButton={true} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - My Fleet & Upcoming Events */}
                <div className="xl:col-span-2 space-y-8">
                    {/* My Fleet Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-bold text-skipper-neutral-text dark:text-white mr-auto">My Fleet</h2>
                            <button
                                onClick={() => navigate('/boats/search')}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                                title="Find Boats"
                            >
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                            <button
                                onClick={() => navigate('/boats/create')}
                                className="w-8 h-8 rounded-full bg-skipper-primary text-white flex items-center justify-center hover:bg-skipper-primary/90 transition-colors shadow-sm"
                                title="Add New Boat"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>

                        <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
                            {/* Boat Cards */}
                            {boats.map(boat => (
                                <div key={boat.id} className="snap-start shrink-0 w-[300px]">
                                    <BoatCard
                                        boat={boat}
                                        onEdit={(id) => navigate(`/boats/${id}/edit`)}
                                        onDelete={async (id) => {
                                            if (confirm("Are you sure you want to delete this boat?")) {
                                                try {
                                                    const token = await getAccessTokenSilently();
                                                    setAuthToken(token);
                                                    await boatsService.delete(id);
                                                    fetchData(); // Refresh list
                                                } catch (err) {
                                                    console.error("Error deleting boat:", err);
                                                    alert("Failed to delete boat.");
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Upcoming Events Section */}
                    <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm">
                        <h2 className="text-skipper-neutral-text dark:text-gray-200 text-2xl font-bold leading-tight tracking-[-0.015em] mb-4">Upcoming Events</h2>
                        <div className="flex flex-col gap-4">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        <div
                                            onClick={() => navigate(`/events/${event.id}/edit`)}
                                            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            <div className="flex-grow flex items-center gap-3">
                                                {/* Event Boat Initials */}
                                                {(() => {
                                                    const boat = boats.find(b => b.id === event.boatId);
                                                    if (!boat) return null;

                                                    let initial = "";
                                                    if (boat.shortName && boat.shortName.trim().length > 0) {
                                                        initial = boat.shortName.trim().toUpperCase();
                                                    } else {
                                                        const words = (boat.name || '').trim().split(/\s+/);
                                                        initial = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
                                                    }
                                                    if (initial.length === 0) initial = "???";

                                                    return (
                                                        <div
                                                            className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-white dark:border-gray-800 shrink-0"
                                                            style={{ backgroundColor: boat.calendarColor || '#3B82F6' }}
                                                        >
                                                            <span className="text-[10px] font-bold text-white drop-shadow-sm">{initial}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <p className="text-skipper-neutral-text dark:text-white font-semibold hover:text-calm-blue dark:hover:text-vibrant-teal transition-colors">{event.name}</p>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                        {new Date(event.startDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} @ {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-skipper-neutral-text dark:text-gray-300">Crew</p>
                                                    {(() => {
                                                        const confirmed = event.crewCount || 0;
                                                        const min = event.minCrew || 0;
                                                        const desired = event.desiredCrew || 0;
                                                        const max = event.maxCrew || 0;

                                                        // "if values are 0 show counts in blue"
                                                        // Assuming this means if no constraints are set
                                                        const noConstraints = min === 0 && desired === 0 && max === 0;

                                                        let colorClass = "text-skipper-neutral-text dark:text-gray-300"; // Default

                                                        if (noConstraints) {
                                                            colorClass = "text-calm-blue dark:text-vibrant-teal";
                                                        } else if (confirmed < min) {
                                                            colorClass = "text-status-red";
                                                        } else if (confirmed >= desired && (max === 0 || confirmed <= max)) {
                                                            // "Green if between desired and max"
                                                            colorClass = "text-status-green";
                                                        } else {
                                                            // Between min and desired, or over max?
                                                            // If over max, arguably red, but requirements didn't specify.
                                                            // If between min and desired, arguably yellow or default.
                                                            // Let's stick to default or maybe yellow/orange for "warning".
                                                            // Requirement: "red if under min", "green if between desired and max".
                                                            // Implies everything else is default or not mentioned.
                                                            // I'll keep default for now.
                                                        }

                                                        // "total number crew confirmed/desired/max"
                                                        // Update: "for the 2nd the min valu from event"
                                                        // Update: "hover tooltips"
                                                        return (
                                                            <div className={`font-bold ${colorClass} flex justify-end gap-1 cursor-default`}>
                                                                <span title="Confirmed">{confirmed}</span>
                                                                <span>/</span>
                                                                <span title="Min Crew">{min}</span>
                                                                <span>/</span>
                                                                <span title="Max Crew">{max}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="relative flex items-center gap-2">
                                                    {(() => {
                                                        const myStatusObj = myEventStatuses.find(s => s.eventId === event.id);
                                                        const myStatus = myStatusObj ? myStatusObj.status : null;

                                                        return (
                                                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => handleEventStatusUpdate(event.id, 'In')}
                                                                    className={`px-2 py-1 text-xs font-bold rounded ${myStatus === 'In' ? 'bg-status-green text-white shadow-sm' : 'text-gray-500 hover:text-status-green'}`}
                                                                    title="I'm In"
                                                                >
                                                                    In
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEventStatusUpdate(event.id, 'Maybe')}
                                                                    className={`px-2 py-1 text-xs font-bold rounded ${myStatus === 'Maybe' ? 'bg-status-orange text-white shadow-sm' : 'text-gray-500 hover:text-status-orange'}`}
                                                                    title="Maybe"
                                                                >
                                                                    ?
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEventStatusUpdate(event.id, 'Out')}
                                                                    className={`px-2 py-1 text-xs font-bold rounded ${myStatus === 'Out' ? 'bg-status-red text-white shadow-sm' : 'text-gray-500 hover:text-status-red'}`}
                                                                    title="I'm Out"
                                                                >
                                                                    Out
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        {index < upcomingEvents.length - 1 && <hr className="border-gray-100 dark:border-gray-800" />}
                                    </React.Fragment>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No upcoming events found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Pending Crew Requests */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm sticky top-10">
                        <h2 className="text-skipper-neutral-text dark:text-gray-200 text-2xl font-bold leading-tight tracking-[-0.015em] mb-4">Pending Crew Requests</h2>
                        <div className="flex flex-col gap-5">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center p-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">inbox</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No pending requests</p>
                                </div>
                            ) : (
                                pendingRequests.map(request => (
                                    <div key={request.id} className="flex items-start gap-4">
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 mt-1"
                                            style={{ backgroundImage: `url("${request.profile.image || ''}")` }}
                                        >
                                            {!request.profile.image && (
                                                <div className="w-full h-full rounded-full bg-skipper-primary flex items-center justify-center text-white text-xs font-bold">
                                                    {(request.profile.name || '??').substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-skipper-neutral-text dark:text-white font-medium">{request.profile.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Wants to join <span className="font-semibold text-skipper-primary dark:text-primary/90">{request.boat.name}</span></p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id, request.boatId, request.profileId)}
                                                    className="flex-1 text-sm font-bold text-white bg-skipper-success hover:bg-skipper-success/90 h-8 rounded-md transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                    className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 h-8 rounded-md transition-colors"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
