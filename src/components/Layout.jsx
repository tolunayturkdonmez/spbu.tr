import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, LayoutList, Users } from 'lucide-react';

const Layout = () => {
    const { userRole, logout } = useAuth();

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden font-sans">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6">
                {/* Header - Fixed */}
                <div className="flex justify-between items-center flex-none">
                    <div className="flex items-center gap-4">
                        <img src="/tp-link-logo.png" alt="Logo" className="h-10 w-auto" />
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ISP Envanter Sistemi</h1>
                            <p className="text-slate-500 mt-1">
                                Hoşgeldin, <span className="font-semibold">{userRole === 'admin' ? 'Yönetici' : 'Misafir'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="flex bg-white rounded-lg border p-1 shadow-sm">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`
                                }
                            >
                                <LayoutList className="h-4 w-4" />
                                Envanter
                            </NavLink>
                            <NavLink
                                to="/contacts"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`
                                }
                            >
                                <Users className="h-4 w-4" />
                                Rehber
                            </NavLink>
                        </nav>

                        <Button variant="outline" onClick={logout} className="gap-2">
                            <LogOut className="h-4 w-4" /> Çıkış Yap
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
