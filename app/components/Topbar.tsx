'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '../hooks/useTheme';

type HeaderDropdown = 'notifications' | 'emails' | 'user' | null;

export default function Topbar() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [searchActive, setSearchActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<HeaderDropdown>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchActive((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return next;
    });
  };

  const toggleHeaderDropdown = (id: HeaderDropdown) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleSidebarToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    document.body.classList.toggle('is-collapsed');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sidebar:toggle', {
        detail: { collapsed: document.body.classList.contains('is-collapsed') },
      }));
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!searchActive && !target.closest('.search-box') && !target.closest('.search-input')) {
        setSearchActive(false);
      }
      if (!target.closest('.nav-right .dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchActive]);

  return (
    <div className="header navbar">
      <div className="header-container">
        <ul className="nav-left">
          <li>
            <a id="sidebar-toggle" className="sidebar-toggle" href="#" aria-label="Toggle sidebar" onClick={handleSidebarToggle}>
              <i className="ti-menu" />
            </a>
          </li>
          <li className={`search-box ${searchActive ? 'active' : ''}`}>
            <a className="search-toggle no-pdd-right" href="#" aria-label="Search" onClick={handleSearchToggle}>
              <i className="search-icon ti-search pdd-right-10" />
              <i className="search-icon-close ti-close pdd-right-10" />
            </a>
          </li>
          <li className={`search-input ${searchActive ? 'active' : ''}`}>
            <input ref={searchInputRef} className="form-control" type="text" placeholder="Search..." />
          </li>
        </ul>
        <ul className="nav-right">
          <li className={`notifications dropdown ${openDropdown === 'notifications' ? 'show' : ''}`}>
            <span className="counter bgc-red">3</span>
            <a href="#" className="dropdown-toggle no-after" onClick={toggleHeaderDropdown('notifications')} role="button" aria-expanded={openDropdown === 'notifications'}>
              <i className="ti-bell" />
            </a>
            <ul className={`dropdown-menu ${openDropdown === 'notifications' ? 'show' : ''}`}>
              <li className="pX-20 pY-15 bdB">
                <i className="ti-bell pR-10" />
                <span className="fsz-sm fw-600 c-grey-900">Notifications</span>
              </li>
              <li>
                <ul className="ovY-a pos-r scrollable lis-n p-0 m-0 fsz-sm">
                  <li>
                    <a href="#" className="peers fxw-nw td-n p-20 bdB c-grey-800 cH-blue bgcH-grey-100">
                      <div className="peer mR-15">
                        <Image className="w-3r bdrs-50p" src="https://randomuser.me/api/portraits/men/1.jpg" alt="" width={48} height={48} />
                      </div>
                      <div className="peer peer-greed">
                        <span>
                          <span className="fw-500">John Doe</span>
                          <span className="c-grey-600"> liked your post</span>
                        </span>
                        <p className="m-0"><small className="fsz-xs">5 mins ago</small></p>
                      </div>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="pX-20 pY-15 ta-c bdT">
                <span>
                  <a href="#" className="c-grey-600 cH-blue fsz-sm td-n">View All Notifications <i className="ti-angle-right fsz-xs mL-10" /></a>
                </span>
              </li>
            </ul>
          </li>
          <li className={`notifications dropdown ${openDropdown === 'emails' ? 'show' : ''}`}>
            <span className="counter bgc-blue">3</span>
            <a href="#" className="dropdown-toggle no-after" onClick={toggleHeaderDropdown('emails')} role="button" aria-expanded={openDropdown === 'emails'}>
              <i className="ti-email" />
            </a>
            <ul className={`dropdown-menu ${openDropdown === 'emails' ? 'show' : ''}`}>
              <li className="pX-20 pY-15 bdB">
                <i className="ti-email pR-10" />
                <span className="fsz-sm fw-600 c-grey-900">Emails</span>
              </li>
              <li>
                <ul className="ovY-a pos-r scrollable lis-n p-0 m-0 fsz-sm">
                  <li>
                    <a href="#" className="peers fxw-nw td-n p-20 bdB c-grey-800 cH-blue bgcH-grey-100">
                      <div className="peer mR-15">
                        <Image className="w-3r bdrs-50p" src="https://randomuser.me/api/portraits/men/1.jpg" alt="" width={48} height={48} />
                      </div>
                      <div className="peer peer-greed">
                        <div>
                          <div className="peers jc-sb fxw-nw mB-5">
                            <div className="peer"><p className="fw-500 mB-0">John Doe</p></div>
                            <div className="peer"><small className="fsz-xs">5 mins ago</small></div>
                          </div>
                          <span className="c-grey-600 fsz-sm">Want to create your own customized data generator...</span>
                        </div>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="peers fxw-nw td-n p-20 bdB c-grey-800 cH-blue bgcH-grey-100">
                      <div className="peer mR-15">
                        <Image className="w-3r bdrs-50p" src="https://randomuser.me/api/portraits/men/2.jpg" alt="" width={48} height={48} />
                      </div>
                      <div className="peer peer-greed">
                        <div>
                          <div className="peers jc-sb fxw-nw mB-5">
                            <div className="peer"><p className="fw-500 mB-0">Moo Doe</p></div>
                            <div className="peer"><small className="fsz-xs">15 mins ago</small></div>
                          </div>
                          <span className="c-grey-600 fsz-sm">Want to create your own customized data generator...</span>
                        </div>
                      </div>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="pX-20 pY-15 ta-c bdT">
                <span>
                  <a href="#" className="c-grey-600 cH-blue fsz-sm td-n">View All Email <i className="ti-angle-right fsz-xs mL-10" /></a>
                </span>
              </li>
            </ul>
          </li>
          <li className="theme-toggle d-flex ai-c">
            {mounted && (
              <div className="form-check form-switch d-flex ai-c" style={{ margin: 0, padding: 0 }} role="group" aria-label="Theme switcher">
                <label className="form-check-label me-2 text-nowrap c-grey-700" htmlFor="theme-toggle" style={{ fontSize: '12px', marginRight: '8px' }}>
                  <i className="ti-sun" aria-hidden style={{ marginRight: '4px' }} />
                  <span className="theme-label">Light</span>
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="theme-toggle"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  aria-label="Toggle dark mode"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  style={{ margin: 0 }}
                />
                <label className="form-check-label ms-2 text-nowrap c-grey-700" htmlFor="theme-toggle" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  <span className="theme-label">Dark</span>
                  <i className="ti-moon" aria-hidden style={{ marginLeft: '4px' }} />
                </label>
              </div>
            )}
          </li>
          <li className={`dropdown ${openDropdown === 'user' ? 'show' : ''}`}>
            <a href="#" className="dropdown-toggle no-after peers fxw-nw ai-c lh-1" onClick={toggleHeaderDropdown('user')} role="button" aria-expanded={openDropdown === 'user'}>
              <div className="peer mR-10">
                <Image className="w-2r bdrs-50p" src="https://randomuser.me/api/portraits/men/10.jpg" alt="" width={32} height={32} />
              </div>
              <div className="peer">
                <span className="fsz-sm c-grey-900">John Doe</span>
              </div>
            </a>
            <ul className={`dropdown-menu fsz-sm ${openDropdown === 'user' ? 'show' : ''}`}>
              <li>
                <a href="#" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                  <i className="ti-settings mR-10" />
                  <span>Setting</span>
                </a>
              </li>
              <li>
                <a href="#" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                  <i className="ti-user mR-10" />
                  <span>Profile</span>
                </a>
              </li>
              <li>
                <a href="#" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                  <i className="ti-email mR-10" />
                  <span>Messages</span>
                </a>
              </li>
              <li role="separator" className="divider" />
              <li>
                <a href="#" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                  <i className="ti-power-off mR-10" />
                  <span>Logout</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
