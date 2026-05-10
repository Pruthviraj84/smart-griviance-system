import { useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, Gauge, BadgeCheck, ArrowRight, Lock } from 'lucide-react';
import Button from '../components/common/Button';

const features = [
  {
    title: 'Easy Complaint Submission',
    description: 'Students can submit issues with category, priority, location, and images in seconds.',
    icon: ClipboardList,
  },
  {
    title: 'Real-time Tracking',
    description: 'Every role sees clear status updates from pending to final resolution.',
    icon: Gauge,
  },
  {
    title: 'Fast Resolution',
    description: 'Smart auto-assignment, worker proof uploads, and admin verification.',
    icon: BadgeCheck,
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">Smart Grievance</span>
          </div>
          <Button onClick={() => navigate('/login')} icon={Lock}>
            Login
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Smart Grievance
              <span className="block text-primary-600">Management System</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              A modern, intelligent platform for colleges and organizations to manage complaints efficiently with real-time tracking, auto-assignment, and seamless communication.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/login')} icon={ArrowRight}>
                Get Started
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/register')}>
                Register as Student
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Key Features</h2>
            <p className="mt-4 text-slate-600">Everything you need to manage grievances effectively</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          Smart Grievance Management System. Built for modern institutions.
        </div>
      </footer>
    </div>
  );
}
