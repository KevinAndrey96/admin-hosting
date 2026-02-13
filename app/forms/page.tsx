'use client';

import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function FormsPage() {
  const [validated, setValidated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setValidated(true);
    if (form.checkValidity()) {
      // Demo: could submit here
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Forms</h4>
          </div>
        </div>

        <div className="row gap-20">
          {/* Basic Form */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Basic Form</h6>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-3">
                  <label htmlFor="basicEmail" className="form-label">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="basicEmail"
                    placeholder="name@example.com"
                  />
                  <div className="form-text">We&apos;ll never share your email with anyone else.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="basicPassword" className="form-label">
                    Password
                  </label>
                  <input type="password" className="form-control" id="basicPassword" placeholder="Password" />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="basicCheck" />
                    <label className="form-check-label" htmlFor="basicCheck">
                      Call John for Dinner
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* Complex Form Layout */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Complex Form Layout</h6>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="complexEmail" className="form-label">
                      Email
                    </label>
                    <input type="email" className="form-control" id="complexEmail" placeholder="Email" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="complexPassword" className="form-label">
                      Password
                    </label>
                    <input type="password" className="form-control" id="complexPassword" placeholder="Password" />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="complexAddress" className="form-label">
                    Address
                  </label>
                  <input type="text" className="form-control" id="complexAddress" placeholder="1234 Main St" />
                </div>
                <div className="mb-3">
                  <label htmlFor="complexAddress2" className="form-label">
                    Address 2
                  </label>
                  <input type="text" className="form-control" id="complexAddress2" placeholder="Apartment, studio, or floor" />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="complexCity" className="form-label">
                      City
                    </label>
                    <input type="text" className="form-control" id="complexCity" placeholder="City" />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="complexState" className="form-label">
                      State
                    </label>
                    <select className="form-select" id="complexState">
                      <option>Choose...</option>
                      <option>California</option>
                      <option>New York</option>
                      <option>Texas</option>
                    </select>
                  </div>
                  <div className="col-md-2 mb-3">
                    <label htmlFor="complexZip" className="form-label">
                      Zip
                    </label>
                    <input type="text" className="form-control" id="complexZip" placeholder="Zip" />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="complexBirthdate" className="form-label">
                    Birthdate
                  </label>
                  <input type="date" className="form-control" id="complexBirthdate" />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="complexCheck" />
                    <label className="form-check-label" htmlFor="complexCheck">
                      Call John for Dinner
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Sign in
                </button>
              </form>
            </div>
          </div>

          {/* Horizontal Form */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Horizontal Form</h6>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row mb-3">
                  <label htmlFor="horizEmail" className="col-sm-3 col-form-label">
                    Email
                  </label>
                  <div className="col-sm-9">
                    <input type="email" className="form-control" id="horizEmail" placeholder="Email" />
                  </div>
                </div>
                <div className="row mb-3">
                  <label htmlFor="horizPassword" className="col-sm-3 col-form-label">
                    Password
                  </label>
                  <div className="col-sm-9">
                    <input type="password" className="form-control" id="horizPassword" placeholder="Password" />
                  </div>
                </div>
                <div className="row mb-3">
                  <span className="col-sm-3 col-form-label pt-0">Radios</span>
                  <div className="col-sm-9">
                    <div className="form-check">
                      <input type="radio" className="form-check-input" name="horizRadio" id="horizRadio1" defaultChecked />
                      <label className="form-check-label" htmlFor="horizRadio1">
                        Option one is this and that—be sure to include why it&apos;s great
                      </label>
                    </div>
                    <div className="form-check">
                      <input type="radio" className="form-check-input" name="horizRadio" id="horizRadio2" />
                      <label className="form-check-label" htmlFor="horizRadio2">
                        Option two can be something else and selecting it will deselect option one
                      </label>
                    </div>
                    <div className="form-check">
                      <input type="radio" className="form-check-input" name="horizRadio" id="horizRadio3" disabled />
                      <label className="form-check-label" htmlFor="horizRadio3">
                        Option three is disabled
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-sm-9 offset-sm-3">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="horizCheck" />
                      <label className="form-check-label" htmlFor="horizCheck">
                        Check me out
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-9 offset-sm-3">
                    <button type="submit" className="btn btn-primary">
                      Sign in
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Disabled Forms */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Disabled Forms</h6>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-3">
                  <label htmlFor="disabledInput" className="form-label">
                    Disabled input
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="disabledInput"
                    placeholder="Disabled input"
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="disabledSelect" className="form-label">
                    Disabled select menu
                  </label>
                  <select className="form-select" id="disabledSelect" disabled>
                    <option>Disabled select</option>
                  </select>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="disabledCheck" disabled />
                    <label className="form-check-label" htmlFor="disabledCheck">
                      Can&apos;t check this
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled>
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* Validation */}
          <div className="col-12">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Validation</h6>
              <form noValidate onSubmit={handleSubmit} className={validated ? 'was-validated' : ''}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="valFirstName" className="form-label">
                      First name
                    </label>
                    <input type="text" className="form-control" id="valFirstName" required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="valLastName" className="form-label">
                      Last name
                    </label>
                    <input type="text" className="form-control" id="valLastName" required />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="valCity" className="form-label">
                    City
                  </label>
                  <input type="text" className="form-control" id="valCity" required />
                  <div className="invalid-feedback">Please provide a valid city.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="valState" className="form-label">
                    State
                  </label>
                  <input type="text" className="form-control" id="valState" required />
                  <div className="invalid-feedback">Please provide a valid state.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="valZip" className="form-label">
                    Zip
                  </label>
                  <input type="text" className="form-control" id="valZip" required />
                  <div className="invalid-feedback">Please provide a valid zip.</div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Submit form
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
