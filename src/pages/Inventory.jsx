import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    MoreHorizontal,
    Box,
    Upload,
    X
} from 'lucide-react';


const Inventory = () => {
    const { userRole } = useAuth();
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);


    // Form State
    const [formData, setFormData] = useState({
        model: '',
        serialNumber: '',
        boxStatus: 'Orijinal Kutu',
        location: '',
        usageArea: '',
        entryDate: '',
        exitDate: '',
        note: ''
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
            const inventoryData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Timestamps to Strings for easier handling in this demo
                entryDate: doc.data().entryDate?.toDate ? doc.data().entryDate.toDate().toISOString().split('T')[0] : doc.data().entryDate,
                exitDate: doc.data().exitDate?.toDate ? doc.data().exitDate.toDate().toISOString().split('T')[0] : doc.data().exitDate || ''
            }));
            setItems(inventoryData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // DEBUG: Check user auth state before writing
            import('../firebase').then(({ auth }) => {
                console.log("Current User UID:", auth.currentUser?.uid);
                console.log("Current User Email:", auth.currentUser?.email);
            });

            if (editingItem) {
                await updateDoc(doc(db, 'inventory', editingItem.id), {
                    ...formData,
                    // Convert string dates back to standard Date objects or Timestamps if needed
                    entryDate: new Date(formData.entryDate),
                    exitDate: formData.exitDate ? new Date(formData.exitDate) : null
                });
            } else {
                await addDoc(collection(db, 'inventory'), {
                    ...formData,
                    createdAt: Timestamp.now(),
                    entryDate: new Date(formData.entryDate),
                    exitDate: formData.exitDate ? new Date(formData.exitDate) : null
                });
            }
            setShowAddForm(false);
            setEditingItem(null);
            setFormData({
                model: '',
                serialNumber: '',
                boxStatus: 'Orijinal Kutu',
                location: '',
                usageArea: '',
                entryDate: '',
                exitDate: '',
                note: ''
            });
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Hata oluştu: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'inventory', id));
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            model: item.model || '',
            serialNumber: item.serialNumber || '',
            boxStatus: item.boxStatus || 'Orijinal Kutu',
            location: item.location || '',
            usageArea: item.usageArea || '',
            entryDate: item.entryDate || '',
            exitDate: item.exitDate || '',
            note: item.note || ''
        });
        setShowAddForm(true);
    };



    const filteredItems = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            String(item.model || '').toLowerCase().includes(searchLower) ||
            String(item.serialNumber || '').toLowerCase().includes(searchLower) ||
            String(item.location || '').toLowerCase().includes(searchLower) ||
            String(item.usageArea || '').toLowerCase().includes(searchLower) ||
            String(item.note || '').toLowerCase().includes(searchLower) ||
            String(item.boxStatus || '').toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="flex flex-col h-full gap-6 min-h-0">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg border shadow-sm flex-none">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-8"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <div className="text-sm text-slate-500 mr-2 hidden md:block">
                        <span className="font-medium text-slate-700">{items.length}</span> Kayıt
                        {searchTerm && (
                            <> (Filtrelenen: <span className="font-medium text-slate-700">{filteredItems.length}</span>)</>
                        )}
                    </div>
                    {userRole === 'admin' && (
                        <Button onClick={() => {
                            setEditingItem(null);
                            setFormData({
                                model: '',
                                serialNumber: '',
                                boxStatus: 'Orijinal Kutu',
                                location: '',
                                usageArea: '',
                                entryDate: new Date().toISOString().split('T')[0],
                                exitDate: '',
                                note: ''
                            });
                            setShowAddForm(!showAddForm);
                        }} className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> Yeni Kayıt
                        </Button>
                    )}
                </div>
            </div>

            {/* Add/Edit Form - Fixed/Overlay */}
            {showAddForm && userRole === 'admin' && (
                <Card className="animate-in fade-in slide-in-from-top-4 flex-none overflow-y-auto max-h-[40vh] border shadow-md z-30 mb-4">
                    <CardHeader className="pb-3 sticky top-0 bg-white z-20 border-b">
                        <CardTitle>{editingItem ? 'Kaydı Düzenle' : 'Yeni Kayıt Oluştur'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Model</label>
                                <Input required name="model" value={formData.model} onChange={handleInputChange} placeholder="Ürün Modeli" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Seri Numarası</label>
                                <Input required name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} placeholder="Seri No" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kutu Durumu</label>
                                <select
                                    name="boxStatus"
                                    value={formData.boxStatus}
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="Orijinal Kutu">Orijinal Kutu</option>
                                    <option value="Beyaz Kutu">Beyaz Kutu</option>
                                    <option value="Kutusuz">Kutusuz</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Konum</label>
                                <Input required name="location" value={formData.location} onChange={handleInputChange} placeholder="Bulunduğu Yer" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kullanım Alanı</label>
                                <Input name="usageArea" value={formData.usageArea} onChange={handleInputChange} placeholder="Örn: Muhasebe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Giriş Tarihi</label>
                                <Input required type="date" name="entryDate" value={formData.entryDate} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Çıkış Tarihi</label>
                                <Input type="date" name="exitDate" value={formData.exitDate} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 lg:col-span-4">
                                <label className="text-sm font-medium">Not</label>
                                <Input name="note" value={formData.note} onChange={handleInputChange} placeholder="Eklemek istediğiniz notlar..." />
                            </div>
                            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t p-4 -mx-6 -mb-6">
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>İptal</Button>
                                <Button type="submit">{editingItem ? 'Güncelle' : 'Kaydet'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Inventory List - Responsive with Sticky Header */}
            <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <div className="overflow-auto flex-1 w-full h-full">
                    <table className="w-full text-sm text-left table-fixed min-w-[1000px] sm:min-w-[1200px]">
                        <thead className="text-slate-600 font-medium bg-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Model</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Seri No</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Kutu Durumu</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Konum</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Kullanım Alanı</th>
                                <th className="w-[10%] px-4 py-3 whitespace-nowrap bg-slate-100">Giriş Tarihi</th>
                                <th className="w-[10%] px-4 py-3 whitespace-nowrap bg-slate-100">Çıkış Tarihi</th>
                                <th className="w-[10%] px-4 py-3 whitespace-nowrap bg-slate-100">Not</th>
                                {userRole === 'admin' && <th className="w-[10%] px-4 py-3 whitespace-nowrap text-right bg-slate-100">İşlemler</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-2"></div>
                                            Yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 border-b border-slate-50">{item.model}</td>
                                        <td className="px-4 py-3 font-mono text-xs border-b border-slate-50">{item.serialNumber}</td>
                                        <td className="px-4 py-3 border-b border-slate-50">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.boxStatus === 'Orijinal Kutu' ? 'bg-green-100 text-green-700' :
                                                item.boxStatus === 'Beyaz Kutu' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                <Box className="w-3 h-3 mr-1" />
                                                {item.boxStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-b border-slate-50">{item.location}</td>
                                        <td className="px-4 py-3 border-b border-slate-50">{item.usageArea}</td>
                                        <td className="px-4 py-3 text-slate-500 border-b border-slate-50">{item.entryDate}</td>
                                        <td className="px-4 py-3 text-slate-500 border-b border-slate-50">{item.exitDate || '-'}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate border-b border-slate-50" title={item.note}>{item.note}</td>
                                        {userRole === 'admin' && (
                                            <td className="px-4 py-3 text-right border-b border-slate-50">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
