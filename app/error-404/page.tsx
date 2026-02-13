'use client';

import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';

export default function NotFoundPage() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="bd bgc-white p-40 ta-c">
              <div className="mB-30">
                <span className="d-ib fsz-1 c-grey-400 fw-700" style={{ fontSize: '8rem', lineHeight: 1 }}>
                  404
                </span>
              </div>
              <h3 className="mB-10">Oops Page Not Found</h3>
              <p className="c-grey-600 mB-30">
                The page you are looking for does not exist or has been moved.
              </p>
              <Link href="/" className="btn btn-primary">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
