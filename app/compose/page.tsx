'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: 'ti-email', badge: '+99', badgeClass: 'bgc-deep-purple-50 c-deep-purple-700' },
  { id: 'sent', label: 'Sent', icon: 'ti-share', badge: '12', badgeClass: 'bgc-green-50 c-green-700' },
  { id: 'important', label: 'Important', icon: 'ti-star', badge: '3', badgeClass: 'bgc-blue-50 c-blue-700' },
  { id: 'drafts', label: 'Drafts', icon: 'ti-file', badge: '5', badgeClass: 'bgc-amber-50 c-amber-700' },
  { id: 'spam', label: 'Spam', icon: 'ti-alert', badge: '1', badgeClass: 'bgc-red-50 c-red-700' },
  { id: 'trash', label: 'Trash', icon: 'ti-trash', badge: '+99', badgeClass: 'bgc-red-50 c-red-700' },
];

export default function ComposePage() {
  const router = useRouter();
  const [sideActive, setSideActive] = useState(false);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: redirect to email inbox
    router.push('/email');
  };

  return (
    <AdminLayout>
      <div className="full-container">
        <div className={`email-app ${sideActive ? 'side-active' : ''}`}>
          <div className="email-side-nav remain-height ov-h">
            <div className="h-100 layers">
              <div className="p-20 bgc-grey-100 layer w-100">
                <Link href="/compose" className="btn btn-danger d-grid">
                  New Message
                </Link>
              </div>
              <div className="scrollable pos-r bdT layer w-100 fxg-1">
                <ul className="p-20 nav flex-column">
                  {FOLDERS.map((folder) => (
                    <li key={folder.id} className="nav-item">
                      {folder.id === 'inbox' ? (
                        <Link href="/email" className="nav-link c-grey-800 cH-blue-500">
                          <div className="peers ai-c jc-sb">
                            <div className="peer peer-greed">
                              <i className={`mR-10 ${folder.icon}`} />
                              <span>{folder.label}</span>
                            </div>
                            <div className="peer">
                              <span className={`badge rounded-pill ${folder.badgeClass}`}>{folder.badge}</span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <a href="#" className="nav-link c-grey-800 cH-blue-500" onClick={(e) => e.preventDefault()}>
                          <div className="peers ai-c jc-sb">
                            <div className="peer peer-greed">
                              <i className={`mR-10 ${folder.icon}`} />
                              <span>{folder.label}</span>
                            </div>
                            <div className="peer">
                              <span className={`badge rounded-pill ${folder.badgeClass}`}>{folder.badge}</span>
                            </div>
                          </div>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="email-wrapper row remain-height pos-r scrollable bgc-white">
            <div className="email-content open no-inbox-view">
              <div className="email-compose">
                <div className="d-n@md+ p-20">
                  <button
                    type="button"
                    className="email-side-toggle c-grey-900 cH-blue-500 td-n bgc-transparent bdw-0 cur-p"
                    onClick={() => setSideActive(!sideActive)}
                  >
                    <i className="ti-menu" />
                  </button>
                </div>
                <form className="email-compose-body" onSubmit={handleSubmit}>
                  <h4 className="c-grey-900 mB-20">Send Message</h4>
                  <div className="send-header">
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="CC"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Email Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <textarea
                        name="compose"
                        className="form-control"
                        placeholder="Say Hi..."
                        rows={10}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-end mrg-top-30">
                    <button type="submit" className="btn btn-danger btn-color">
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
