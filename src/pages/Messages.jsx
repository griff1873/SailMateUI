import { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { messages } from '../services/api';
import moment from 'moment';

const Messages = () => {
    const { profileData } = useProfile();
    const [activeTab, setActiveTab] = useState('all');
    const [messageList, setMessageList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [thread, setThread] = useState([]);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Composition State
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [replyBody, setReplyBody] = useState('');

    // Emoji Picker
    const safeEmojis = ['👍', '👎', '😀', '😂', '🙁', '❤️', '🎉', '⛵', '⚓', '🌊', '☀️', '👌'];
    const [showComposeEmoji, setShowComposeEmoji] = useState(false);
    const [showReplyEmoji, setShowReplyEmoji] = useState(false);

    const insertEmoji = (emoji, isReply = false) => {
        if (isReply) {
            setReplyBody(prev => prev + emoji);
            setShowReplyEmoji(false);
        } else {
            setBody(prev => prev + emoji);
            setShowComposeEmoji(false);
        }
    };

    useEffect(() => {
        if (profileData?.id) {
            fetchMessages();
        }
    }, [profileData, activeTab]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await messages.getAll({ profileId: profileData.id, box: 'all' });
            setMessageList(res.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const res = await messages.getRecipients(profileData.id);
            setRecipients(res.data);
        } catch (error) {
            console.error("Error fetching recipients:", error);
        }
    };

    const handleMessageClick = async (messageId) => {
        try {
            const res = await messages.getDetails(messageId, profileData.id);
            console.log("Detail Debug:", {
                myId: profileData.id,
                senderId: res.data.sender?.id,
                recipients: res.data.recipients,
                thread0SenderId: res.data.thread?.[0]?.senderId
            });
            setSelectedMessage(res.data);
            setThread(res.data.thread || []);
            // Update read status in list if applicable
            setMessageList(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
        } catch (error) {
            console.error("Error fetching message details:", error);
        }
    };

    const handleSend = async () => {
        try {
            await messages.send({
                senderProfileId: profileData.id,
                recipientProfileIds: selectedRecipients.map(r => r.id),
                subject,
                body
            });
            setIsComposeOpen(false);
            setSubject('');
            setBody('');
            setSelectedRecipients([]);
            fetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    const handleReply = async () => {
        if (!selectedMessage) return;
        try {
            await messages.reply(selectedMessage.id, {
                senderProfileId: profileData.id,
                body: replyBody
            });
            setReplyBody('');
            // Refresh thread
            handleMessageClick(selectedMessage.id);
        } catch (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send reply");
        }
    };

    const openCompose = () => {
        fetchRecipients();
        setIsComposeOpen(true);
    };

    if (loading && !messageList.length) {
        return <div className="p-8 text-center">Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-skipper-neutral-text dark:text-white">Messages</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your communication with crew and skippers</p>
                </div>
                <button
                    onClick={openCompose}
                    className="flex items-center gap-2 px-4 py-2 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined">edit_square</span>
                    Compose
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Sidebar / List */}
                <div className={`${selectedMessage ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-1/3 border-r border-gray-200 dark:border-gray-700`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">All Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {messageList.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No messages found</div>
                        ) : (
                            messageList.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg.id)}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5' : ''} ${!msg.isRead && msg.type !== 'Sent' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${!msg.isRead && msg.type !== 'Sent' ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {msg.type === 'Sent' ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-xs">arrow_outward</span>
                                                    To: {msg.recipients && msg.recipients.length > 0 ? msg.recipients.map(r => r.id === profileData.id ? 'Me' : r.name).join(', ') : '(No Recipient)'}
                                                </span>
                                            ) : (
                                                msg.sender?.id === profileData.id ? 'Me' : msg.sender?.name
                                            )}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {moment(msg.createdAt).fromNow(true)}
                                        </span>
                                    </div>
                                    <p className={`text-sm font-medium truncate mb-1 ${!msg.isRead && msg.type !== 'Sent' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {msg.subject || '(No Subject)'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                                        {msg.body}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                <div className={`${!selectedMessage ? 'hidden lg:flex items-center justify-center' : 'flex'} flex-col flex-1 bg-gray-50 dark:bg-gray-900/50`}>
                    {!selectedMessage ? (
                        <div className="text-center text-gray-400">
                            <span className="material-symbols-outlined !text-6xl mb-4 text-gray-300">mail</span>
                            <p>Select a message to read</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                <button className="lg:hidden" onClick={() => setSelectedMessage(null)}>
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="text-lg font-bold text-skipper-neutral-text dark:text-white">{selectedMessage.subject}</h2>
                                    <p className="text-sm text-gray-500">
                                        From: {selectedMessage.sender?.id === profileData.id ? 'Me' : selectedMessage.sender?.name} • To: {selectedMessage.recipients?.map(r => r.id === profileData.id ? 'Me' : r.name).join(', ')}
                                    </p>
                                </div>
                            </div>

                            {/* Thread */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {thread.map(msg => (
                                    <div key={msg.id} className={`flex flex-col gap-1 ${msg.senderId === profileData.id ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] rounded-xl p-3 ${msg.senderId === profileData.id ? 'bg-skipper-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none text-gray-800 dark:text-gray-100'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                                            <span>{msg.senderId === profileData.id ? 'Me' : msg.senderName}</span>
                                            <span>•</span>
                                            <span>{moment(msg.createdAt).format('MMM D, h:mm A')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 relative">
                                {showReplyEmoji && (
                                    <div className="absolute bottom-20 left-4 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg p-2 grid grid-cols-6 gap-2 w-64 z-10">
                                        {safeEmojis.map(emoji => (
                                            <button key={emoji} onClick={() => insertEmoji(emoji, true)} className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowReplyEmoji(!showReplyEmoji)}
                                        className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined">sentiment_satisfied</span>
                                    </button>
                                    <textarea
                                        value={replyBody}
                                        onChange={(e) => setReplyBody(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 focus:ring-2 focus:ring-skipper-primary focus:outline-none dark:text-white"
                                        rows="2"
                                    ></textarea>
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyBody.trim()}
                                        className="self-end p-3 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-skipper-neutral-text dark:text-white">New Message</h2>
                            <button onClick={() => setIsComposeOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-skipper-primary focus:outline-none"
                                    onChange={(e) => {
                                        const recipient = recipients.find(r => r.id === parseInt(e.target.value));
                                        if (recipient && !selectedRecipients.find(r => r.id === recipient.id)) {
                                            setSelectedRecipients([...selectedRecipients, recipient]);
                                        }
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">Select a recipient...</option>
                                    {recipients.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedRecipients.map(r => (
                                        <div key={r.id} className="flex items-center gap-1 bg-skipper-primary/10 text-skipper-primary px-2 py-1 rounded-full text-sm">
                                            <span>{r.name}</span>
                                            <button onClick={() => setSelectedRecipients(prev => prev.filter(p => p.id !== r.id))} className="hover:text-red-500">
                                                <span className="material-symbols-outlined !text-sm">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-skipper-primary focus:outline-none"
                                    placeholder="Enter subject"
                                    maxLength={100}
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                {showComposeEmoji && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg p-2 grid grid-cols-6 gap-2 w-64 z-10">
                                        {safeEmojis.map(emoji => (
                                            <button key={emoji} onClick={() => insertEmoji(emoji, false)} className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows="5"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-skipper-primary focus:outline-none resize-none"
                                        placeholder="Type your message..."
                                    ></textarea>
                                    <button
                                        onClick={() => setShowComposeEmoji(!showComposeEmoji)}
                                        className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <span className="material-symbols-outlined">sentiment_satisfied</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                            <button
                                onClick={() => setIsComposeOpen(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={!selectedRecipients.length || !body.trim()}
                                className="px-4 py-2 bg-skipper-primary text-white rounded-lg hover:bg-skipper-primary/90 transition-colors disabled:opacity-50"
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
