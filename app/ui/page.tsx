'use client';

import { useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import MasonryInit from '../components/MasonryInit';

export default function UIPage() {
  useEffect(() => {
    const tooltips: { dispose: () => void }[] = [];
    const popovers: { dispose: () => void }[] = [];

    const initBootstrap = async () => {
      const bootstrap = await import('bootstrap');
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
        tooltips.push(new bootstrap.Tooltip(el));
      });
      document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
        popovers.push(new bootstrap.Popover(el));
      });
    };
    initBootstrap();

    return () => {
      tooltips.forEach((t) => t.dispose());
      popovers.forEach((p) => p.dispose());
    };
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <MasonryInit />
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">UI Elements</h4>
          </div>
        </div>

        <div className="row gap-20 masonry pos-r">
          <div className="masonry-sizer col-md-6" />

          {/* Alerts */}
          <div className="masonry-item col-12">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Alerts</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f fxd-c gap-10">
                    <div className="alert alert-primary mB-0" role="alert">This is a primary alert—check it out!</div>
                    <div className="alert alert-secondary mB-0" role="alert">This is a secondary alert—check it out!</div>
                    <div className="alert alert-success mB-0" role="alert">This is a success alert—check it out!</div>
                    <div className="alert alert-danger mB-0" role="alert">This is a danger alert—check it out!</div>
                    <div className="alert alert-warning mB-0" role="alert">This is a warning alert—check it out!</div>
                    <div className="alert alert-info mB-0" role="alert">This is a info alert—check it out!</div>
                    <div className="alert alert-light mB-0" role="alert">This is a light alert—check it out!</div>
                    <div className="alert alert-dark mB-0" role="alert">This is a dark alert—check it out!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="masonry-item col-12">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Buttons</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f fxw-w gap-10 mB-10">
                    <button type="button" className="btn btn-primary">Primary</button>
                    <button type="button" className="btn btn-secondary">Secondary</button>
                    <button type="button" className="btn btn-success">Success</button>
                    <button type="button" className="btn btn-danger">Danger</button>
                    <button type="button" className="btn btn-warning">Warning</button>
                    <button type="button" className="btn btn-info">Info</button>
                    <button type="button" className="btn btn-light">Light</button>
                    <button type="button" className="btn btn-dark">Dark</button>
                  </div>
                  <div className="d-f fxw-w gap-10 mB-10">
                    <button type="button" className="btn btn-outline-primary">Primary</button>
                    <button type="button" className="btn btn-outline-secondary">Secondary</button>
                    <button type="button" className="btn btn-outline-success">Success</button>
                    <button type="button" className="btn btn-outline-danger">Danger</button>
                    <button type="button" className="btn btn-outline-warning">Warning</button>
                    <button type="button" className="btn btn-outline-info">Info</button>
                    <button type="button" className="btn btn-outline-light">Light</button>
                    <button type="button" className="btn btn-outline-dark">Dark</button>
                  </div>
                  <div className="btn-group" role="group">
                    <button type="button" className="btn btn-primary">1</button>
                    <button type="button" className="btn btn-primary">2</button>
                    <button type="button" className="btn btn-primary">3</button>
                    <button type="button" className="btn btn-primary">4</button>
                    <button type="button" className="btn btn-primary">5</button>
                    <button type="button" className="btn btn-primary">6</button>
                    <button type="button" className="btn btn-primary">7</button>
                    <button type="button" className="btn btn-primary">8</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dropdowns */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Dropdowns</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f gap-10 fxw-w">
                    <div className="dropdown">
                      <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Dropdown button
                      </button>
                      <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#">Action</a></li>
                        <li><a className="dropdown-item" href="#">Another action</a></li>
                        <li><a className="dropdown-item" href="#">Something else here</a></li>
                      </ul>
                    </div>
                    <div className="dropdown">
                      <button className="btn btn-danger dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Action Toggle Dropdown
                      </button>
                      <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#">Action</a></li>
                        <li><a className="dropdown-item" href="#">Another action</a></li>
                        <li><a className="dropdown-item" href="#">Something else here</a></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><a className="dropdown-item" href="#">Separated link</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List Group */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">List Group</h6>
                </div>
                <div className="layer w-100">
                  <ul className="list-group">
                    <a href="#" className="list-group-item list-group-item-action active">The current link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A second link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A third link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A fourth link item</a>
                    <a href="#" className="list-group-item list-group-item-action disabled">A disabled link item</a>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Modal</h6>
                </div>
                <div className="layer w-100">
                  <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#demoModal">
                    Launch demo modal
                  </button>
                  <div className="modal fade" id="demoModal" tabIndex={-1} aria-labelledby="demoModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title" id="demoModalLabel">Modal title</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body">...</div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                          <button type="button" className="btn btn-primary">Save changes</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popover */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Popover</h6>
                </div>
                <div className="layer w-100">
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-bs-toggle="popover"
                    data-bs-title="Popover title"
                    data-bs-content="And here's some amazing content. It's very engaging. Right?"
                  >
                    Click to toggle popover
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress - Adminator style */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Progress</h6>
                </div>
                <div className="layer w-100">
                  <h5 className="mB-5">100k</h5>
                  <div className="d-f jc-sb ai-c mB-5">
                    <small className="fw-600 c-grey-700">Visitors From USA</small>
                    <span className="c-grey-600 fsz-sm">50%</span>
                  </div>
                  <div className="progress mT-10">
                    <div className="progress-bar" role="progressbar" style={{ width: '50%', background: '#673ab7' }} aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <small className="c-grey-600 fsz-sm">50% Complete</small>
                </div>
                <div className="layer w-100 mT-15">
                  <h5 className="mB-5">1M</h5>
                  <div className="d-f jc-sb ai-c mB-5">
                    <small className="fw-600 c-grey-700">Visitors From Europe</small>
                    <span className="c-grey-600 fsz-sm">80%</span>
                  </div>
                  <div className="progress mT-10">
                    <div className="progress-bar" role="progressbar" style={{ width: '80%', background: '#4caf50' }} aria-valuenow={80} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <small className="c-grey-600 fsz-sm">80% Complete</small>
                </div>
                <div className="layer w-100 mT-15">
                  <h5 className="mB-5">450k</h5>
                  <div className="d-f jc-sb ai-c mB-5">
                    <small className="fw-600 c-grey-700">Visitors From Australia</small>
                    <span className="c-grey-600 fsz-sm">40%</span>
                  </div>
                  <div className="progress mT-10">
                    <div className="progress-bar" role="progressbar" style={{ width: '40%', background: '#03a9f4' }} aria-valuenow={40} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <small className="c-grey-600 fsz-sm">40% Complete</small>
                </div>
                <div className="layer w-100 mT-15">
                  <h5 className="mB-5">1B</h5>
                  <div className="d-f jc-sb ai-c mB-5">
                    <small className="fw-600 c-grey-700">Visitors From India</small>
                    <span className="c-grey-600 fsz-sm">90%</span>
                  </div>
                  <div className="progress mT-10">
                    <div className="progress-bar" role="progressbar" style={{ width: '90%', background: '#607d8b' }} aria-valuenow={90} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <small className="c-grey-600 fsz-sm">90% Complete</small>
                </div>
              </div>
            </div>
          </div>

          {/* Tooltips */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Tooltips</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f gap-10 fxw-w">
                    <button type="button" className="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="Tooltip on top">Tooltip on top</button>
                    <button type="button" className="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="right" title="Tooltip on right">Tooltip on right</button>
                    <button type="button" className="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Tooltip on bottom">Tooltip on bottom</button>
                    <button type="button" className="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="left" title="Tooltip on left">Tooltip on left</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Button Sizes</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f ai-c fxw-w gap-10">
                    <button type="button" className="btn btn-primary btn-lg">Large button</button>
                    <button type="button" className="btn btn-secondary btn-lg">Large button</button>
                    <button type="button" className="btn btn-primary">Default button</button>
                    <button type="button" className="btn btn-secondary">Default button</button>
                    <button type="button" className="btn btn-primary btn-sm">Small button</button>
                    <button type="button" className="btn btn-secondary btn-sm">Small button</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Badges</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f fxd-c gap-10">
                    <h5 className="m-0">Example heading <span className="badge bg-secondary">New</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-secondary">2</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-success">Success</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-danger">Danger</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-warning text-dark">Warning</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-info">Info</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-light text-dark">Light</span></h5>
                    <h5 className="m-0">Example heading <span className="badge bg-dark">Dark</span></h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Accordion</h6>
                </div>
                <div className="layer w-100">
                  <div className="accordion" id="uiAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#accordion1" aria-expanded="true" aria-controls="accordion1">Accordion Item #1</button>
                      </h2>
                      <div id="accordion1" className="accordion-collapse collapse show" data-bs-parent="#uiAccordion">
                        <div className="accordion-body">This is the first item&apos;s accordion body. It is shown by default, until the collapse plugin adds the appropriate classes.</div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion2" aria-expanded="false" aria-controls="accordion2">Accordion Item #2</button>
                      </h2>
                      <div id="accordion2" className="accordion-collapse collapse" data-bs-parent="#uiAccordion">
                        <div className="accordion-body">This is the second item&apos;s accordion body. It is hidden by default, until the collapse plugin adds the appropriate classes.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Cards</h6>
                </div>
                <div className="layer w-100">
                  <div className="card bd-0">
                    <div className="card-body p-0">
                      <h5 className="card-title">Card title</h5>
                      <h6 className="card-subtitle mb-2 text-body-secondary">Card subtitle</h6>
                      <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card&apos;s content.</p>
                      <a href="#" className="card-link">Card link</a>
                      <a href="#" className="card-link">Another link</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List Groups */}
          <div className="masonry-item col-md-6">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">List Groups</h6>
                </div>
                <div className="layer w-100">
                  <ul className="list-group mB-15">
                    <li className="list-group-item">An item</li>
                    <li className="list-group-item">A second item</li>
                    <li className="list-group-item">A third item</li>
                    <li className="list-group-item">A fourth item</li>
                    <li className="list-group-item">And a fifth one</li>
                  </ul>
                  <ul className="list-group">
                    <a href="#" className="list-group-item list-group-item-action active">The current link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A second link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A third link item</a>
                    <a href="#" className="list-group-item list-group-item-action">A fourth link item</a>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Spinners */}
          <div className="masonry-item col-12">
            <div className="bd bgc-white p-20">
              <div className="layers">
                <div className="layer w-100 mB-15">
                  <h6 className="lh-1 m-0">Spinners</h6>
                </div>
                <div className="layer w-100">
                  <div className="d-f fxw-w gap-20 ai-c">
                    {['primary', 'secondary', 'success', 'danger', 'warning', 'info'].map((c) => (
                      <div key={c} className="d-f ai-c gap-10">
                        <div className={`spinner-border text-${c}`} role="status"><span className="visually-hidden">Loading...</span></div>
                        <span>Loading...</span>
                      </div>
                    ))}
                    <div className="d-f ai-c gap-10">
                      <div className="spinner-grow text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span>Loading...</span>
                    </div>
                    <div className="d-f ai-c gap-10">
                      <div className="spinner-grow text-secondary" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span>Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
