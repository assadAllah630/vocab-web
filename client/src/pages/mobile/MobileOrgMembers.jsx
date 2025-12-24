import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users, Crown, GraduationCap, Trash2, Search } from 'lucide-react';
import { Button, Card, Chip, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem } from '@heroui/react';
import { getOrgMembers, removeOrgMember, inviteOrgMember } from '../../api';

const MobileOrgMembers = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('student');

    useEffect(() => {
        loadMembers();
    }, [slug]);

    const loadMembers = async () => {
        try {
            const res = await getOrgMembers(slug);
            setMembers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (memberId) => {
        if (!confirm('Remove this member?')) return;
        await removeOrgMember(slug, memberId);
        setMembers(members.filter(m => m.id !== memberId));
    };

    const handleInvite = async () => {
        try {
            await inviteOrgMember(slug, { email: inviteEmail, role: inviteRole });
            loadMembers();
            onClose();
            setInviteEmail('');
        } catch (err) {
            console.error(err);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Crown size={14} className="text-amber-400" />;
            case 'teacher': return <Users size={14} className="text-blue-400" />;
            default: return <GraduationCap size={14} className="text-green-400" />;
        }
    };

    const filtered = members.filter(m =>
        m.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white">
            <div className="sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-[#27272A] p-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg flex-1">Members</h1>
                <Button size="sm" color="primary" onPress={onOpen}>Invite</Button>
            </div>

            <div className="p-5 space-y-4">
                <Input
                    placeholder="Search members..."
                    startContent={<Search size={18} />}
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                />

                {filtered.map(m => (
                    <Card key={m.id} className="p-4 bg-[#141416] border-[#27272A] flex-row items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center font-bold text-lg">
                            {m.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{m.user_name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{m.user_email}</p>
                        </div>
                        <Chip size="sm" variant="flat" startContent={getRoleIcon(m.role)}>
                            {m.role}
                        </Chip>
                        <button onClick={() => handleRemove(m.id)} className="p-2 text-gray-600 hover:text-red-400">
                            <Trash2 size={16} />
                        </button>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur" className="dark text-white">
                <ModalContent>
                    <ModalHeader>Invite Member</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input
                            label="Email"
                            placeholder="user@example.com"
                            value={inviteEmail}
                            onValueChange={setInviteEmail}
                        />
                        <Select
                            label="Role"
                            selectedKeys={[inviteRole]}
                            onSelectionChange={(k) => setInviteRole(Array.from(k)[0])}
                        >
                            <SelectItem key="admin">Admin</SelectItem>
                            <SelectItem key="teacher">Teacher</SelectItem>
                            <SelectItem key="student">Student</SelectItem>
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>Cancel</Button>
                        <Button color="primary" onPress={handleInvite} isDisabled={!inviteEmail}>Send Invite</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default MobileOrgMembers;
