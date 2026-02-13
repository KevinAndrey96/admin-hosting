'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import AdminLayout from '../components/AdminLayout';

type Status = 'online' | 'away' | 'busy' | 'offline';

const CONTACTS = [
  { id: 1, name: 'John Doe', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', status: 'online' as Status },
  { id: 2, name: 'Moo Doe', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', status: 'away' as Status },
  { id: 3, name: 'Adam Jones', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', status: 'offline' as Status },
  { id: 4, name: 'Mizo Doe', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', status: 'busy' as Status },
  { id: 5, name: 'Jane Smith', avatar: 'https://randomuser.me/api/portraits/women/22.jpg', status: 'online' as Status },
];

const MOCK_MESSAGES: Record<number, Array<{ id: number; text: string; time: string; sent: boolean }>> = {
  1: [
    { id: 1, text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.', time: '10:00 AM', sent: false },
    { id: 2, text: 'Heloo', time: '10:00 AM', sent: true },
    { id: 3, text: 'the printing and typesetting industry.', time: '10:00 AM', sent: false },
    { id: 4, text: '??', time: '10:00 AM', sent: true },
    { id: 5, text: 'Lorem Ipsum has been the industry\'s', time: '10:00 AM', sent: false },
  ],
  2: [
    { id: 1, text: 'Want to create your own customized data generator for your app?', time: '9:30 AM', sent: false },
    { id: 2, text: 'Yes, that would be great! Can you share more details?', time: '9:35 AM', sent: true },
  ],
  3: [
    { id: 1, text: 'Meeting tomorrow at 10am in the main conference room.', time: 'Yesterday', sent: false },
    { id: 2, text: 'Got it, I\'ll be there. Thanks!', time: 'Yesterday', sent: true },
  ],
  4: [
    { id: 1, text: 'Please find the invoice attached for your review.', time: '2 days ago', sent: false },
    { id: 2, text: 'Received, I\'ll process the payment today.', time: '2 days ago', sent: true },
  ],
  5: [
    { id: 1, text: 'Thanks for the update!', time: '11:00 AM', sent: false },
    { id: 2, text: 'You\'re welcome! Let me know if you need anything else.', time: '11:02 AM', sent: true },
  ],
};

const STATUS_CLASS: Record<Status, string> = {
  online: 'c-green-500',
  away: 'c-amber-500',
  busy: 'c-red-500',
  offline: 'c-grey-500',
};

const STATUS_LABEL: Record<Status, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedId, messages]);

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContact = selectedId ? CONTACTS.find((c) => c.id === selectedId) : null;
  const chatMessages = selectedId ? (messages[selectedId] ?? []) : [];
  const currentUserAvatar = 'https://randomuser.me/api/portraits/men/1.jpg';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    const nextId = Math.max(...(messages[selectedId]?.map((m) => m.id) ?? [0]), 0) + 1;
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] ?? []),
        {
          id: nextId,
          text: newMessage.trim(),
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sent: true,
        },
      ],
    }));
    setNewMessage('');
  };

  const handleContactClick = (id: number) => {
    setSelectedId(id);
    setSidebarOpen(false);
  };

  return (
    <AdminLayout hideFooter>
      <div className="full-container chat-page">
        {sidebarOpen && (
          <div
            className="d-n@md+ pos-f t-0 l-0 r-0 b-0"
            style={{ zIndex: 5, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}
        <div className="chat-app">
          <div
            id="chat-sidebar"
            className={sidebarOpen ? 'open' : ''}
          >
            <div className="p-20 bdB">
              <button
                type="button"
                id="chat-sidebar-toggle"
                className="d-n@md+ btn btn-sm bgc-white bd cur-p mB-10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle contacts"
              >
                <i className="ti-menu" />
              </button>
              <input
                type="text"
                name="chatSearch"
                className="form-control"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="scrollable pos-r">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`peers ai-c jc-sb fxw-nw p-20 bdB bgc-white bgcH-grey-50 cur-p ${selectedId === contact.id ? 'bgc-grey-100' : ''}`}
                  onClick={() => handleContactClick(contact.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleContactClick(contact.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="peer mR-15">
                    <div className="pos-r">
                      <Image
                        className="bdrs-50p"
                        src={contact.avatar}
                        alt=""
                        width={40}
                        height={40}
                      />
                      <span
                        className={`pos-a b-0 r-0 bdrs-50p ${STATUS_CLASS[contact.status]}`}
                        style={{
                          width: 10,
                          height: 10,
                          border: '2px solid var(--c-bkg-card)',
                          backgroundColor: 'currentColor',
                        }}
                        title={contact.status}
                      />
                    </div>
                  </div>
                  <div className="peer peer-greed ov-h">
                    <h6 className="mB-0">{contact.name}</h6>
                    <small className={`fsz-sm ${STATUS_CLASS[contact.status]}`}>{STATUS_LABEL[contact.status]}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="chat-box">
            {selectedContact ? (
              <>
                <div className="peers ai-c jc-sb p-20 bdB bgc-white fxw-nw">
                  <div className="peers ai-c peer-greed">
                    <button
                      type="button"
                      className="d-n@md+ btn btn-sm bgc-white bd cur-p mR-10"
                      onClick={() => setSidebarOpen(true)}
                      aria-label="Open contacts"
                    >
                      <i className="ti-angle-left" />
                    </button>
                    <div className="peer mR-15">
                      <Image
                        className="bdrs-50p"
                        src={selectedContact.avatar}
                        alt=""
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="peer">
                      <h6 className="mB-0 c-grey-900 cH-blue-500">{selectedContact.name}</h6>
                      <small className="c-grey-500 fsz-sm d-b">Typing...</small>
                    </div>
                  </div>
                  <div className="peer peers ai-c">
                    <button type="button" className="btn btn-sm bgc-white bd cur-p mR-5" aria-label="Video">
                      <i className="ti-video-camera" />
                    </button>
                    <button type="button" className="btn btn-sm bgc-white bd cur-p mR-5" aria-label="Call">
                      <i className="ti-headphone-alt" />
                    </button>
                    <button type="button" className="btn btn-sm bgc-white bd cur-p dropdown-toggle no-after" data-bs-toggle="dropdown" aria-label="More options">
                      <i className="ti-more-alt" />
                    </button>
                  </div>
                </div>

                <div className="flex-grow-1 ov-a bgc-white chat-messages-area p-20" style={{ minHeight: 0 }}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message-row mB-20 ${msg.sent ? 'chat-message-sent' : 'chat-message-received'}`}
                    >
                      {!msg.sent && (
                        <div className="chat-msg-avatar mR-10">
                          <Image
                            className="bdrs-50p"
                            src={selectedContact!.avatar}
                            alt=""
                            width={36}
                            height={36}
                          />
                          <span className="chat-msg-time">{msg.time}</span>
                        </div>
                      )}
                      <div className="chat-bubble pY-3 pX-10 bdrs-3">
                        <span>{msg.text}</span>
                      </div>
                      {msg.sent && (
                        <div className="chat-msg-avatar mL-10">
                          <Image
                            className="bdrs-50p"
                            src={currentUserAvatar}
                            alt=""
                            width={36}
                            height={36}
                          />
                          <span className="chat-msg-time">{msg.time}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bdT bgc-white p-20">
                  <form onSubmit={handleSend} className="peers ai-c">
                    <div className="peer peer-greed mR-10">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                    </div>
                    <div className="peer">
                      <button type="submit" className="btn btn-primary bdrs-50p p-10 lh-0 cur-p">
                        <i className="ti-location-arrow" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="d-f ai-c jc-c h-100 bgc-grey-200">
                <div className="ta-c c-grey-600">
                  <i className="ti-comment-alt" style={{ fontSize: 48 }} />
                  <p className="mT-20">Select a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
