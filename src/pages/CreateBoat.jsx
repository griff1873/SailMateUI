import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import { boats, profile, setAuthToken } from '../services/api';

const CreateBoat = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        calendarColor: '#3B82F6', // Default blue
        description: '',
        image: '',
        profileId: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchProfileAndBoat = async () => {
            if (user && user.email) {
                try {
                    const token = await getAccessTokenSilently();
                    setAuthToken(token);

                    // Get Profile ID first (needed for create)
                    const profileRes = await profile.getByEmail(user.email);
                    if (profileRes.data && profileRes.data.id) {
                        setFormData(prev => ({ ...prev, profileId: profileRes.data.id }));

                        // If Edit Mode, fetch boat details
                        if (isEditMode) {
                            const boatRes = await boats.get(id);
                            const boat = boatRes.data;
                            setFormData(prev => ({
                                ...prev,
                                name: boat.name || '',
                                shortName: boat.shortName || '',
                                calendarColor: boat.calendarColor || '#3B82F6',
                                description: boat.description || '',
                                image: boat.image || '',
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };
        fetchProfileAndBoat();
    }, [user, getAccessTokenSilently, id, isEditMode]);

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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Boat Name is required";
        if (!formData.name.trim()) newErrors.name = "Boat Name is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (validateForm()) {
            try {
                const payload = {
                    ...formData,
                    profileId: parseInt(formData.profileId)
                };

                if (isEditMode) {
                    await boats.update(id, payload);
                } else {
                    await boats.create(payload);
                }
                navigate('/');
            } catch (error) {
                console.error("Error saving boat:", error);
                alert("Failed to save boat. Please try again.");
            }
        }
    };

    const InputError = ({ message }) => (
        message ? <p className="text-status-red text-xs mt-1">{message}</p> : null
    );

    return (
        <div className="flex-1">
            <Header title={isEditMode ? "Edit Boat" : "Add New Boat"} />

            <div className="mx-auto max-w-7xl">
                {/* Breadcrumbs */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <a className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal" href="/">Dashboard</a>
                    <span className="text-calm-blue/80 dark:text-vibrant-teal/80 text-sm font-medium leading-normal">/</span>
                    <span className="text-dark-gray dark:text-white text-sm font-medium leading-normal">{isEditMode ? "Edit Boat" : "Add New Boat"}</span>
                </div>

                <div className="space-y-12 mb-20">
                    <div className="bg-white dark:bg-background-dark/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-calm-blue dark:text-vibrant-teal mb-6">Boat Details</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="flex flex-col">
                                    <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Boat Name <span className="text-status-red">*</span></p>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border ${errors.name ? 'border-status-red bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal`}
                                        placeholder="e.g., Sea Breeze"
                                    />
                                    <InputError message={errors.name} />
                                </label>
                            </div>

                            {/* Short Name & Color */}
                            <div className="sm:col-span-1">
                                <label className="flex flex-col">
                                    <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Short Name</p>
                                    <input
                                        name="shortName"
                                        value={formData.shortName}
                                        onChange={handleInputChange}
                                        maxLength={10}
                                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal h-12 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                        placeholder="e.g., SB"
                                    />
                                </label>
                            </div>
                            <div className="sm:col-span-1">
                                <label className="flex flex-col">
                                    <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Calendar Color</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            name="calendarColor"
                                            value={formData.calendarColor}
                                            onChange={handleInputChange}
                                            className="h-12 w-24 p-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formData.calendarColor}</span>
                                    </div>
                                </label>
                            </div>


                            <div>
                                <label className="flex flex-col">
                                    <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Image</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="flex w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-calm-blue hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                                    />
                                    {formData.image && (
                                        <div className="mt-2 relative w-32 h-32">
                                            <img src={formData.image} alt="Boat Preview" className="w-full h-full object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                            >
                                                <span className="material-symbols-outlined text-xs">close</span>
                                            </button>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex flex-col">
                                    <p className="text-sm font-medium leading-normal pb-2 text-skipper-neutral-text dark:text-white">Description</p>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:outline-0 focus:ring-2 focus:ring-vibrant-teal border border-gray-300 dark:border-gray-600 focus:border-vibrant-teal min-h-32 placeholder:text-gray-400 p-3 text-base font-normal leading-normal"
                                    ></textarea>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-4 mt-8">
                            <button
                                onClick={() => navigate('/')}
                                className="px-5 py-2.5 text-sm font-semibold text-dark-gray dark:text-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-calm-blue dark:bg-vibrant-teal dark:text-background-dark rounded-lg hover:bg-calm-blue/90 dark:hover:bg-vibrant-teal/90 shadow-md transition-colors"
                            >
                                {isEditMode ? "Save Changes" : "Add Boat"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBoat;
