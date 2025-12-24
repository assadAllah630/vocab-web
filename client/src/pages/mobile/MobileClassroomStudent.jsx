import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, BookOpen, Users, LogOut,
    GraduationCap, Clock, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';
import { getClassroom, getClassroomStudents, leaveClassroom, getClassroomAssignments } from '../../api';

const MobileClassroomStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [activeTab, setActiveTab] = useState('assignments'); // assignments, classmates, info
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        loadClassroomData();
    }, [id]);

    const loadClassroomData = async () => {
        try {
            setLoading(true);
            const [classRes, studentsRes, assignRes] = await Promise.all([
                getClassroom(id),
                getClassroomStudents(id),
                getClassroomAssignments(id)
            ]);

            setClassroom(classRes.data);
            setStudents(studentsRes.data.students || []);
            setAssignments(assignRes.data);

        } catch (err) {
            console.error('Failed to load classroom:', err);
            // If forbidden/not found, redirect back
            if (err.response?.status === 403 || err.response?.status === 404) {
                navigate('/m/classes');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm(`Are you sure you want to leave ${classroom.name}?`)) return;

        try {
            setLeaving(true);
            await leaveClassroom(id);
            navigate('/m/classes');
        } catch (err) {
            console.error('Failed to leave:', err);
            setLeaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!classroom) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white pb-20">
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate('/m/classes')}
                        className="p-2 -ml-2 hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 overflow-hidden">
                        <h1 className="text-xl font-bold truncate">{classroom.name}</h1>
                        <p className="text-sm text-slate-400">
                            {classroom.teacher_name}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assignments'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400'
                            }`}
                    >
                        Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('classmates')}
                        className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'classmates'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400'
                            }`}
                    >
                        Classmates
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400'
                            }`}
                    >
                        Info
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-4">
                        {assignments.length === 0 ? (
                            <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700 border-dashed">
                                <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="w-6 h-6 text-slate-500" />
                                </div>
                                <h3 className="text-slate-300 font-medium mb-1">No assignments yet</h3>
                                <p className="text-slate-500 text-sm">
                                    Your teacher hasn't posted any assignments.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignments.map(assign => {
                                    const status = assign.my_progress?.status || 'not_started';
                                    return (
                                        <button
                                            key={assign.id}
                                            onClick={() => navigate(`/m/assignment/${assign.id}/view`)}
                                            className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700 text-left flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold">{assign.title}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-2">
                                                        <span>Due: {new Date(assign.due_date).toLocaleDateString()}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${status === 'submitted' || status === 'graded' ? 'bg-green-500/20 text-green-400' :
                                                                status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                                                                    'bg-slate-700 text-slate-400'
                                                            }`}>
                                                            {status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-600" size={16} />
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => navigate(`/m/class/${id}/assignments`)}
                                    className="w-full py-3 text-sm text-indigo-400 font-bold hover:text-indigo-300"
                                >
                                    View Assigned & Completed History
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* CLASSMATES TAB */}
                {activeTab === 'classmates' && (
                    <div className="space-y-3">
                        <div className="text-sm text-slate-400 mb-2">
                            {students.length} Students enrolled
                        </div>
                        {students.map((student) => (
                            <div
                                key={student.student_id}
                                className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300 font-bold">
                                    {student.username[0].toUpperCase()}
                                </div>
                                <div className="font-medium">{student.username}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* INFO TAB */}
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                                Classroom Details
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-300">Language</span>
                                    <span className="font-medium flex items-center gap-1.5">
                                        <span className="text-lg">{classroom.language === 'de' ? '🇩🇪' : '🇬🇧'}</span>
                                        {classroom.language.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-t border-slate-700 pt-3">
                                    <span className="text-slate-300">Level</span>
                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-sm">
                                        {classroom.level}
                                    </span>
                                </div>
                                {classroom.description && (
                                    <div className="pt-3 border-t border-slate-700">
                                        <span className="text-slate-300 block mb-1">Description</span>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            {classroom.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleLeave}
                            disabled={leaving}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/20 mt-8"
                        >
                            {leaving ? (
                                <span>Leaving...</span>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4" />
                                    Leave Classroom
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileClassroomStudent;
