'use client';

import AdminLayout from '../components/AdminLayout';

export default function BlankPage() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Blank Page</h4>
          </div>
        </div>

        <div className="bd bgc-white p-20">
          <p className="c-grey-600 m-0">
            This is a blank page. Use it as a starting point for your content.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
