'use client';

import AdminLayout from '../../components/AdminLayout';

const sampleData = [
  { id: 1, firstName: 'Mark', lastName: 'Otto', username: '@mdo' },
  { id: 2, firstName: 'Jacob', lastName: 'Thornton', username: '@fat' },
  { id: 3, firstName: 'Larry', lastName: 'the Bird', username: '@twitter' },
];

export default function BasicTablePage() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Basic Tables</h4>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="bd bgc-white p-20">
              <h5 className="mB-20">Simple Table</h5>
              <p className="c-grey-600 fsz-sm mB-20">
                Using the most basic table markup, here&apos;s how <code>.table</code>-based tables look in Bootstrap.
                <strong> All table styles are inherited in Bootstrap 5</strong>, meaning any nested tables will be styled in the same manner as the parent.
              </p>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.firstName}</td>
                        <td>{row.lastName}</td>
                        <td>{row.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row mT-20">
          <div className="col-12">
            <div className="bd bgc-white p-20">
              <h5 className="mB-20">Table head options</h5>
              <p className="c-grey-600 fsz-sm mB-20">
                Similar to tables and dark tables, use the modifier classes <code>.table-light</code> or <code>.table-dark</code> to make <code>&lt;thead&gt;</code>s appear light or dark gray.
              </p>
              <div className="table-responsive">
                <table className="table">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.firstName}</td>
                        <td>{row.lastName}</td>
                        <td>{row.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-responsive mT-20">
                <table className="table">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.firstName}</td>
                        <td>{row.lastName}</td>
                        <td>{row.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row mT-20">
          <div className="col-12">
            <div className="bd bgc-white p-20">
              <h5 className="mB-20">Striped rows</h5>
              <p className="c-grey-600 fsz-sm mB-20">
                Use <code>.table-striped</code> to add zebra-striping to any table row within the <code>&lt;tbody&gt;</code>.
              </p>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.firstName}</td>
                        <td>{row.lastName}</td>
                        <td>{row.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row mT-20">
          <div className="col-12">
            <div className="bd bgc-white p-20">
              <h5 className="mB-20">Bordered table</h5>
              <p className="c-grey-600 fsz-sm mB-20">
                Add <code>.table-bordered</code> for borders on all sides of the table and cells.
              </p>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Mark</td>
                      <td>Otto</td>
                      <td>@mdo</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Mark</td>
                      <td>Otto</td>
                      <td>@TwBootstrap</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Jacob</td>
                      <td>Thornton</td>
                      <td>@fat</td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>Larry</td>
                      <td>the Bird</td>
                      <td>@twitter</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row mT-20">
          <div className="col-12">
            <div className="bd bgc-white p-20">
              <h5 className="mB-20">Hoverable rows</h5>
              <p className="c-grey-600 fsz-sm mB-20">
                Add <code>.table-hover</code> to enable a hover state on table rows within a <code>&lt;tbody&gt;</code>.
              </p>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.firstName}</td>
                        <td>{row.lastName}</td>
                        <td>{row.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
