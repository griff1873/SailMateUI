import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { events as eventsService, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';
import Header from '../components/layout/Header';

const localizer = momentLocalizer(moment);

// Custom 3-Day View
const ThreeDayView = ({ date, localizer, ...props }) => {
    // Logic handled by react-big-calendar, just configuring it below
    return <Views.WEEK {...props} date={date} localizer={localizer} />;
};
ThreeDayView.range = (date, { localizer }) => {
    const start = moment(date); // Ensure moment object
    const end = start.clone().add(2, 'days');
    let current = start.clone();
    const range = [];
    while (current.isSameOrBefore(end)) {
        range.push(current.toDate()); // BigCalendar expects native Date objects in range
        current.add(1, 'day');
    }
    return range;
};
ThreeDayView.title = (date, { localizer }) => {
    const start = moment(date);
    const end = start.clone().add(2, 'days');
    return `${start.format('MMM DD')} - ${end.format('MMM DD')}`;
}

const getContrastText = (hexColor) => {
    if (!hexColor) return 'white';

    // Convert hex to RGB
    let r = 0, g = 0, b = 0;
    if (hexColor.length === 4) {
        r = parseInt("0x" + hexColor[1] + hexColor[1]);
        g = parseInt("0x" + hexColor[2] + hexColor[2]);
        b = parseInt("0x" + hexColor[3] + hexColor[3]);
    } else if (hexColor.length === 7) {
        r = parseInt("0x" + hexColor[1] + hexColor[2]);
        g = parseInt("0x" + hexColor[3] + hexColor[4]);
        b = parseInt("0x" + hexColor[5] + hexColor[6]);
    }

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for bright colors, white for dark colors
    return luminance > 0.5 ? 'black' : 'white';
};


const Calendar = () => {
    const { getAccessTokenSilently } = useAuth0();
    const { profileData } = useProfile();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchEvents = async () => {
            if (profileData && profileData.id) {
                try {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);
                    const res = await eventsService.getMyEvents({ profileId: profileData.id, includePast: true });

                    const mappedEvents = res.data.map(e => ({
                        id: e.id,
                        title: e.name,
                        start: new Date(e.startDate),
                        end: e.endDate ? new Date(e.endDate) : moment(e.startDate).add(2.4, 'hours').toDate(),
                        boatName: e.boat?.name,
                        location: e.location,
                        color: e.calendarColor || e.boat?.calendarColor || '#3B82F6',
                        boatOwnerId: e.boat?.profileId,
                        // Ensure we compare strings to avoid type mismatches
                        isOwner: String(e.boat?.profileId) === String(profileData.id),
                        resource: e
                    }));
                    setEvents(mappedEvents);
                } catch (error) {
                    console.error("Error fetching calendar events:", error);
                } finally {
                    setLoading(false);
                }
            } else if (profileData === null) {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [profileData, getAccessTokenSilently]);



    const { views, defaultView } = useMemo(() => ({
        views: {
            month: true,
            week: true,
            day: true,
            agenda: true,
            threeDay: ThreeDayView // Register custom view
        },
        defaultView: 'month'
    }), []);

    // Workaround to register the custom view title/range properly with BigCalendar
    // Actually, simply passing the specific object structure to `views` prop handles standard views.
    // For custom views like 'threeDay', we might need to map it in the `messages` or just use the button.

    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const onNavigate = (newDate) => {
        setDate(newDate);
    };

    const onView = (newView) => {
        setView(newView);
    };

    // Extract unique boats from events for the legend
    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.color,
            borderRadius: '4px',
            opacity: 0.8,
            color: getContrastText(event.color),
            border: '0px',
            display: 'block'
        };

        // Apply hash pattern for crew assignments (non-owned boats)
        if (!event.isOwner) {
            style.backgroundImage = `repeating-linear-gradient(
                45deg,
                ${event.color},
                ${event.color} 10px,
                ${adjustColor(event.color, -20)} 10px,
                ${adjustColor(event.color, -20)} 20px
            )`;
            // Ensure text is readable over pattern
            style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
            style.color = 'white';
        }

        return { style };
    };

    // Helper to darken/lighten color for the pattern
    const adjustColor = (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    const handleSelectEvent = (event) => {
        navigate(`/events/${event.id}/edit`);
    };

    // Extract unique boats from events for the legend
    const boatLegend = useMemo(() => {
        const boatsMap = new Map();
        events.forEach(event => {
            if (event.boatName && !boatsMap.has(event.boatName)) {
                boatsMap.set(event.boatName, event.color);
            }
        });
        return Array.from(boatsMap, ([name, color]) => ({ name, color }));
    }, [events]);

    // Custom Calendar Toolbar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToCurrent = () => {
            toolbar.onNavigate('TODAY');
        };

        const label = () => {
            const date = moment(toolbar.date);
            if (toolbar.view === 'month') {
                return (
                    <span className="text-xl font-bold dark:text-gray-200">
                        {date.format('MMMM YYYY')}
                    </span>
                );
            } else if (toolbar.view === 'week' || toolbar.view === 'work_week') {
                const start = date.clone().startOf('week');
                const end = date.clone().endOf('week');
                return (
                    <span className="text-xl font-bold dark:text-gray-200">
                        {start.format('MMM D')} - {end.format('MMM D')}
                    </span>
                );
            } else if (toolbar.view === 'day') {
                return (
                    <span className="text-xl font-bold dark:text-gray-200">
                        {date.format('MMMM D, YYYY')}
                    </span>
                );
            } else {
                return (
                    <span className="text-xl font-bold dark:text-gray-200">
                        {date.format('MMMM YYYY')}
                    </span>
                );
            }
        };

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={goToBack}
                            className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                        <button
                            onClick={goToCurrent}
                            className="text-sm font-medium px-3 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                    {label()}
                </div>

                <div className="relative">
                    <select
                        value={toolbar.view}
                        onChange={(e) => toolbar.onView(e.target.value)}
                        className="appearance-none bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-none rounded-lg py-2 pl-4 pr-10 font-medium cursor-pointer focus:ring-2 focus:ring-skipper-primary"
                    >
                        {['month', 'week', 'day', 'agenda'].map(viewName => (
                            <option key={viewName} value={viewName}>
                                {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-calm-blue"></div>
            </div>
        );
    }

    return (
        <div id="calendar-wrapper" className="flex-1 flex flex-col min-h-[90vh]">
            <Header title="Calendar" showCreateButton={true} />
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-col h-[800px] min-h-[800px]">
                    <div className="flex-1 mb-4 h-full">
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', minHeight: '700px' }}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={handleSelectEvent}
                            components={{
                                toolbar: CustomToolbar
                            }}
                            views={{
                                month: true,
                                week: true,
                                day: true,
                                agenda: true
                            }}
                            view={view}
                            onView={onView}
                            date={date}
                            onNavigate={onNavigate}
                        />
                    </div>

                    {/* Boat Color Legend */}
                    {boatLegend.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                            <div className="flex flex-wrap gap-4">
                                {boatLegend.map((boat) => (
                                    <div key={boat.name} className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-sm"
                                            style={{ backgroundColor: boat.color }}
                                        ></div>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{boat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Inject Custom CSS for Calendar Dark Mode support */}
            <style>{`
                /* Base Styles */
                .rbc-calendar { font-family: inherit; }
                
                /* CRITICAL: Force all button-link elements to be light colored in dark mode */
                .dark .rbc-button-link {
                    color: #e5e7eb !important;
                }
                
                #calendar-wrapper .rbc-button-link {
                    color: inherit;
                }
                
                .dark #calendar-wrapper .rbc-button-link {
                    color: #e5e7eb !important;
                }
                
                /* Toolbar */
                .dark .rbc-toolbar button { color: #e5e7eb !important; }
                .dark .rbc-toolbar-label { color: #e5e7eb !important; font-weight: bold; }
                
                /* Headers */
                .dark .rbc-header { 
                    border-bottom-color: #374151; 
                    color: #e5e7eb !important; 
                }
                
                /* Views & Grid */
                .dark .rbc-month-view, 
                .dark .rbc-time-view, 
                .dark .rbc-agenda-view { border-color: #374151; }
                .dark .rbc-off-range-bg { background: #1f2937; }
                .dark .rbc-today { background-color: rgba(255,255,255,0.05); }
                .dark .rbc-day-bg + .rbc-day-bg { border-left-color: #374151; }
                .dark .rbc-month-row + .rbc-month-row { border-top-color: #374151; }
                
                /* Show More Link */
                .dark .rbc-show-more { color: #e5e7eb !important; }
                
                /* Events */
                .dark .rbc-event-content { color: inherit; } 
                .dark .rbc-event { border: none; }
                
                /* Fallback: color the entire calendar */
                .dark .rbc-calendar { color: #e5e7eb !important; }
            `}</style>
        </div>
    );
};

export default Calendar;
