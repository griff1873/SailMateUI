
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 bg-skipper-neutral-bg dark:bg-background-dark/50 flex flex-col overflow-hidden">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col h-full overflow-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
