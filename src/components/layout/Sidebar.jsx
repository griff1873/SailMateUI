import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";

const Sidebar = () => {
    const { user, logout } = useAuth0();
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
                    <div className="flex items-center gap-3">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                            style={{ backgroundImage: `url("${user?.picture}")` }}
                        ></div>
                        <div className="flex flex-col">
                            <h1 className="text-skipper-neutral-text dark:text-white text-base font-medium leading-normal">{user?.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{user?.email}</p>
                        </div>
                    </div>
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
