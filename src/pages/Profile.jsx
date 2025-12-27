import React, { useEffect, useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import Header from '../components/layout/Header';
import { profile, setAuthToken } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
];

const Profile = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        image: ''
    });



    const { profileData: contextProfile, updateProfileState } = useProfile();

    useEffect(() => {
        if (contextProfile) {
            setProfileData(contextProfile);
            setFormData(prev => ({
                ...prev,
                name: contextProfile.name || '',
                phone: contextProfile.phone || '',
                address: contextProfile.address || '',
                city: contextProfile.city || '',
                state: contextProfile.state || '',
                zip: contextProfile.zip || '',
                image: contextProfile.image || ''
            }));
            setLoading(false);
        } else if (contextProfile === null && user) {
            // Profile doesn't exist yet, but context is loaded
            setProfileData(null);
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
            }));
            setIsEditing(true);
            setLoading(false);
        }
    }, [contextProfile, user]);

    // Format phone number
    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)})${phoneNumber.slice(3)}`;
        }
        return `(${phoneNumber.slice(0, 3)})${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    };

    const handleInputChange = (e) => {
        let { name, value } = e.target;

        if (name === 'phone') {
            value = formatPhoneNumber(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
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

    const handleSave = async () => {
        try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);

            if (profileData && profileData.id) {
                const payload = { ...profileData, ...formData };
                await profile.update(profileData.id, payload);
                setProfileData(payload);
                updateProfileState(payload); // Update global context
            } else {
                // Create new profile
                const payload = { ...formData, email: user.email, LoginId: user.sub };
                const res = await profile.create(payload);
                setProfileData(res.data);
                updateProfileState(res.data); // Update global context
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating/creating profile:", error);
            alert("Failed to save profile.");
        }
    };

    const handleCancel = () => {
        if (profileData) {
            setFormData({
                name: profileData.name || '',
                phone: profileData.phone || '',
                address: profileData.address || '',
                city: profileData.city || '',
                state: profileData.state || '',
                zip: profileData.zip || '',
                image: profileData.image || ''
            });
        }
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-calm-blue"></div>
            </div>
        );
    }

    const displayImage = formData.image || user?.picture;
    const displayName = formData.name || user?.name;

    let initials = '';
    if (displayName) {
        const names = displayName.trim().split(' ').filter(n => n.length > 0);
        if (names.length >= 2) {
            initials = `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        } else if (names.length === 1) {
            initials = names[0].slice(0, 2).toUpperCase();
        }
    }

    return (
        <div className="flex-1">
            <Header title="My Profile" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-8">
                        <div className="relative flex justify-between items-start mb-6">

                            {/* Profile Image - Always visible, but input only in edit mode */}
                            <div className="mr-6 shrink-0 relative">
                                <div
                                    className={`w-24 h-24 rounded-full bg-cover bg-center border-2 border-white dark:border-background-dark shadow-md flex items-center justify-center ${!displayImage ? 'bg-skipper-primary text-white' : ''}`}
                                    style={displayImage ? {
                                        backgroundImage: `url("${displayImage}")`,
                                        backgroundColor: '#f3f4f6'
                                    } : {}}
                                >
                                    {!displayImage && (
                                        <span className="text-3xl font-bold">
                                            {initials || <span className="material-symbols-outlined !text-4xl text-white">person</span>}
                                        </span>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="absolute -bottom-2 -right-2">
                                        <label htmlFor="image-upload" className="cursor-pointer bg-calm-blue dark:bg-vibrant-teal text-white p-2 rounded-full shadow-lg hover:bg-calm-blue/90 dark:hover:bg-vibrant-teal/90 transition-colors">
                                            <span className="material-symbols-outlined !text-lg">photo_camera</span>
                                        </label>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 flex-grow">
                                <div>
                                    {!isEditing ? (
                                        <h2 className="text-2xl font-bold text-skipper-neutral-text dark:text-white">{profileData?.name}</h2>
                                    ) : (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                    <p className="text-gray-500 dark:text-gray-400">{profileData?.email || user?.email}</p>
                                </div>

                                {(profileData || isEditing) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                                />
                                            ) : (
                                                <p className="text-skipper-neutral-text dark:text-white font-medium">{formatPhoneNumber(profileData.phone) || 'Not provided'}</p>
                                            )}
                                        </div>

                                        {/* Address */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Address</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                                />
                                            ) : (
                                                <p className="text-skipper-neutral-text dark:text-white leading-relaxed">{profileData.address || 'No address provided.'}</p>
                                            )}
                                        </div>

                                        {/* City */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                                />
                                            ) : (
                                                <p className="text-skipper-neutral-text dark:text-white font-medium">{profileData.city || 'Not provided'}</p>
                                            )}
                                        </div>

                                        {/* State & Zip */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">State(2)</label>
                                                {isEditing ? (
                                                    <select
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                                    >
                                                        <option value="">Select State</option>
                                                        {US_STATES.map((state) => (
                                                            <option key={state.value} value={state.value}>
                                                                {state.value} - {state.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-skipper-neutral-text dark:text-white font-medium">{profileData.state || '--'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Zip(5)</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="zip"
                                                        value={formData.zip}
                                                        onChange={handleInputChange}
                                                        maxLength={5}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-light-gray dark:bg-background-dark text-dark-gray dark:text-white focus:ring-2 focus:ring-vibrant-teal focus:border-vibrant-teal outline-none transition-all"
                                                    />
                                                ) : (
                                                    <p className="text-skipper-neutral-text dark:text-white font-medium">{profileData.zip || '--'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 ml-4">
                                <div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => {
                                                setFormData({
                                                    name: profileData.name || '',
                                                    phone: formatPhoneNumber(profileData.phone) || '',
                                                    address: profileData.address || '',
                                                    city: profileData.city || '',
                                                    state: profileData.state || '',
                                                    zip: profileData.zip || '',
                                                    image: profileData.image || ''
                                                });
                                                setIsEditing(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <span className="material-symbols-outlined !text-xl">edit</span>
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                    {isEditing && (
                        <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 p-8">
                            {profileData && (
                                <button
                                    onClick={handleCancel}
                                    className="px-5 py-2.5 text-sm font-semibold text-dark-gray dark:text-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-calm-blue dark:bg-vibrant-teal dark:text-background-dark rounded-lg hover:bg-calm-blue/90 dark:hover:bg-vibrant-teal/90 shadow-md transition-colors"
                            >
                                {profileData ? 'Save Changes' : 'Create Profile'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
