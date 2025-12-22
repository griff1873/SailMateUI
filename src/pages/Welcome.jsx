import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";

const Welcome = () => {
    const { loginWithRedirect } = useAuth0();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
                <div className="text-white bg-skipper-primary p-4 rounded-2xl mb-4">
                    <span className="material-symbols-outlined !text-6xl">anchor</span>
                </div>
                <h1 className="text-4xl font-black text-skipper-primary dark:text-white">SailMate</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    Manage your fleet, crew, and events with ease.
                </p>

                <button
                    onClick={() => loginWithRedirect()}
                    className="w-full py-3 px-6 rounded-xl bg-skipper-primary hover:bg-skipper-primary/90 text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    Log In / Sign Up
                </button>
            </div>
        </div>
    );
};

export default Welcome;
