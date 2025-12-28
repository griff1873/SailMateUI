import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";

const Header = ({ title, showCreateButton = false, rightAction = null }) => {
    const { user } = useAuth0();
    return (
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h1 className="text-skipper-primary dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{title}</h1>
            {showCreateButton && (
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
            )}
            {rightAction && (
                <div className="flex items-center gap-4">
                    {rightAction}
                </div>
            )}
        </header>
    );
};

export default Header;
