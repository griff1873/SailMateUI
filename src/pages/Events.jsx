import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
// Header import removed as we are implementing custom header for this layout
import { events as eventsService, crewEvent, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const Events = () => {
    const { getAccessTokenSilently, user } = useAuth0();
    const { profileData } = useProfile();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPast, setShowPast] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (profileData && profileData.id) {
                try {
                    setLoading(true);
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);

                    const res = await eventsService.getMyEvents({
                        profileId: profileData.id,
                        includePast: showPast
                    });
                    setEvents(res.data);
                } catch (error) {
                    console.error("Error fetching events:", error);
                } finally {
                    setLoading(false);
                }
            } else if (profileData === null && user) {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [profileData, getAccessTokenSilently, showPast]);

    const handleEventStatusUpdate = async (event, newStatus, e) => {
        if (e) e.stopPropagation(); // Prevent card click

        // Handle potential casing issues from API (MyCrewEventId vs myCrewEventId)
        const existingCrewEventId = event.myCrewEventId || event.MyCrewEventId;

        console.log("DEBUG: Status Update", {
            eventId: event.id,
            existingCrewEventId,
            rawMyCrewEventId: event.myCrewEventId,
            rawMyCrewEventIdPascal: event.MyCrewEventId,
            newStatus
        });

        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            const currentStatus = event.myStatus;

            // Optimistic Update
            setEvents(prev => prev.map(ev => {
                if (ev.id === event.id) {
                    let newCrewCount = ev.crewCount || 0;
                    if (newStatus === 'In' && currentStatus !== 'In') {
                        newCrewCount++;
                    } else if (currentStatus === 'In' && newStatus !== 'In') {
                        newCrewCount = Math.max(0, newCrewCount - 1);
                    }
                    return { ...ev, myStatus: newStatus, crewCount: newCrewCount };
                }
                return ev;
            }));

            if (existingCrewEventId) {
                console.log("DEBUG: Updating existing CrewEvent", existingCrewEventId);
                // Update existing
                await crewEvent.update(existingCrewEventId, { status: newStatus });
            } else {
                console.log("DEBUG: Creating new CrewEvent");
                // Create new
                const res = await crewEvent.create({
                    eventId: event.id,
                    profileId: profileData.id,
                    status: newStatus
                });
                console.log("DEBUG: Created CrewEvent", res.data);

                // Update state with new ID to prevent multiple creates
                setEvents(prev => prev.map(ev =>
                    ev.id === event.id ? { ...ev, myCrewEventId: res.data.id } : ev
                ));
            }
        } catch (err) {
            console.error("Error updating status:", err);
            // Revert could be implemented here by re-fetching
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
        <div className="flex-1">
            <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-skipper-primary dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Events</h1>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-skipper-neutral-text dark:text-gray-300 select-none">
                        <input
                            type="checkbox"
                            checked={showPast}
                            onChange={(e) => setShowPast(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-calm-blue focus:ring-calm-blue"
                        />
                        Show Past Events
                    </label>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative text-gray-600 dark:text-gray-300 hover:text-skipper-primary dark:hover:text-white">
                        <span className="material-symbols-outlined !text-2xl">notifications</span>
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-skipper-accent ring-2 ring-white dark:ring-background-dark"></span>
                    </button>
                    <Link to="/events/create" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-skipper-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-skipper-primary/90 transition-colors">
                        <span className="material-symbols-outlined !text-xl mr-2">add</span>
                        <span className="truncate">Create New Event</span>
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-4">
                    {events.length > 0 ? (
                        events.map((event) => {
                            const eventDate = new Date(event.startDate);
                            const isPast = eventDate < new Date();

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => navigate(`/events/${event.id}/edit`)}
                                    className={`bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-transparent hover:border-calm-blue/30 dark:hover:border-vibrant-teal/30 transition-all cursor-pointer flex flex-col md:flex-row gap-6 ${isPast ? 'opacity-75 grayscale-[0.3]' : ''}`}
                                >
                                    {/* Date Block */}
                                    <div className="flex flex-row md:flex-col items-center justify-center bg-gray-50 dark:bg-white/5 rounded-lg p-4 min-w-[100px] gap-2 md:gap-0">
                                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {eventDate.toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-3xl font-black text-skipper-neutral-text dark:text-white leading-none">
                                            {eventDate.getDate()}
                                        </span>
                                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                                            {eventDate.toLocaleString('default', { weekday: 'short' })}
                                        </span>
                                    </div>

                                    {/* Event Info */}
                                    <div className="flex-1 flex flex-col justify-center gap-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-skipper-neutral-text dark:text-white line-clamp-1">
                                                {event.name}
                                            </h3>

                                            {/* Status Buttons */}
                                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleEventStatusUpdate(event, 'In', e)}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${event.myStatus === 'In' ? 'bg-status-green text-white shadow-sm' : 'text-gray-500 hover:text-status-green'}`}
                                                    title="I'm In"
                                                >
                                                    In
                                                </button>
                                                <button
                                                    onClick={(e) => handleEventStatusUpdate(event, 'Maybe', e)}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${event.myStatus === 'Maybe' ? 'bg-status-orange text-white shadow-sm' : 'text-gray-500 hover:text-status-orange'}`}
                                                    title="Maybe"
                                                >
                                                    ?
                                                </button>
                                                <button
                                                    onClick={(e) => handleEventStatusUpdate(event, 'Out', e)}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${event.myStatus === 'Out' ? 'bg-status-red text-white shadow-sm' : 'text-gray-500 hover:text-status-red'}`}
                                                    title="I'm Out"
                                                >
                                                    Out
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px]">sailing</span>
                                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/10 px-2 py-0.5 rounded">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: event.calendarColor || event.boat?.calendarColor || '#3B82F6' }}
                                                    ></div>
                                                    <span className="font-medium">
                                                        {event.boat?.name || 'Unknown Boat'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                                                <span>
                                                    {eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                                            {event.location || 'TBD'}
                                        </div>
                                    </div>

                                    {/* Crew Stats (Vertical) */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-center gap-4 md:gap-1 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                                        <div className="flex flex-col items-center md:items-end">
                                            <span className="text-2xl font-bold text-calm-blue dark:text-vibrant-teal">
                                                {(event.crewCount || 0)} <span className="text-sm font-normal text-gray-400">/ {(event.minCrew || 0)}</span>
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirmed</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-background-dark rounded-xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-gray-400">event_busy</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">No Events Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                {showPast ? "You haven't participated in any past events." : "You have no upcoming events scheduled. Create one or wait for an invitation!"}
                            </p>
                            {!showPast && (
                                <button
                                    onClick={() => navigate('/events/create')}
                                    className="mt-6 px-4 py-2 bg-calm-blue text-white rounded-lg hover:bg-calm-blue/90 shadow-sm font-bold text-sm transition-colors"
                                >
                                    Create Event
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Events;
