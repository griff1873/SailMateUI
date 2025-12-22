import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import { boats, events, profile, setAuthToken } from '../services/api';

const Dashboard = () => {
    const { getAccessTokenSilently, user } = useAuth0();
    const navigate = useNavigate();
    const [fleet, setFleet] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchProfileAndBoats = async () => {
            try {
                const token = await getAccessTokenSilently();
                setAuthToken(token);

                if (user && user.email) {
                    // 1. Fetch User Profile by Email
                    const profileRes = await profile.getByEmail(user.email);
                    setUserProfile(profileRes.data);

                    // 2. Fetch Boats if profile exists
                    if (profileRes.data && profileRes.data.id) {
                        const boatsRes = await boats.getByProfile(profileRes.data.id);
                        setFleet(boatsRes.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile or boats:", error);
            }
        };

        fetchProfileAndBoats();
    }, [getAccessTokenSilently, user]);

    // 3. Fetch Upcoming Events when Fleet is loaded
    useEffect(() => {
        const fetchEvents = async () => {
            if (fleet.length > 0) {
                try {
                    const boatIds = fleet.map(b => b.id);
                    const eventsRes = await events.getUpcoming({
                        days: 90,
                        boatIds: boatIds
                    });
                    setUpcomingEvents(eventsRes.data);
                } catch (error) {
                    console.error("Error fetching upcoming events:", error);
                }
            }
        };

        if (fleet.length > 0) {
            fetchEvents();
        }
    }, [fleet]);

    return (
        <>
            <Header title="Skipper Dashboard" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Boats & Upcoming Events Column */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* My Boats Section */}
                    <div>
                        <h2 className="text-skipper-neutral-text dark:text-gray-200 text-2xl font-bold leading-tight tracking-[-0.015em] mb-4">My Fleet</h2>
                        <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2">
                            <div className="flex items-stretch gap-6">
                                {fleet.length > 0 ? (
                                    (() => {
                                        // Calculate unique initials
                                        const seenInitials = {};
                                        return fleet.map((boat) => {
                                            const words = (boat.name || '').trim().split(/\s+/);
                                            let base = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();

                                            if (base.length === 0) base = "???";

                                            let initial = base;
                                            if (seenInitials[base] !== undefined) {
                                                seenInitials[base]++;
                                                initial = `${base}${seenInitials[base]}`;
                                            } else {
                                                seenInitials[base] = 0;
                                            }

                                            return (
                                                <div key={boat.id} className="flex h-full flex-col gap-3 rounded-xl bg-white dark:bg-background-dark shadow-sm min-w-64">
                                                    <div className="relative">
                                                        {boat.image ? (
                                                            <div
                                                                className="w-full bg-center bg-no-repeat aspect-video bg-contain bg-gray-100 dark:bg-gray-800 rounded-t-xl"
                                                                style={{ backgroundImage: `url("${boat.image.startsWith('data:') ? boat.image : `data:image/jpeg;base64,${boat.image}`}")` }}
                                                            ></div>
                                                        ) : (
                                                            <div className="w-full aspect-video bg-blue-100 dark:bg-blue-900/30 rounded-t-xl flex items-center justify-center">
                                                                <span className="material-symbols-outlined !text-6xl text-blue-300 dark:text-blue-500">sailing</span>
                                                            </div>
                                                        )}
                                                        {/* Initials Circle */}
                                                        <div className="absolute top-2 right-2 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md border-2 border-skipper-primary dark:border-vibrant-teal z-10">
                                                            <span className="text-xs font-bold text-skipper-primary dark:text-vibrant-teal">{initial}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col flex-1 justify-between p-4 pt-0">
                                                        <div>
                                                            <p className="text-skipper-neutral-text dark:text-white text-base font-medium leading-normal">{boat.name}</p>
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{boat.make} {boat.model}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/boats/${boat.id}/edit`)}
                                                            className="mt-4 flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-white/10 text-skipper-neutral-text dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                                        >
                                                            <span className="truncate">Manage</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                ) : (
                                    <div className="flex flex-col items-center justify-center min-w-64 p-8 text-center text-gray-500">
                                        <p>No boats found.</p>
                                    </div>
                                )}

                                {/* Add New Boat */}
                                <div
                                    onClick={() => navigate('/boats/create')}
                                    className="flex flex-col items-center justify-center rounded-xl bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-700 min-w-64 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-center size-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 !text-3xl">add</span>
                                    </div>
                                    <p className="text-skipper-neutral-text dark:text-white text-base font-medium leading-normal">Add New Boat</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Upcoming Events Section */}
                    <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm">
                        <h2 className="text-skipper-neutral-text dark:text-gray-200 text-2xl font-bold leading-tight tracking-[-0.015em] mb-4">Upcoming Events</h2>
                        <div className="flex flex-col gap-4">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        <div
                                            onClick={() => navigate(`/events/${event.id}/edit`)} // Using window.location for simplicity, or better hook up useNavigate if accessible. unique to this file structure.
                                            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            <div className="flex-grow">
                                                <p className="text-skipper-neutral-text dark:text-white font-semibold hover:text-calm-blue dark:hover:text-vibrant-teal transition-colors">{event.name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    {new Date(event.startDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} @ {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-skipper-neutral-text dark:text-gray-300">Crew</p>
                                                    <p className="font-bold text-skipper-primary dark:text-primary/90">
                                                        {/* Placeholder for crew count logic if API doesn't provide it yet */}
                                                        {event.crewCount || 0}/{event.maxCrew || event.desiredCrew || '?'} Confirmed
                                                    </p>
                                                </div>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined text-skipper-accent !text-2xl">notification_important</span>
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
                {/* Pending Crew Requests Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm sticky top-10">
                        <h2 className="text-skipper-neutral-text dark:text-gray-200 text-2xl font-bold leading-tight tracking-[-0.015em] mb-4">Pending Crew Requests</h2>
                        <div className="flex flex-col gap-5">
                            {/* Request 1 */}
                            <div className="flex items-start gap-4">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 mt-1"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCXEZZ9n_vm8uhLrKo6qEa0fzXkgqrn3UJ1XpzJaUmdhR3AjOSh_sIr-OTNEztsrb0jbSYQC95GiqqBGe52xS85Xg0m8bEtqok1l-94CMhMchSDUMOc827dnhe6yKB5aGBwO-oj7xYpSgMYHbyeDTlwvXp7aQBWy8upeVZokj4CUVl6gK6xRChzxpv2LdorG3p80FuNqIW1vC7S8jthzXyp1ELZ6gTSSRtEUUkT5NSJR5tFh6rP4ngtmVccjHgT1SwhXHm5RdLy4lk")' }}
                                ></div>
                                <div className="flex-grow">
                                    <p className="text-skipper-neutral-text dark:text-white font-medium">Maya Rodriguez</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Wants to join <span className="font-semibold text-skipper-primary dark:text-primary/90">Sunset Regatta</span></p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button className="flex-1 text-sm font-bold text-white bg-skipper-success hover:bg-skipper-success/90 h-8 rounded-md transition-colors">Approve</button>
                                        <button className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 h-8 rounded-md transition-colors">Decline</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
