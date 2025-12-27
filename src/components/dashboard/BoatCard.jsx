import React from 'react';

const BoatCard = ({ boat, onEdit, onDelete }) => {
    let initial = "";
    if (boat.shortName && boat.shortName.trim().length > 0) {
        initial = boat.shortName.trim().toUpperCase();
    } else {
        const words = (boat.name || '').trim().split(/\s+/);
        initial = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    }
    if (initial.length === 0) initial = "???";

    return (
        <div className="flex h-full flex-col gap-3 rounded-xl bg-white dark:bg-background-dark shadow-sm min-w-64">
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
            </div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-2">
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-800 shrink-0"
                        style={{ backgroundColor: boat.calendarColor || '#3B82F6' }}
                    >
                        <span className="text-xs font-bold text-white drop-shadow-sm">{initial}</span>
                    </div>
                    <div>
                        <p className="text-skipper-neutral-text dark:text-white text-base font-medium leading-normal">{boat.name}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{boat.make} {boat.model}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <button
                        onClick={() => onEdit(boat.id)}
                        className="flex-1 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-white/10 text-skipper-neutral-text dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                        <span className="truncate">Manage</span>
                    </button>
                    <button
                        onClick={() => onDelete(boat.id)}
                        className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BoatCard;
