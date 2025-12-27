import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";

import { useProfile } from '../../context/ProfileContext';

const Sidebar = () => {
    const { user, logout } = useAuth0();
    const { profileData } = useProfile();

    // Use profile data if available, otherwise fall back to Auth0 user data
    const displayName = profileData?.name || user?.name;
    const displayEmail = profileData?.email || user?.email;
    const displayImage = profileData?.image; // Prefer profile image

    // Calculate initials if no image
    let initials = '';
    if (!displayImage && displayName) {
        const names = displayName.trim().split(' ').filter(n => n.length > 0);
        if (names.length >= 2) {
            initials = `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        } else if (names.length === 1) {
            initials = names[0].slice(0, 2).toUpperCase();
        }
    }

    const navItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/' },
        { name: 'My Boats', icon: 'sailing', path: '/boats' },
        { name: 'Events', icon: 'event', path: '/events' },
        { name: 'Crew', icon: 'group', path: '/crew' },
        { name: 'Settings', icon: 'settings', path: '/settings' },
    ];

    return (
        <aside className="flex-col bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 w-64 p-4 sticky top-0 h-screen hidden lg:flex">
            <div className="flex items-center gap-3 mb-8">
                <div className="text-white bg-skipper-primary p-2 rounded-lg">
                    <span className="material-symbols-outlined !text-2xl">anchor</span>
                </div>
                <h1 className="text-skipper-neutral-text dark:text-white text-xl font-bold leading-normal">SailMate</h1>
            </div>
            <div className="flex flex-col justify-between flex-grow">
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/10 text-skipper-neutral-text dark:text-gray-300'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined !text-xl" style={item.name === 'Dashboard' && item.path === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                            <p className="text-sm font-medium leading-normal">{item.name}</p>
                        </NavLink>
                    ))}
                </nav>
                <div className="flex flex-col gap-4">
                    <NavLink
                        to="/profile"
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                    >
                        {displayImage ? (
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200 dark:border-gray-700"
                                style={{ backgroundImage: `url("${displayImage}")` }}
                            ></div>
                        ) : (
                            <div className="flex items-center justify-center aspect-square rounded-full size-10 bg-skipper-primary text-white text-sm font-bold border border-gray-200 dark:border-gray-700">
                                {initials || <span className="material-symbols-outlined !text-xl">person</span>}
                            </div>
                        )}

                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-skipper-neutral-text dark:text-white text-base font-medium leading-normal truncate group-hover:text-skipper-primary dark:group-hover:text-vibrant-teal transition-colors text-left">{displayName}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal truncate text-left">{displayEmail}</p>
                        </div>
                    </NavLink>
                    <button
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-skipper-neutral-text dark:text-gray-300 w-full text-left"
                    >
                        <span className="material-symbols-outlined !text-xl">logout</span>
                        <p className="text-sm font-medium leading-normal">Log out</p>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
