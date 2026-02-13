'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';

type Employee = {
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: string;
  salary: string;
};

const employees: Employee[] = [
  { name: 'Tiger Nixon', position: 'System Architect', office: 'Edinburgh', age: 61, startDate: '2011/04/25', salary: '$320,800' },
  { name: 'Garrett Winters', position: 'Accountant', office: 'Tokyo', age: 63, startDate: '2011/07/25', salary: '$170,750' },
  { name: 'Ashton Cox', position: 'Junior Technical Author', office: 'San Francisco', age: 66, startDate: '2009/01/12', salary: '$86,000' },
  { name: 'Cedric Kelly', position: 'Senior Javascript Developer', office: 'Edinburgh', age: 22, startDate: '2012/03/29', salary: '$433,060' },
  { name: 'Airi Satou', position: 'Accountant', office: 'Tokyo', age: 33, startDate: '2008/11/28', salary: '$162,700' },
  { name: 'Brielle Williamson', position: 'Integration Specialist', office: 'New York', age: 61, startDate: '2012/12/02', salary: '$372,000' },
  { name: 'Herrod Chandler', position: 'Sales Assistant', office: 'San Francisco', age: 59, startDate: '2012/08/06', salary: '$137,500' },
  { name: 'Rhona Davidson', position: 'Integration Specialist', office: 'Tokyo', age: 55, startDate: '2010/10/14', salary: '$327,900' },
  { name: 'Colleen Hurst', position: 'Javascript Developer', office: 'San Francisco', age: 39, startDate: '2009/09/15', salary: '$205,500' },
  { name: 'Sonya Frost', position: 'Software Engineer', office: 'Edinburgh', age: 23, startDate: '2008/12/13', salary: '$103,600' },
  { name: 'Jena Gaines', position: 'Office Manager', office: 'London', age: 30, startDate: '2008/12/19', salary: '$90,560' },
  { name: 'Quinn Flynn', position: 'Support Lead', office: 'Edinburgh', age: 22, startDate: '2013/03/03', salary: '$342,000' },
  { name: 'Charde Marshall', position: 'Regional Director', office: 'San Francisco', age: 36, startDate: '2008/10/16', salary: '$470,600' },
  { name: 'Haley Kennedy', position: 'Senior Marketing Designer', office: 'London', age: 43, startDate: '2012/12/18', salary: '$313,500' },
  { name: 'Tatyana Fitzpatrick', position: 'Regional Director', office: 'London', age: 19, startDate: '2010/03/17', salary: '$385,750' },
  { name: 'Michael Silva', position: 'Marketing Designer', office: 'London', age: 66, startDate: '2012/11/27', salary: '$198,500' },
  { name: 'Paul Byrd', position: 'Chief Financial Officer (CFO)', office: 'New York', age: 64, startDate: '2010/06/09', salary: '$725,000' },
  { name: 'Gloria Little', position: 'Systems Administrator', office: 'New York', age: 59, startDate: '2009/04/10', salary: '$237,500' },
  { name: 'Bradley Greer', position: 'Software Engineer', office: 'London', age: 41, startDate: '2012/10/13', salary: '$132,000' },
  { name: 'Dai Rios', position: 'Personnel Lead', office: 'Edinburgh', age: 35, startDate: '2012/09/26', salary: '$217,500' },
  { name: 'Jenette Caldwell', position: 'Development Lead', office: 'New York', age: 30, startDate: '2011/09/03', salary: '$345,000' },
  { name: 'Yuri Berry', position: 'Chief Marketing Officer (CMO)', office: 'New York', age: 40, startDate: '2009/06/25', salary: '$675,000' },
  { name: 'Caesar Vance', position: 'Pre-Sales Support', office: 'New York', age: 21, startDate: '2011/12/12', salary: '$106,450' },
  { name: 'Doris Wilder', position: 'Sales Assistant', office: 'Sidney', age: 23, startDate: '2010/09/20', salary: '$85,600' },
  { name: 'Angelica Ramos', position: 'Chief Executive Officer (CEO)', office: 'London', age: 47, startDate: '2009/10/09', salary: '$1,200,000' },
  { name: 'Gavin Joyce', position: 'Developer', office: 'Edinburgh', age: 42, startDate: '2010/12/22', salary: '$92,575' },
  { name: 'Jennifer Chang', position: 'Regional Director', office: 'Singapore', age: 28, startDate: '2010/11/14', salary: '$357,650' },
  { name: 'Brenden Wagner', position: 'Software Engineer', office: 'San Francisco', age: 28, startDate: '2011/06/07', salary: '$206,850' },
  { name: 'Fiona Green', position: 'Chief Operating Officer (COO)', office: 'San Francisco', age: 48, startDate: '2010/03/11', salary: '$850,000' },
  { name: 'Shou Itou', position: 'Regional Marketing', office: 'Tokyo', age: 20, startDate: '2011/08/14', salary: '$163,000' },
  { name: 'Michelle House', position: 'Integration Specialist', office: 'Sidney', age: 37, startDate: '2011/06/02', salary: '$95,400' },
  { name: 'Suki Burks', position: 'Developer', office: 'London', age: 53, startDate: '2009/10/22', salary: '$114,500' },
  { name: 'Prescott Bartlett', position: 'Technical Author', office: 'London', age: 27, startDate: '2011/05/07', salary: '$145,000' },
  { name: 'Gavin Cortez', position: 'Team Leader', office: 'San Francisco', age: 22, startDate: '2008/10/26', salary: '$235,500' },
  { name: 'Martena Mccray', position: 'Post-Sales support', office: 'Edinburgh', age: 46, startDate: '2011/03/09', salary: '$324,050' },
  { name: 'Unity Butler', position: 'Marketing Designer', office: 'San Francisco', age: 47, startDate: '2009/12/09', salary: '$85,675' },
  { name: 'Howard Hatfield', position: 'Office Manager', office: 'San Francisco', age: 51, startDate: '2008/12/16', salary: '$164,500' },
  { name: 'Hope Fuentes', position: 'Secretary', office: 'San Francisco', age: 41, startDate: '2010/02/12', salary: '$109,850' },
  { name: 'Vivian Harrell', position: 'Financial Controller', office: 'San Francisco', age: 62, startDate: '2009/02/14', salary: '$452,500' },
  { name: 'Timothy Mooney', position: 'Office Manager', office: 'London', age: 37, startDate: '2008/12/11', salary: '$136,200' },
  { name: 'Jackson Bradshaw', position: 'Director', office: 'New York', age: 65, startDate: '2008/09/26', salary: '$645,750' },
  { name: 'Olivia Liang', position: 'Support Engineer', office: 'Singapore', age: 64, startDate: '2011/02/03', salary: '$234,500' },
  { name: 'Bruno Nash', position: 'Software Engineer', office: 'London', age: 38, startDate: '2011/05/03', salary: '$163,500' },
  { name: 'Sakura Yamamoto', position: 'Support Engineer', office: 'Tokyo', age: 37, startDate: '2009/08/19', salary: '$139,575' },
  { name: 'Thor Walton', position: 'Developer', office: 'New York', age: 61, startDate: '2013/08/11', salary: '$98,540' },
  { name: 'Finn Camacho', position: 'Support Engineer', office: 'San Francisco', age: 47, startDate: '2009/07/07', salary: '$87,500' },
  { name: 'Serge Baldwin', position: 'Data Coordinator', office: 'Singapore', age: 64, startDate: '2012/04/09', salary: '$138,575' },
  { name: 'Zenaida Frank', position: 'Software Engineer', office: 'New York', age: 63, startDate: '2010/01/04', salary: '$125,250' },
  { name: 'Zorita Serrano', position: 'Software Engineer', office: 'San Francisco', age: 56, startDate: '2012/06/01', salary: '$115,000' },
  { name: 'Jennifer Acosta', position: 'Junior Javascript Developer', office: 'Edinburgh', age: 43, startDate: '2013/02/01', salary: '$75,650' },
  { name: 'Cara Stevens', position: 'Sales Assistant', office: 'New York', age: 46, startDate: '2011/12/06', salary: '$145,600' },
  { name: 'Hermione Butler', position: 'Regional Director', office: 'London', age: 47, startDate: '2011/03/21', salary: '$356,250' },
  { name: 'Lael Greer', position: 'Systems Administrator', office: 'London', age: 21, startDate: '2009/02/27', salary: '$103,500' },
  { name: 'Jonas Alexander', position: 'Developer', office: 'San Francisco', age: 30, startDate: '2010/07/14', salary: '$86,500' },
  { name: 'Shad Decker', position: 'Regional Director', office: 'Edinburgh', age: 51, startDate: '2008/11/13', salary: '$183,000' },
  { name: 'Michael Bruce', position: 'Javascript Developer', office: 'Singapore', age: 29, startDate: '2011/06/27', salary: '$183,000' },
  { name: 'Donna Snider', position: 'Customer Support', office: 'New York', age: 27, startDate: '2011/01/25', salary: '$112,000' },
];

type SortKey = keyof Employee | '';
type SortDir = 'asc' | 'desc';

export default function DataTablePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filteredData = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.office.toLowerCase().includes(q) ||
        e.startDate.includes(q) ||
        e.salary.toLowerCase().includes(q)
    );
  }, [search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );

  const handleSort = (key: keyof Employee) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  };

  const SortIcon = ({ col }: { col: keyof Employee }) => (
    <span className="ms-1">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}</span>
  );

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Data Tables</h4>
          </div>
        </div>

        <div className="bd bgc-white p-20">
          <h5 className="mB-20">Bootstrap Data Table</h5>
          <div className="d-f fxw-nw jc-sb ai-c mB-20 gap-10">
            <div>
              <label className="me-2">Show</label>
              <select
                className="form-select form-select-sm d-ib"
                style={{ width: 'auto' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ms-2">entries</span>
            </div>
            <div>
              <label className="me-2">Search:</label>
              <input
                type="search"
                className="form-control form-control-sm d-ib"
                style={{ width: 200 }}
                placeholder="Filter..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover table-bordered">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Name <SortIcon col="name" />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('position')}>
                    Position <SortIcon col="position" />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('office')}>
                    Office <SortIcon col="office" />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('age')}>
                    Age <SortIcon col="age" />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('startDate')}>
                    Start date <SortIcon col="startDate" />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('salary')}>
                    Salary <SortIcon col="salary" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.position}</td>
                    <td>{row.office}</td>
                    <td>{row.age}</td>
                    <td>{row.startDate}</td>
                    <td>{row.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-f fxw-nw jc-sb ai-c mT-20">
            <div className="c-grey-600 fsz-sm">
              Showing {sortedData.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
