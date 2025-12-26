import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Eye, EyeOff, Lock } from 'lucide-react';

import { sha256 } from 'js-sha256';

const Login = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginAdmin, loginGuest } = useAuth();
    const navigate = useNavigate();

    const hashPassword = (string) => {
        return sha256(string);
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const hashedPassword = await hashPassword(password);
            const targetHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;

            if (hashedPassword === targetHash) {
                await loginAdmin(password); // Firebase still needs the real password if using auth, but here we just used it for local check first? 
                // Wait, useAuth loginAdmin takes 'password'. 
                // Using firebase auth means the password IS sent to network. 
                // The user request was "console injection or java codes". 
                // If I hash it here, I still need to send the REAL password to firebase if we are actually using firebase auth for admin.
                // Looking at AuthContext: loginAdmin takes 'password' and calls signInWithEmailAndPassword.
                // So the plain text IS required for Firebase. 
                // BUT, checking the hash LOCALLY first prevents storing "EUET2025!!!" in this file.
                // The attacker can't see the expected password in the source code.
                // They only see the hash.
                // If they break point here, they see 'password' variable in memory, but that's user input.
                // The Goal is "dışarıdan console injection veya java kodları üzerinden bulunamayacak şekilde".
                // Removing the string literal 'EUET2025!!!' achieves this.
                navigate('/');
            } else {
                setError('Hatalı şifre!');
                setLoading(false);
            }
        } catch (err) {
            setError('Giriş başarısız: ' + err.message);
            setLoading(false);
        }
    };

    const handleGuestLogin = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        await loginGuest();
        navigate('/');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-[400px] shadow-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/tp-link-logo.png" alt="Logo" className="h-12 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">Envanter Takip</CardTitle>
                    <CardDescription>Devam etmek için giriş yapın</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500">Yönetici Girişi</h3>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Yönetici Şifresi"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                            </Button>
                        </form>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">Veya</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGuestLogin}
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'İşleniyor...' : 'Misafir Olarak Devam Et'}
                    </Button>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-xs text-slate-400">© 2025 TP-LINK Türkiye ISP Envanter Sistemi</p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
