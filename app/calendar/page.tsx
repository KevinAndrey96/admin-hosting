'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '../components/AdminLayout';

const CalendarClient = dynamic(
  () => import('../components/CalendarClient').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="d-f ai-c jc-c p-40" style={{ minHeight: 400 }}><span className="c-grey-600">Cargando calendario...</span></div> }
);

const SAMPLE_EVENTS = [
  { title: 'All Day Event', date: 'Nov 01', desc: 'Website Development' },
  { title: 'All Day Event', date: 'Nov 01', desc: 'Website Development' },
  { title: 'All Day Event', date: 'Nov 01', desc: 'Website Development' },
  { title: 'All Day Event', date: 'Nov 01', desc: 'Website Development' },
];

export default function CalendarPage() {
  const [showModal, setShowModal] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[viewDate.getDay()];
  const dayNum = viewDate.getDate();
  const suffix = dayNum === 1 || dayNum === 21 || dayNum === 31 ? 'st' : dayNum === 2 || dayNum === 22 ? 'nd' : dayNum === 3 || dayNum === 23 ? 'rd' : 'th';

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-4">
            <div className="bdrs-3 ov-h bgc-white bd">
              <div className="bgc-deep-purple-500 ta-c p-30">
                <h1 className="fw-300 mB-5 lh-1 c-white">
                  {String(dayNum).padStart(2, '0')}
                  <span className="fsz-def">{suffix}</span>
                </h1>
                <h3 className="c-white">{dayName}</h3>
              </div>
              <div className="pos-r">
                <button
                  type="button"
                  className="mT-nv-50 pos-a r-10 t-2 btn cur-p bdrs-50p p-0 w-3r h-3r btn-warning"
                  onClick={() => setShowModal(true)}
                  aria-label="Add event"
                >
                  <i className="ti-plus" />
                </button>
                <ul className="m-0 p-0 mT-20">
                  {SAMPLE_EVENTS.map((evt, i) => (
                    <li key={i} className="bdB peers ai-c jc-sb fxw-nw">
                      <a
                        href="#"
                        className="td-n p-20 peers fxw-nw me-20 peer-greed c-grey-900"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowModal(true);
                        }}
                      >
                        <div className="peer mR-15">
                          <i className="ti-calendar c-red-500" />
                        </div>
                        <div className="peer">
                          <span className="fw-600">{evt.title}</span>
                          <div className="c-grey-600">
                            <span className="c-grey-700">{evt.date} - </span>
                            <i>{evt.desc}</i>
                          </div>
                        </div>
                      </a>
                      <div className="peers mR-15">
                        <div className="peer">
                          <a href="#" className="td-n c-deep-purple-500 cH-blue-500 fsz-md p-5" onClick={(e) => e.preventDefault()}>
                            <i className="ti-pencil" />
                          </a>
                        </div>
                        <div className="peer">
                          <a href="#" className="td-n c-red-500 cH-blue-500 fsz-md p-5" onClick={(e) => e.preventDefault()}>
                            <i className="ti-trash" />
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <div id="calendar" className="fc-calendar-wrapper">
              <CalendarClient onDatesSet={(arg) => setViewDate(arg.view.currentStart)} />
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="bd p-15">
                  <h5 className="m-0">Add Event</h5>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShowModal(false);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label fw-500">Event title</label>
                      <input className="form-control bdc-grey-200" placeholder="Event title" />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="fw-500 form-label">Start</label>
                        <div className="input-group mb-3">
                          <span className="input-group-text bgc-white bd bdwR-0">
                            <i className="ti-calendar" />
                          </span>
                          <input type="date" className="form-control bdc-grey-200" placeholder="Start Date" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="fw-500 form-label">End</label>
                        <div className="input-group mb-3">
                          <span className="input-group-text bgc-white bd bdwR-0">
                            <i className="ti-calendar" />
                          </span>
                          <input type="date" className="form-control bdc-grey-200" placeholder="End Date" />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="fw-500 form-label">Description</label>
                      <textarea className="form-control bdc-grey-200" rows={5} placeholder="Description" />
                    </div>
                    <div className="text-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary cur-p btn-color">
                        Done
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
