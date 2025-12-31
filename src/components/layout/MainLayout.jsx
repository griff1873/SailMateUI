import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                ></div>
            )}

            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            <main className="flex-1 p-6 lg:p-10 bg-skipper-neutral-bg dark:bg-background-dark/50 flex flex-col overflow-hidden relative">
                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300 lg:hidden z-30"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col h-full overflow-hidden mt-8 lg:mt-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
