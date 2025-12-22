import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import { boats, eventTypes, events, profile, setAuthToken } from '../services/api';

const CreateEvent = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const { id } = useParams();
    const isEditMode = !!id;

    const [myBoats, setMyBoats] = useState([]);
    const [myEventTypes, setMyEventTypes] = useState([]);

    // Date state for calendar view
    const [viewDate, setViewDate] = useState(new Date());

    // Derived values for render
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth(); // 0-indexed
    const currentDay = new Date().getDate();

    // Helper to get days in current month
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        boatId: '',
        eventTypeId: '',
        minCrew: '',
        desiredCrew: '',
        maxCrew: '',
        location: '',
        description: '',
        startDay: currentDay,
        endDay: currentDay,
        startTime: '09:00',
        endTime: '17:00'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user && user.email) {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);

                    const profileRes = await profile.getByEmail(user.email);
                    if (profileRes.data && profileRes.data.id) {
                        const profileId = profileRes.data.id;

                        // Fetch boats
                        const boatsRes = await boats.getByProfile(profileId);
                        setMyBoats(boatsRes.data);

                        // Fetch event types
                        const eventTypesRes = await eventTypes.getByProfile(profileId);
                        setMyEventTypes(eventTypesRes.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching create event data:", error);
            }
        };

        fetchData();
    }, [user, getAccessTokenSilently]);

    // Fetch Event Details for Edit Mode
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (isEditMode && user) {
                try {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);
                    const res = await events.get(id);
                    const event = res.data;

                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);

                    setViewDate(start);

                    // Attempt to strip "Type: ...\n\n" prefix from description if present
                    let cleanDescription = event.description || '';
                    const typePrefixRegex = /^Type: .*?\n\n/;
                    if (typePrefixRegex.test(cleanDescription)) {
                        cleanDescription = cleanDescription.replace(typePrefixRegex, '');
                    }

                    setFormData({
                        name: event.name || '',
                        boatId: event.boatId,
                        eventTypeId: event.eventTypeId,
                        minCrew: event.minCrew,
                        desiredCrew: event.desiredCrew,
                        maxCrew: event.maxCrew,
                        location: event.location || '',
                        description: cleanDescription,
                        startDay: start.getDate(),
                        endDay: end.getDate(),
                        startTime: start.toTimeString().slice(0, 5),
                        endTime: end.toTimeString().slice(0, 5)
                    });
                } catch (error) {
                    console.error("Error fetching event details:", error);
                }
            }
        };
        fetchEventDetails();
    }, [id, isEditMode, user, getAccessTokenSilently]);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDateSelect = (day) => {
        setFormData(prev => {
            const { startDay, endDay } = prev;
            let newStart = startDay;
            let newEnd = endDay;

            const isRangeSelected = startDay !== endDay;

            if (isRangeSelected) {
                // Reset to single day
                newStart = day;
                newEnd = day;
            } else {
                // Single day currently selected
                if (day > startDay) {
                    newEnd = day;
                } else {
                    newStart = day;
                    newEnd = day;
                }
            }

            return { ...prev, startDay: newStart, endDay: newEnd };
        });

        if (errors.selectedDate) {
            setErrors(prev => ({ ...prev, selectedDate: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Event Name is required";
        if (!formData.boatId) newErrors.boatId = "Please select a boat";
        if (!formData.eventTypeId) newErrors.eventTypeId = "Please select an event type";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.startDay) newErrors.selectedDate = "Please select a date";
        if (!formData.startTime) newErrors.startTime = "Start time is required";

        if (formData.startDay === formData.endDay && formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
            newErrors.endTime = "End time must be after start time";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const navigate = useNavigate();

    const handleSave = async () => {
        if (validateForm()) {


            try {
                // Construct Date objects using dynamic current Year/Month
                const year = currentYear;
                const month = currentMonth;

                // Start Date
                const startDateTime = new Date(year, month, parseInt(formData.startDay));
                const [startHour, startMinute] = formData.startTime.split(':');
                startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

                // End Date
                const endDateTime = new Date(year, month, parseInt(formData.endDay));
                if (formData.endTime) {
                    const [endHour, endMinute] = formData.endTime.split(':');
                    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
                } else {
                    endDateTime.setHours(17, 0);
                }

                // Append Event Type to description
                const selectedType = myEventTypes.find(t => t.id == formData.eventTypeId);
                const typeName = selectedType ? selectedType.name : 'Unknown';
                const finalDescription = `Type: ${typeName}\n\n${formData.description}`;

                const payload = {
                    name: formData.name,
                    description: finalDescription,
                    boatId: parseInt(formData.boatId),
                    eventTypeId: parseInt(formData.eventTypeId),
                    startDate: startDateTime.toISOString(),
                    endDate: endDateTime.toISOString(),
                    location: formData.location,
                    minCrew: formData.minCrew ? parseInt(formData.minCrew) : 0,
                    desiredCrew: formData.desiredCrew ? parseInt(formData.desiredCrew) : 0,
                    maxCrew: formData.maxCrew ? parseInt(formData.maxCrew) : 0,
                    createdById: user.sub
                };

                if (isEditMode) {
                    await events.update(id, payload);
                } else {
                    await events.create(payload);
                }
                navigate('/');
            } catch (error) {
                console.error("Error creating event:", error);
                alert("Failed to create event. Please try again.");
            }
        } else {
            console.log("Validation failed");
        }
    };

    const InputError = ({ message }) => (
        message ? <p className="text-status-red text-xs mt-1">{message}</p> : null
    );

    return (
        <div className="flex-1">
            <Header title={isEditMode ? "Edit Event" : "Create New Event"} />

            <div className="mx-auto max-w-7xl">
                {/* Breadcrumbs */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <a className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal" href="/">Dashboard</a>
                    <span className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal">/</span>
                    <a className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal" href="#">Events</a>
                    <span className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal">/</span>
                    <span className="text-dark-gray dark:text-white text-sm font-medium leading-normal">{isEditMode ? "Edit Event" : "Create New Event"}</span>
                </div>

                <div className="space-y-12 mb-20">
                    {/* Top Row: Details and Dates */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                        {/* Event Details Form */}
                        <div className="lg:col-span-2">
                            <section className="bg-white dark:bg-background-dark/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                                <h2 className="text-xl font-bold text-calm-blue dark:text-vibrant-teal mb-6">Event Details</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Event Name <span className="text-status-red">*</span></p>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.name ? 'border-status-red bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal`}
                                                placeholder="e.g., Sunday Afternoon Race"
                                            />
                                            <InputError message={errors.name} />
                                        </label>
                                    </div>
                                    <div>
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Select Boat <span className="text-status-red">*</span></p>
                                            <select
                                                name="boatId"
                                                value={formData.boatId}
                                                onChange={handleInputChange}
                                                className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.boatId ? 'border-status-red bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal appearance-none bg-no-repeat bg-right`}
                                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAccSzWPW6tVhh_Ktc2Q9jlUqJSt2PJlZl_J2n00uzg6AK12WY_jd7ceSC1cGlyq46WoEwarBw8l3TRvw52ALUfgrH6ymWkmGSNSznJWeZuAWfAf_0SFi3o-8imEBllvdkHYpnpod2Czk0eCd1OUA2Pv1YT8YVySOvKmch5hBXjcAMCt3lGNN_tNQ5OGxK5syAcb6tEyyacTClV3nJDK3fuemmiMXzF-te8Gb9Yp35KPK4RTu2o15nHjbzxn2CbOhxkA57OcZ4x_kk')", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
                                            >
                                                <option value="">Choose a registered boat</option>
                                                {myBoats.map(boat => (
                                                    <option key={boat.id} value={boat.id}>{boat.name}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.boatId} />
                                        </label>
                                    </div>
                                    <div>
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Event Type <span className="text-status-red">*</span></p>
                                            <select
                                                name="eventTypeId"
                                                value={formData.eventTypeId}
                                                onChange={handleInputChange}
                                                className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.eventTypeId ? 'border-status-red bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal appearance-none bg-no-repeat bg-right`}
                                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAccSzWPW6tVhh_Ktc2Q9jlUqJSt2PJlZl_J2n00uzg6AK12WY_jd7ceSC1cGlyq46WoEwarBw8l3TRvw52ALUfgrH6ymWkmGSNSznJWeZuAWfAf_0SFi3o-8imEBllvdkHYpnpod2Czk0eCd1OUA2Pv1YT8YVySOvKmch5hBXjcAMCt3lGNN_tNQ5OGxK5syAcb6tEyyacTClV3nJDK3fuemmiMXzF-te8Gb9Yp35KPK4RTu2o15nHjbzxn2CbOhxkA57OcZ4x_kk')", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
                                            >
                                                <option value="">Choose an event type</option>
                                                {myEventTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.eventTypeId} />
                                        </label>
                                    </div>
                                    <div className="sm:col-span-2 grid grid-cols-3 gap-6">
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Min Crew</p>
                                            <input
                                                name="minCrew" type="number" min="0"
                                                value={formData.minCrew} onChange={handleInputChange}
                                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                                placeholder="0"
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Desired Crew</p>
                                            <input
                                                name="desiredCrew" type="number" min="0"
                                                value={formData.desiredCrew} onChange={handleInputChange}
                                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                                placeholder="0"
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Max Crew</p>
                                            <input
                                                name="maxCrew" type="number" min="0"
                                                value={formData.maxCrew} onChange={handleInputChange}
                                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                                placeholder="0"
                                            />
                                        </label>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Departure Location</p>
                                            <input
                                                name="location"
                                                value={formData.location} onChange={handleInputChange}
                                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                                placeholder="e.g., Marina del Rey"
                                            />
                                        </label>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Event Description & Notes <span className="text-status-red">*</span></p>
                                            <textarea
                                                name="description"
                                                value={formData.description} onChange={handleInputChange}
                                                className={`flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.description ? 'border-status-red bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal min-h-32 placeholder:text-gray-400 p-3 text-base font-normal leading-normal`}
                                                placeholder="Share details about the event, what to bring, and the expected itinerary."
                                            ></textarea>
                                            <InputError message={errors.description} />
                                        </label>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Event Dates (Calendar) */}
                        <div className="lg:col-span-1">
                            <div className="space-y-8 sticky top-8">
                                <section className="bg-white dark:bg-background-dark/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                                    <h2 className="text-xl font-bold text-calm-blue dark:text-vibrant-teal mb-4">Event Dates <span className="text-status-red">*</span></h2>
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between p-1 mb-4">
                                            <button className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2"><span className="material-symbols-outlined">chevron_left</span></button>
                                            <p className="text-base font-bold text-center text-skipper-neutral-text dark:text-white">
                                                {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <button className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2"><span className="material-symbols-outlined">chevron_right</span></button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-y-1 mb-4">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                                <p key={index} className="text-center text-xs font-bold h-10 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">{day}</p>
                                            ))}

                                            {/* Calendar Days */}
                                            {/* Dynamic spacer for start of month */}
                                            <div className={`col-span-${new Date(currentYear, currentMonth, 1).getDay()}`}></div>

                                            {[...Array(daysInCurrentMonth)].map((_, i) => {
                                                const day = i + 1;
                                                // Selection Logic
                                                const isStart = day === formData.startDay;
                                                const isEnd = day === formData.endDay;
                                                const isBetween = day > formData.startDay && day < formData.endDay;
                                                const isSelected = isStart || isEnd || isBetween;

                                                // Dynamic Classes
                                                let buttonClass = "text-skipper-neutral-text dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full";

                                                if (isSelected) {
                                                    if (isStart && isEnd) {
                                                        // Single day selected
                                                        buttonClass = "bg-calm-blue text-white rounded-full";
                                                    } else if (isStart) {
                                                        // Start of range
                                                        buttonClass = "bg-calm-blue text-white rounded-l-full";
                                                    } else if (isEnd) {
                                                        // End of range
                                                        buttonClass = "bg-calm-blue text-white rounded-r-full";
                                                    } else if (isBetween) {
                                                        // Middle of range
                                                        buttonClass = "bg-vibrant-teal/20 text-skipper-neutral-text dark:text-gray-300"; // Rectangular for middle
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => handleDateSelect(day)}
                                                        className={`h-10 w-full text-sm font-medium transition-colors duration-200 ${isSelected && !isStart && !isEnd ? '' : 'rounded-full'}`}
                                                    >
                                                        <div className={`flex size-full items-center justify-center ${isStart && isEnd ? 'rounded-full bg-calm-blue text-white' :
                                                            isStart ? 'rounded-l-full bg-calm-blue text-white' :
                                                                isEnd ? 'rounded-r-full bg-calm-blue text-white' :
                                                                    isBetween ? 'bg-vibrant-teal/20' :
                                                                        'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'
                                                            }`}>
                                                            {day}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.selectedDate} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Start Time <span className="text-status-red">*</span></p>
                                            <input
                                                name="startTime" type="time"
                                                value={formData.startTime} onChange={handleInputChange}
                                                className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.startTime ? 'border-status-red' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal`}
                                            />
                                            <InputError message={errors.startTime} />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">End Time</p>
                                            <input
                                                name="endTime" type="time"
                                                value={formData.endTime} onChange={handleInputChange}
                                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                            />
                                            <InputError message={errors.endTime} />
                                        </label>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-4">
                        <button className="px-5 py-2.5 text-sm font-semibold text-dark-gray dark:text-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-calm-blue dark:bg-vibrant-teal dark:text-background-dark rounded-lg hover:bg-calm-blue/90 dark:hover:bg-vibrant-teal/90 shadow-md transition-colors"
                        >
                            {isEditMode ? "Save Changes" : "Save & Publish Event"}
                        </button>
                    </div>

                    {/* Crew Invitation Section (Full Width) */}
                    <section className="bg-white dark:bg-background-dark/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-calm-blue dark:text-vibrant-teal mb-6">Invite Your Crew</h2>
                        <div className="relative mb-6">
                            <label className="flex flex-col">
                                <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Search Crew Members</p>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                    <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 pl-10 pr-3 py-3 text-base font-normal leading-normal" placeholder="Find crew by name or email..." />
                                </div>
                            </label>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm font-medium leading-normal text-skipper-neutral-text dark:text-white">Invited Crew (3)</p>
                            {/* Crew Member List */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-light-gray/50 dark:bg-background-dark">
                                <div className="flex items-center gap-3">
                                    <img className="h-10 w-10 rounded-full object-cover" alt="Avatar of Alex Johnson" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr87N58VQAKVekSSzJyaScfQvb2cpzSXgZF-RhpHQeSv9JI5KL_F8ZYGT_73v027ZdVBPR-2OfZERsDXgWhh5yVngtA3KQPFxOYK2vmMOSEegPTcJkS6Dr6G6MXc-JesfMPBbcYjZiJLcYbbv5NARk_1zqAElCZBCYcmdp_PetUaEJf6LPZOA4Vyhi9lNsPuNU1J4ItaClEIsUGTo3cGcd_tRRlhKxdODKdLdZdRd4t6tmMPV35iEdgVdCTgis308F-4ibTJcRs7Y" />
                                    <div>
                                        <p className="font-semibold text-skipper-neutral-text dark:text-white">Alex Johnson</p>
                                        <span className="flex items-center gap-1.5 text-xs text-status-green font-medium"><span className="h-2 w-2 rounded-full bg-status-green"></span>Accepted</span>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-status-red dark:text-gray-400 dark:hover:text-status-red"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-light-gray/50 dark:bg-background-dark">
                                <div className="flex items-center gap-3">
                                    <img className="h-10 w-10 rounded-full object-cover" alt="Avatar of Maria Garcia" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEDSRIqnZXr-_PJ_rGm9pFnEpbccJRMBra_usXfaozO8QLqmtEvYNv-idkj166NkQhdSORQjrKDNyWd6brhBGfp6u-Ef_WULrDoCfvACDsSzZAPmjNmVCvFXfLz6s08Ne2RQHiu4vhk-1CfqFqnTNF4k-7QMnaaWevbTH9Vkw9Wo8PT8LnW00CsL7aGrCPHXyR2tOH88Vj2-wSxg6tk69-Po_LRJAE0Zfdiyc1YDcgLTDGxe4N5OqrdvbKajTwPR_wfn-o5A-36Ho" />
                                    <div>
                                        <p className="font-semibold text-skipper-neutral-text dark:text-white">Maria Garcia</p>
                                        <span className="flex items-center gap-1.5 text-xs text-status-orange font-medium"><span className="h-2 w-2 rounded-full bg-status-orange"></span>Invited</span>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-status-red dark:text-gray-400 dark:hover:text-status-red"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-light-gray/50 dark:bg-background-dark">
                                <div className="flex items-center gap-3">
                                    <img className="h-10 w-10 rounded-full object-cover" alt="Avatar of Ben Carter" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2g8tSpIZhGLrHALDTR34URoUp4cA1WzQbjXINdvxZO1y0JJP3Ebzs6bwis3dx6eax_OUiGYo3sI79BWv7YTNyJVa8cVYOiXSuKVhmAVgkZdkb_wNnhME5YEQtlfZ3bMZCGnXJcbURDRySpspa752Mg8i2uOiCKaF5am28vpo7qwmRQyPDMPwOMvX3Lxt1igZCSe53lhi0m-lxVyOyjxi8po23qe_6jammeoZ-NBeiZE29tp3KDa8X12xymCXv93suumIHWURDNLo" />
                                    <div>
                                        <p className="font-semibold text-skipper-neutral-text dark:text-white">Ben Carter</p>
                                        <span className="flex items-center gap-1.5 text-xs text-status-red font-medium"><span className="h-2 w-2 rounded-full bg-status-red"></span>Declined</span>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-status-red dark:text-gray-400 dark:hover:text-status-red"><span className="material-symbols-outlined">close</span></button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
