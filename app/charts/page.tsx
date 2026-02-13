'use client';

import AdminLayout from '../components/AdminLayout';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import CircularProgress from '../components/charts/CircularProgress';

const LINE_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

const AREA_DATA = [
  { name: 'Jan', uv: 590, pv: 800 },
  { name: 'Feb', uv: 868, pv: 967 },
  { name: 'Mar', uv: 1397, pv: 1098 },
  { name: 'Apr', uv: 1480, pv: 1200 },
  { name: 'May', uv: 1520, pv: 1108 },
  { name: 'Jun', uv: 1400, pv: 680 },
];

const BAR_DATA = [
  { name: 'Page A', uv: 4000, pv: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398 },
  { name: 'Page C', uv: 2000, pv: 9800 },
  { name: 'Page D', uv: 2780, pv: 3908 },
  { name: 'Page E', uv: 1890, pv: 4800 },
  { name: 'Page F', uv: 2390, pv: 3800 },
];

const SCATTER_DATA = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

const DOUGHNUT_DATA = [
  { name: 'Group A', value: 400, color: '#4f46e5' },
  { name: 'Group B', value: 300, color: '#10b981' },
  { name: 'Group C', value: 300, color: '#f59e0b' },
  { name: 'Group D', value: 200, color: '#ef4444' },
];

const RADAR_DATA = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
  { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
  { subject: 'History', A: 65, B: 85, fullMark: 150 },
];

const MIXED_DATA = [
  { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page B', uv: 868, pv: 967, amt: 1506 },
  { name: 'Page C', uv: 1397, pv: 1098, amt: 989 },
  { name: 'Page D', uv: 1480, pv: 1200, amt: 1228 },
  { name: 'Page E', uv: 1520, pv: 1108, amt: 1100 },
  { name: 'Page F', uv: 1400, pv: 680, amt: 1700 },
];

const SPARK_LINE = [5, 6, 7, 9, 9, 5, 3, 2, 2, 4, 6, 7];
const SPARK_BAR = [4, 1, 5, 7, 9, 9, 8, 7, 6, 6, 4, 7, 8, 4, 3, 2, 2, 5, 6, 7];

const chartStyle = { width: '100%', height: 280 };
const gridStroke = 'var(--c-border)';
const textColor = 'var(--c-text-muted)';

export default function ChartsPage() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Charts</h4>
          </div>
        </div>

        <div className="row gap-20">
          {/* Line Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Line Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={LINE_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Area Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Area Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={AREA_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                    <Area type="monotone" dataKey="uv" stroke="#4f46e5" fill="url(#colorUv)" strokeWidth={2} />
                    <Area type="monotone" dataKey="pv" stroke="#10b981" fill="url(#colorPv)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Bar Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={BAR_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pv" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="uv" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Scatter Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" dataKey="x" stroke={textColor} fontSize={11} />
                    <YAxis type="number" dataKey="y" stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                    <Scatter name="Data" data={SCATTER_DATA} fill="#4f46e5" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Doughnut Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DOUGHNUT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {DOUGHNUT_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Radar Chart</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={RADAR_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: textColor, fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: textColor, fontSize: 10 }} />
                    <Radar name="A" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                    <Radar name="B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Mixed Chart */}
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Mixed Chart (Bar + Line)</h6>
              <div style={chartStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MIXED_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-bkg-card)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 6,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="uv" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="pv" stroke="#10b981" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* jQuery Sparkline section */}
          <div className="col-12">
            <h6 className="mB-15">jQuery Sparkline</h6>
          </div>
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-10 fsz-sm">Spark Line</h6>
              <div style={{ height: 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SPARK_LINE.map((v, i) => ({ name: i, value: v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-10 fsz-sm">Spark Bar</h6>
              <div style={{ height: 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SPARK_BAR.map((v, i) => ({ name: i, value: v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Easy Pie Charts */}
          <div className="col-12">
            <h6 className="mB-15">Easy Pie Charts</h6>
          </div>
          <div className="col-md-3">
            <div className="bd bgc-white p-20 bdrs-3 ta-c">
              <CircularProgress percent={75} color="#4f46e5" label="New Users" />
            </div>
          </div>
          <div className="col-md-3">
            <div className="bd bgc-white p-20 bdrs-3 ta-c">
              <CircularProgress percent={50} color="#10b981" label="New Purchases" />
            </div>
          </div>
          <div className="col-md-3">
            <div className="bd bgc-white p-20 bdrs-3 ta-c">
              <CircularProgress percent={65} color="#f59e0b" label="New Customers" />
            </div>
          </div>
          <div className="col-md-3">
            <div className="bd bgc-white p-20 bdrs-3 ta-c">
              <CircularProgress percent={90} color="#ef4444" label="Bounce Rate" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
