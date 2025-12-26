import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Plus, Search, Trash2, Edit2, User, X } from 'lucide-react';

const Contacts = () => {
    const { userRole } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        company: '',
        department: '',
        title: '',
        phone: '', phone: '',
        address: ''
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'contacts'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContacts(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;

        if (phoneNumberLength < 4) return phoneNumber;

        let formatted = phoneNumber;
        if (phoneNumberLength < 7) {
            formatted = `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
        } else if (phoneNumberLength < 9) {
            formatted = `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`;
        } else {
            formatted = `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 9)} ${phoneNumber.slice(9, 11)}`;
        }

        return formatted.trim();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            // Limit length to the max format length (0555 555 95 90 is 14 chars)
            if (formatted.length <= 15) {
                setFormData(prev => ({ ...prev, [name]: formatted }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await updateDoc(doc(db, 'contacts', editingContact.id), {
                    ...formData
                });
            } else {
                await addDoc(collection(db, 'contacts'), {
                    ...formData,
                    createdAt: Timestamp.now()
                });
            }
            setShowAddForm(false);
            setEditingContact(null);
            setFormData({
                fullName: '',
                company: '',
                department: '',
                title: '',
                phone: '', phone: '',
                address: ''
            });
        } catch (error) {
            console.error("Error saving contact: ", error);
            alert("Hata oluştu: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu kişiyi silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'contacts', id));
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            fullName: contact.fullName || (contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName || contact.lastName || ''),
            company: contact.company || '',
            department: contact.department || '',
            title: contact.title || '',
            phone: contact.phone || '',
            address: contact.address || ''
        });
        setShowAddForm(true);
    };

    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
            String(contact.fullName || '').toLowerCase().includes(searchLower) ||
            String(contact.firstName || '').toLowerCase().includes(searchLower) ||
            String(contact.lastName || '').toLowerCase().includes(searchLower) ||
            String(contact.company || '').toLowerCase().includes(searchLower) ||
            String(contact.department || '').toLowerCase().includes(searchLower) ||
            String(contact.phone || '').toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="flex flex-col h-full gap-6 min-h-0">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg border shadow-sm flex-none">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Kişi Ara..."
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
                        <span className="font-medium text-slate-700">{contacts.length}</span> Kişi
                    </div>
                    {userRole === 'admin' && (
                        <Button onClick={() => {
                            setEditingContact(null);
                            setFormData({
                                fullName: '',
                                company: '',
                                company: '',
                                department: '',
                                title: '',
                                phone: '',
                                address: ''
                            });
                            setShowAddForm(!showAddForm);
                        }} className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> Yeni Kişi
                        </Button>
                    )}
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && userRole === 'admin' && (
                <Card className="animate-in fade-in slide-in-from-top-4 flex-none overflow-y-auto max-h-[40vh] border shadow-md z-30 mb-4">
                    <CardHeader className="pb-3 sticky top-0 bg-white z-20 border-b">
                        <CardTitle>{editingContact ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-sm font-medium">Ad Soyad</label>
                                <Input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Ad Soyad" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Firma</label>
                                <Input required name="company" value={formData.company} onChange={handleInputChange} placeholder="Firma Adı" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Departman</label>
                                <Input name="department" value={formData.department} onChange={handleInputChange} placeholder="Departman" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ünvan</label>
                                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ünvan" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Telefon</label>
                                <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Telefon No" />
                            </div>
                            <div className="space-y-2 lg:col-span-3">
                                <label className="text-sm font-medium">Adres</label>
                                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Açık Adres" />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t p-4 -mx-6 -mb-6">
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>İptal</Button>
                                <Button type="submit">{editingContact ? 'Güncelle' : 'Kaydet'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Contacts Table */}
            <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <div className="overflow-auto flex-1 w-full h-full">
                    <table className="w-full text-sm text-left table-fixed min-w-[800px]">
                        <thead className="text-slate-600 font-medium bg-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-[20%] px-4 py-3 whitespace-nowrap bg-slate-100">Ad Soyad</th>
                                <th className="w-[15%] px-4 py-3 whitespace-nowrap bg-slate-100">Firma</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Departman</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Ünvan</th>
                                <th className="w-[12%] px-4 py-3 whitespace-nowrap bg-slate-100">Telefon</th>
                                <th className="w-[20%] px-4 py-3 whitespace-nowrap bg-slate-100">Adres</th>
                                {userRole === 'admin' && <th className="w-[100px] px-4 py-3 whitespace-nowrap text-right bg-slate-100">İşlemler</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-2"></div>
                                            Yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 border-b border-slate-50 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}
                                        </td>
                                        <td className="px-4 py-3 border-b border-slate-50">{contact.company}</td>
                                        <td className="px-4 py-3 border-b border-slate-50">{contact.department}</td>
                                        <td className="px-4 py-3 border-b border-slate-50">{contact.title}</td>
                                        <td className="px-4 py-3 border-b border-slate-50">{contact.phone}</td>
                                        <td className="px-4 py-3 text-slate-500 truncate border-b border-slate-50" title={contact.address}>{contact.address}</td>
                                        {userRole === 'admin' && (
                                            <td className="px-4 py-3 text-right border-b border-slate-50">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleEdit(contact)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(contact.id)}
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

export default Contacts;
