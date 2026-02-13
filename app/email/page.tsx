'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '../components/AdminLayout';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: 'ti-email', badge: '+99', badgeClass: 'bgc-deep-purple-50 c-deep-purple-700', active: true },
  { id: 'sent', label: 'Sent', icon: 'ti-share', badge: '12', badgeClass: 'bgc-green-50 c-green-700' },
  { id: 'important', label: 'Important', icon: 'ti-star', badge: '3', badgeClass: 'bgc-blue-50 c-blue-700' },
  { id: 'drafts', label: 'Drafts', icon: 'ti-file', badge: '5', badgeClass: 'bgc-amber-50 c-amber-700' },
  { id: 'spam', label: 'Spam', icon: 'ti-alert', badge: '1', badgeClass: 'bgc-red-50 c-red-700' },
  { id: 'trash', label: 'Trash', icon: 'ti-trash', badge: '+99', badgeClass: 'bgc-red-50 c-red-700' },
];

const MOCK_EMAILS = [
  { id: 1, from: 'John Doe', time: '1 min ago', subject: 'title goes here', preview: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' },
  { id: 2, from: 'Jane Smith', time: '5 mins ago', subject: 'Project Update', preview: 'Want to create your own customized data generator for your app...' },
  { id: 3, from: 'Bob Wilson', time: '15 mins ago', subject: 'Meeting tomorrow', preview: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' },
  { id: 4, from: 'Alice Brown', time: '1 hour ago', subject: 'Invoice #1234', preview: 'Please find attached the invoice for this month...' },
  { id: 5, from: 'Charlie Davis', time: '2 hours ago', subject: 'Re: Your request', preview: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' },
  { id: 6, from: 'Diana Evans', time: 'Yesterday', subject: 'Welcome to the team', preview: 'We are excited to have you on board...' },
];

const SELECTED_EMAIL = {
  from: 'John Doe',
  date: 'Nov, 02 2024',
  to: 'email@gmail.com',
  subject: 'Title of this email goes here',
  body: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam`,
};

export default function EmailPage() {
  const [sideActive, setSideActive] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(1); // Default to first email
  const [searchQuery, setSearchQuery] = useState('');

  const handleEmailClick = (id: number) => {
    setSelectedId(id);
    setContentOpen(true);
  };

  const handleBackToMailbox = () => {
    setContentOpen(false);
    setSelectedId(null);
  };

  const filteredEmails = MOCK_EMAILS.filter(
    (e) =>
      e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                      <a
                        href="#"
                        className={`nav-link c-grey-800 cH-blue-500 ${folder.active ? 'actived' : ''}`}
                        onClick={(e) => e.preventDefault()}
                      >
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
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="email-wrapper row remain-height bgc-white ov-h">
            <div className="email-list h-100 layers">
              <div className="layer w-100">
                <div className="bgc-grey-100 peers ai-c jc-sb p-20 fxw-nw">
                  <div className="peer">
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="email-side-toggle d-n@md+ btn bgc-white bdrs-2 mR-3 cur-p"
                        onClick={() => setSideActive(!sideActive)}
                        aria-label="Toggle folders"
                      >
                        <i className="ti-menu" />
                      </button>
                      <button type="button" className="btn bgc-white bdrs-2 mR-3 cur-p" aria-label="Folder">
                        <i className="ti-folder" />
                      </button>
                      <button type="button" className="btn bgc-white bdrs-2 mR-3 cur-p" aria-label="Tag">
                        <i className="ti-tag" />
                      </button>
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className="btn cur-p bgc-white no-after dropdown-toggle"
                          data-bs-toggle="dropdown"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <i className="ti-more-alt" />
                        </button>
                        <ul className="dropdown-menu fsz-sm">
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-trash mR-10" />
                              <span>Delete</span>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-alert mR-10" />
                              <span>Mark as Spam</span>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-star mR-10" />
                              <span>Star</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="peer">
                    <div className="btn-group" role="group">
                      <button type="button" className="fsz-xs btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-angle-left" />
                      </button>
                      <button type="button" className="fsz-xs btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-angle-right" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="layer w-100">
                <div className="bdT bdB">
                  <input
                    type="text"
                    className="form-control m-0 bdw-0 pY-15 pX-20"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="layer w-100 fxg-1 scrollable pos-r">
                <div>
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`email-list-item peers fxw-nw p-20 bdB bgcH-grey-100 cur-p ${selectedId === email.id ? 'bgc-grey-100' : ''}`}
                      onClick={() => handleEmailClick(email.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailClick(email.id)}
                    >
                      <div className="peer mR-10">
                        <div className="checkbox checkbox-circle checkbox-info peers ai-c">
                          <input
                            type="checkbox"
                            id={`email-${email.id}`}
                            name="inputCheckboxesCall"
                            className="peer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label htmlFor={`email-${email.id}`} className="form-label peers peer-greed js-sb ai-c" />
                        </div>
                      </div>
                      <div className="peer peer-greed ov-h">
                        <div className="peers ai-c">
                          <div className="peer peer-greed">
                            <h6>{email.from}</h6>
                          </div>
                          <div className="peer">
                            <small>{email.time}</small>
                          </div>
                        </div>
                        <h5 className="fsz-def tt-c c-grey-900">{email.subject}</h5>
                        <span className="whs-nw w-100 ov-h tov-e d-b">{email.preview}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`email-content h-100 ${contentOpen ? 'open' : ''}`}>
              <div className="h-100 scrollable pos-r">
                <div className="bgc-grey-100 peers ai-c jc-sb p-20 fxw-nw d-n@md+">
                  <div className="peer">
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="back-to-mailbox btn bgc-white bdrs-2 mR-3 cur-p"
                        onClick={handleBackToMailbox}
                        aria-label="Back to list"
                      >
                        <i className="ti-angle-left" />
                      </button>
                      <button type="button" className="btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-folder" />
                      </button>
                      <button type="button" className="btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-tag" />
                      </button>
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className="btn cur-p bgc-white no-after dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti-more-alt" />
                        </button>
                        <ul className="dropdown-menu fsz-sm">
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-trash mR-10" />
                              <span>Delete</span>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-alert mR-10" />
                              <span>Mark as Spam</span>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="d-b td-n pY-5 pX-10 bgcH-grey-100 c-grey-700">
                              <i className="ti-star mR-10" />
                              <span>Star</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="peer">
                    <div className="btn-group" role="group">
                      <button type="button" className="fsz-xs btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-angle-left" />
                      </button>
                      <button type="button" className="fsz-xs btn bgc-white bdrs-2 mR-3 cur-p">
                        <i className="ti-angle-right" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="email-content-wrapper">
                  {selectedId && (
                    <>
                      <div className="peers ai-c jc-sb pX-40 pY-30">
                        <div className="peers peer-greed">
                          <div className="peer mR-20">
                            <Image
                              className="bdrs-50p w-3r h-3r"
                              src="https://randomuser.me/api/portraits/men/11.jpg"
                              alt=""
                              width={48}
                              height={48}
                            />
                          </div>
                          <div className="peer">
                            <small>{SELECTED_EMAIL.date}</small>
                            <h5 className="c-grey-900 mB-5">
                              {MOCK_EMAILS.find((e) => e.id === selectedId)?.from ?? SELECTED_EMAIL.from}
                            </h5>
                            <span>To: {SELECTED_EMAIL.to}</span>
                          </div>
                        </div>
                        <div className="peer">
                          <Link href="/compose" className="btn btn-danger bdrs-50p p-15 lh-0">
                            <i className="ti-back-right" />
                          </Link>
                        </div>
                      </div>
                      <div className="bdT pX-40 pY-30">
                        <h4>{MOCK_EMAILS.find((e) => e.id === selectedId)?.subject ?? SELECTED_EMAIL.subject}</h4>
                        <p style={{ whiteSpace: 'pre-line' }}>{SELECTED_EMAIL.body}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
