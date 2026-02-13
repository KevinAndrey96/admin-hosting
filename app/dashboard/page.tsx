'use client';

import dynamic from 'next/dynamic';
import AdminLayout from '../components/AdminLayout';
import AdminatorCharts from '../components/AdminatorCharts';
import MasonryInit from '../components/MasonryInit';
import MonthlyStatsChart from '../components/charts/MonthlyStatsChart';
import CircularProgress from '../components/charts/CircularProgress';

const WorldMapChart = dynamic(() => import('../components/charts/WorldMapChart'), {
  ssr: false,
  loading: () => (
    <div className="d-f ai-c jc-c h-100" style={{ minHeight: 300, background: 'var(--c-bkg-hover)' }}>
      <span className="c-grey-600">Cargando mapa...</span>
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <AdminLayout>
      <AdminatorCharts />
      <MasonryInit />
      <div className="row gap-20 masonry pos-r">
        <div className="masonry-sizer col-md-6" />
        <div className="masonry-item w-100">
          <div className="row gap-20">
            {/* KPI cards - Adminator structure with sparkline IDs for Chart.js */}
            <div className="col-md-3">
              <div className="layers bd bgc-white p-20">
                <div className="layer w-100 mB-10">
                  <h6 className="lh-1">Total Visits</h6>
                </div>
                <div className="layer w-100">
                  <div className="peers ai-sb fxw-nw">
                    <div className="peer peer-greed">
                      <span id="sparklinedash" />
                    </div>
                    <div className="peer">
                      <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-green-50 c-green-500">+10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="layers bd bgc-white p-20">
                <div className="layer w-100 mB-10">
                  <h6 className="lh-1">Total Page Views</h6>
                </div>
                <div className="layer w-100">
                  <div className="peers ai-sb fxw-nw">
                    <div className="peer peer-greed">
                      <span id="sparklinedash2" />
                    </div>
                    <div className="peer">
                      <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-red-50 c-red-500">-7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="layers bd bgc-white p-20">
                <div className="layer w-100 mB-10">
                  <h6 className="lh-1">Unique Visitor</h6>
                </div>
                <div className="layer w-100">
                  <div className="peers ai-sb fxw-nw">
                    <div className="peer peer-greed">
                      <span id="sparklinedash3" />
                    </div>
                    <div className="peer">
                      <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-purple-50 c-purple-500">~12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="layers bd bgc-white p-20">
                <div className="layer w-100 mB-10">
                  <h6 className="lh-1">Bounce Rate</h6>
                </div>
                <div className="layer w-100">
                  <div className="peers ai-sb fxw-nw">
                    <div className="peer peer-greed">
                      <span id="sparklinedash4" />
                    </div>
                    <div className="peer">
                      <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-blue-50 c-blue-500">33%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="masonry-item col-12">
          <div className="bd bgc-white">
            <div className="peers fxw-nw@lg+ ai-s">
              <div className="peer peer-greed w-70p@lg+ w-100@lg- p-20">
                <div className="layers">
                  <div className="layer w-100 mB-10">
                    <h6 className="lh-1">Site Visits</h6>
                  </div>
                  <div className="layer w-100">
                    <WorldMapChart />
                  </div>
                </div>
              </div>
              <div className="peer bdL p-20 w-30p@lg+ w-100p@lg-">
                <div className="layers">
                  <div className="layer w-100">
                    <div className="layers">
                      <div className="layer w-100">
                        <h5 className="mB-5">100k</h5>
                        <small className="fw-600 c-grey-700">Visitors From USA</small>
                        <span className="pull-right c-grey-600 fsz-sm">50%</span>
                        <div className="progress mT-10">
                          <div className="progress-bar bgc-deep-purple-500" role="progressbar" style={{ width: '50%' }} />
                        </div>
                      </div>
                      <div className="layer w-100 mT-15">
                        <h5 className="mB-5">1M</h5>
                        <small className="fw-600 c-grey-700">Visitors From Europe</small>
                        <span className="pull-right c-grey-600 fsz-sm">80%</span>
                        <div className="progress mT-10">
                          <div className="progress-bar bgc-green-500" role="progressbar" style={{ width: '80%' }} />
                        </div>
                      </div>
                      <div className="layer w-100 mT-15">
                        <h5 className="mB-5">450k</h5>
                        <small className="fw-600 c-grey-700">Visitors From Australia</small>
                        <span className="pull-right c-grey-600 fsz-sm">40%</span>
                        <div className="progress mT-10">
                          <div className="progress-bar bgc-light-blue-500" role="progressbar" style={{ width: '40%' }} />
                        </div>
                      </div>
                      <div className="layer w-100 mT-15">
                        <h5 className="mB-5">1B</h5>
                        <small className="fw-600 c-grey-700">Visitors From India</small>
                        <span className="pull-right c-grey-600 fsz-sm">90%</span>
                        <div className="progress mT-10">
                          <div className="progress-bar bgc-blue-grey-500" role="progressbar" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="peers pT-20 mT-20 bdT fxw-nw@lg+ jc-sb ta-c gap-10">
                      <CircularProgress percent={75} color="#f44336" label="New Users" />
                      <CircularProgress percent={50} color="#2196f3" label="New Purchases" />
                      <CircularProgress percent={90} color="#ff9800" label="Bounce Rate" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="masonry-item col-md-6">
          <div className="bd bgc-white">
            <div className="layers">
              <div className="layer w-100 pX-20 pT-20">
                <h6 className="lh-1">Monthly Stats</h6>
              </div>
              <div className="layer w-100 p-20">
                <MonthlyStatsChart />
              </div>
              <div className="layer bdT p-20 w-100">
                <div className="peers ai-c jc-sb gapX-20">
                  <div className="peer">
                    <span className="fsz-def fw-600 mR-10 c-grey-800">54%</span>
                    <small className="c-grey-500 fw-600">Sales Growth</small>
                  </div>
                  <div className="peer fw-600">
                    <span className="fsz-def fw-600 mR-10 c-grey-800">$185K</span>
                    <small className="c-grey-500 fw-600">Dec Sales</small>
                  </div>
                  <div className="peer fw-600">
                    <span className="fsz-def fw-600 mR-10 c-grey-800">60%</span>
                    <small className="c-grey-500 fw-600">Profit Growth</small>
                  </div>
                  <div className="peer fw-600">
                    <span className="fsz-def fw-600 mR-10 c-grey-800">$72K</span>
                    <small className="c-grey-500 fw-600">Dec Profit</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="masonry-item col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 mB-10">
                <h6 className="lh-1">Todo List</h6>
              </div>
              <div className="layer w-100">
                <ul className="list-task list-group">
                  <li className="list-group-item bdw-0">
                    <div className="checkbox checkbox-circle checkbox-info peers ai-c">
                      <input type="checkbox" id="inputCall1" name="inputCheckboxesCall" className="peer" />
                      <label htmlFor="inputCall1" className="form-label peers peer-greed js-sb ai-c">
                        <span className="peer peer-greed">Call John for Dinner</span>
                      </label>
                    </div>
                  </li>
                  <li className="list-group-item bdw-0">
                    <div className="checkbox checkbox-circle checkbox-info peers ai-c">
                      <input type="checkbox" id="inputCall2" name="inputCheckboxesCall" className="peer" />
                      <label htmlFor="inputCall2" className="form-label peers peer-greed js-sb ai-c">
                        <span className="peer peer-greed">Book Boss Flight</span>
                        <span className="peer">
                          <span className="badge rounded-pill fl-r bg-success lh-0 p-10">2 Days</span>
                        </span>
                      </label>
                    </div>
                  </li>
                  <li className="list-group-item bdw-0">
                    <div className="checkbox checkbox-circle checkbox-info peers ai-c">
                      <input type="checkbox" id="inputCall3" name="inputCheckboxesCall" className="peer" />
                      <label htmlFor="inputCall3" className="form-label peers peer-greed js-sb ai-c">
                        <span className="peer peer-greed">Hit the Gym</span>
                        <span className="peer">
                          <span className="badge rounded-pill fl-r bg-danger lh-0 p-10">3 Minutes</span>
                        </span>
                      </label>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="masonry-item col-md-6">
          <div className="bd bgc-white">
            <div className="layers">
              <div className="layer w-100 p-20">
                <h6 className="lh-1">Sales Report</h6>
              </div>
              <div className="layer w-100">
                <div className="sales-report-header p-20">
                  <div className="peers ai-c jc-sb gap-40">
                    <div className="peer peer-greed">
                      <h5>November 2025</h5>
                      <p className="mB-0">Sales Report</p>
                    </div>
                    <div className="peer">
                      <h3 className="text-end">$6,000</h3>
                    </div>
                  </div>
                </div>
                <div className="table-responsive p-20">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="bdwT-0">Name</th>
                        <th className="bdwT-0">Status</th>
                        <th className="bdwT-0">Date</th>
                        <th className="bdwT-0">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-600">Item #1 Name</td>
                        <td><span className="badge bgc-red-50 c-red-700 p-10 lh-0 tt-c rounded-pill">Unavailable</span></td>
                        <td>Nov 18</td>
                        <td><span className="text-success">$12</span></td>
                      </tr>
                      <tr>
                        <td className="fw-600">Item #2 Name</td>
                        <td><span className="badge bgc-deep-purple-50 c-deep-purple-700 p-10 lh-0 tt-c rounded-pill">New</span></td>
                        <td>Nov 19</td>
                        <td><span className="text-info">$34</span></td>
                      </tr>
                      <tr>
                        <td className="fw-600">Item #3 Name</td>
                        <td><span className="badge bgc-green-50 c-green-700 p-10 lh-0 tt-c rounded-pill">Available</span></td>
                        <td>Nov 20</td>
                        <td><span className="text-success">$65</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="ta-c bdT w-100 p-20">
              <a href="#">Check all the sales</a>
            </div>
          </div>
        </div>

        <div className="masonry-item col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 mB-20">
                <h6 className="lh-1">Welcome to Admin Panel</h6>
              </div>
              <div className="layer w-100">
                <p className="c-grey-600">
                  Panel de administración con gráficos integrados usando Recharts.
                  Los datos mostrados son de demostración.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
