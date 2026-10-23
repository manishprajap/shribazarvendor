import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    IonToast,
    IonIcon,
    IonContent,
    IonAlert,
} from '@ionic/react';
import {
    callOutline,
    mailOutline,
    locationOutline,
    alertCircleOutline,
    createOutline,
    trashOutline,
    arrowBackOutline,
    checkmarkCircleOutline,
    timeOutline,
    idCardOutline,
} from 'ionicons/icons';
import { apiGet, apiPut, apiDelete } from '../api';
import './Login.css';
import './PackerView.css';
import Layout from './Layout';

interface Packer {
    packer_id: number;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    address?: string | null;
    availability_status: 'Active' | 'Inactive' | 'On Leave';
    created_at?: string | null;
    shift_start?: string | null;
    shift_end?: string | null;
    total_orders_packed?: number | null;
}

interface ToastState {
    open: boolean;
    message: string;
    color: 'danger' | 'success';
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Something went wrong.';
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

const PackerView: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const [packer, setPacker] = useState<Packer | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', color: 'danger' });

    const loadPacker = useCallback(async () => {
        setPageError('');
        try {
            const res = await apiGet(`/vendor/packers/${id}`);
            setPacker(res.data ?? null);
        } catch (err) {
            setPageError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadPacker();
    }, [loadPacker]);

    const handleToggleStatus = useCallback(async () => {
        if (!packer) return;

        const nextStatus: Packer['availability_status'] =
            packer.availability_status === 'Active' ? 'Inactive' : 'Active';

        setToggling(true);
        try {
            await apiPut(`/vendor/packers/${packer.packer_id}/status`, {
                status: nextStatus,
            });

            setPacker((prev) => (prev ? { ...prev, availability_status: nextStatus } : prev));

            setToast({
                open: true,
                message: `${packer.name} marked ${nextStatus}`,
                color: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: getErrorMessage(err), color: 'danger' });
        } finally {
            setToggling(false);
        }
    }, [packer]);

    const handleDelete = useCallback(async () => {
        if (!packer) return;
        setConfirmDelete(false);
        setDeleting(true);

        try {
            await apiDelete(`/vendor/packers/${packer.packer_id}`);
            setToast({ open: true, message: `${packer.name} deleted`, color: 'success' });
            setTimeout(() => history.push('/packers'), 600);
        } catch (err) {
            setToast({ open: true, message: getErrorMessage(err), color: 'danger' });
            setDeleting(false);
        }
    }, [packer, history]);

    return (
        <Layout title="Packer Details" activeNav="Packers">
            <IonContent fullscreen>
                <div className="pv-root">

                    {/* Top bar */}
                    <div className="pv-topbar">
                        <button className="pv-back-btn" onClick={() => history.push('/packers')}>
                            <IonIcon icon={arrowBackOutline} />
                            Back
                        </button>
                    </div>

                    {pageError && (
                        <div className="error-banner">
                            <IonIcon icon={alertCircleOutline} />
                            <span>{pageError}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="pv-skeleton-card" />
                    ) : !packer ? (
                        <div className="pv-empty-state">
                            <IonIcon icon={alertCircleOutline} className="pv-empty-icon" />
                            <p className="pv-empty-title">Packer not found</p>
                        </div>
                    ) : (
                        <>
                            {/* Hero card */}
                            <div className="pv-hero-card">
                                <div className="pv-hero-top">
                                    <div className="pv-avatar-lg">{getInitials(packer.name)}</div>
                                    <div className="pv-hero-info">
                                        <p className="pv-name">{packer.name}</p>
                                        <p className="pv-id">
                                            <IonIcon icon={idCardOutline} />
                                            Packer #{packer.packer_id}
                                        </p>
                                    </div>
                                    <span
                                        className={`pv-status-pill ${
                                            packer.availability_status === 'Active'
                                                ? 'is-active'
                                                : packer.availability_status === 'On Leave'
                                                ? 'is-leave'
                                                : 'is-inactive'
                                        }`}
                                    >
                                        <IonIcon icon={checkmarkCircleOutline} />
                                        {packer.availability_status.toUpperCase()}
                                    </span>
                                </div>

                                <button
                                    className="pv-toggle-btn"
                                    disabled={toggling}
                                    onClick={handleToggleStatus}
                                >
                                    {toggling ? (
                                        <span className="btn-spinner" />
                                    ) : packer.availability_status === 'Active' ? (
                                        'Mark Inactive'
                                    ) : (
                                        'Mark Active'
                                    )}
                                </button>
                            </div>

                            {/* Contact info */}
                            <div className="pv-section-card">
                                <p className="pv-section-title">Contact Information</p>

                                <div className="pv-info-row">
                                    <div className="pv-info-icon">
                                        <IonIcon icon={callOutline} />
                                    </div>
                                    <div>
                                        <p className="pv-info-label">Phone</p>
                                        <p className="pv-info-value">{packer.phone || '—'}</p>
                                    </div>
                                </div>

                                <div className="pv-info-row">
                                    <div className="pv-info-icon">
                                        <IonIcon icon={mailOutline} />
                                    </div>
                                    <div>
                                        <p className="pv-info-label">Email</p>
                                        <p className="pv-info-value">{packer.email || '—'}</p>
                                    </div>
                                </div>

                                <div className="pv-info-row">
                                    <div className="pv-info-icon">
                                        <IonIcon icon={locationOutline} />
                                    </div>
                                    <div>
                                        <p className="pv-info-label">City / Address</p>
                                        <p className="pv-info-value">
                                            {packer.address || packer.city || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Work details */}
                            <div className="pv-section-card">
                                <p className="pv-section-title">Work Details</p>

                                <div className="pv-stats-grid">
                                    <div className="pv-stat-box">
                                        <IonIcon icon={timeOutline} />
                                        <p className="pv-stat-label">Shift</p>
                                        <p className="pv-stat-value">
                                            {packer.shift_start && packer.shift_end
                                                ? `${packer.shift_start} - ${packer.shift_end}`
                                                : '—'}
                                        </p>
                                    </div>

                                    <div className="pv-stat-box">
                                        <IonIcon icon={checkmarkCircleOutline} />
                                        <p className="pv-stat-label">Orders Packed</p>
                                        <p className="pv-stat-value">
                                            {packer.total_orders_packed ?? '—'}
                                        </p>
                                    </div>

                                    <div className="pv-stat-box">
                                        <IonIcon icon={idCardOutline} />
                                        <p className="pv-stat-label">Joined On</p>
                                        <p className="pv-stat-value">{formatDate(packer.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pv-actions-row">
                                <button
                                    className="pv-action-btn edit"
                                    onClick={() => history.push(`/packers/${packer.packer_id}/edit`)}
                                >
                                    <IonIcon icon={createOutline} />
                                    Edit Packer
                                </button>

                                <button
                                    className="pv-action-btn delete"
                                    disabled={deleting}
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    {deleting ? (
                                        <span className="btn-spinner" />
                                    ) : (
                                        <>
                                            <IonIcon icon={trashOutline} />
                                            Delete Packer
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <IonToast
                    isOpen={toast.open}
                    message={toast.message}
                    duration={2500}
                    color={toast.color}
                    position="top"
                    onDidDismiss={() => setToast((t) => ({ ...t, open: false }))}
                />

                <IonAlert
                    isOpen={confirmDelete}
                    header="Delete Packer"
                    message={
                        packer
                            ? `Are you sure you want to delete ${packer.name}? This cannot be undone.`
                            : ''
                    }
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setConfirmDelete(false),
                        },
                        {
                            text: 'Delete',
                            role: 'destructive',
                            handler: handleDelete,
                        },
                    ]}
                    onDidDismiss={() => setConfirmDelete(false)}
                />
            </IonContent>
        </Layout>
    );
};

export default PackerView;