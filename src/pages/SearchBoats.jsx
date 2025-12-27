import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import { boats, setAuthToken } from '../services/api';

const SearchBoats = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.length >= 3) {
                setLoading(true);
                setHasSearched(true);
                try {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);
                    const res = await boats.searchAll(searchTerm);
                    setResults(res.data);
                } catch (error) {
                    console.error("Error searching boats:", error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setHasSearched(false);
            }
        };

        const timeoutId = setTimeout(() => {
            performSearch();
        }, 300); // Debounce for 300ms

        return () => clearTimeout(timeoutId);
    }, [searchTerm, getAccessTokenSilently]);

    const handleJoinCrew = (boatId) => {
        // Placeholder for join logic
        console.log(`Request to join boat ${boatId}`);
        alert("Join request sent! (Placeholder)");
    };

    return (
        <div className="flex-1">
            <Header title="Find Boats to Crew" />

            <div className="mx-auto max-w-4xl p-6">
                {/* Search Input */}
                <div className="mb-8">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-400 text-2xl">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by boat name (min. 3 characters)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-dark text-lg text-skipper-neutral-text dark:text-white shadow-sm focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-calm-blue"></div>
                    </div>
                )}

                {/* Results List */}
                {!loading && hasSearched && (
                    <div className="flex flex-col gap-4">
                        {results.length > 0 ? (
                            results.map((boat) => (
                                <div key={boat.id} className="bg-white dark:bg-background-dark p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    {/* Boat Image/Icon */}
                                    <div className="shrink-0">
                                        {boat.image ? (
                                            <div
                                                className="w-24 h-24 rounded-lg bg-center bg-cover border border-gray-200 dark:border-gray-700"
                                                style={{ backgroundImage: `url("${boat.image.startsWith('data:') ? boat.image : `data:image/jpeg;base64,${boat.image}`}")` }}
                                            ></div>
                                        ) : (
                                            <div className="w-24 h-24 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                                                <span className="material-symbols-outlined !text-4xl text-blue-300 dark:text-blue-500">sailing</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-skipper-neutral-text dark:text-white mb-1">{boat.name}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{boat.make} {boat.model}</p>
                                        <p className="text-skipper-neutral-text dark:text-gray-300 line-clamp-2">{boat.description || "No description provided."}</p>
                                    </div>

                                    {/* Join Button */}
                                    <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleJoinCrew(boat.id)}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-calm-blue dark:bg-vibrant-teal text-white dark:text-background-dark font-bold rounded-lg hover:bg-calm-blue/90 dark:hover:bg-vibrant-teal/90 transition-colors shadow-md"
                                        >
                                            <span className="material-symbols-outlined !text-xl">group_add</span>
                                            Join Crew
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-background-dark rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <span className="material-symbols-outlined !text-5xl text-gray-300 mb-4">sailing</span>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No boats found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Initial State */}
                {!hasSearched && !loading && (
                    <div className="text-center py-20 opacity-50">
                        <span className="material-symbols-outlined !text-6xl text-gray-300 mb-4">search</span>
                        <p className="text-gray-500">Type at least 3 characters to search for boats</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBoats;
