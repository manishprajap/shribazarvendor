import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonToast,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonContent,
    IonAlert,
} from '@ionic/react';
import {
    searchOutline,
    addOutline,
    callOutline,
    locationOutline,
    alertCircleOutline,
    peopleOutline,
    createOutline,
    trashOutline,
    eyeOutline,
    checkmarkCircleOutline,
} from 'ionicons/icons';
import type { RefresherEventDetail } from '@ionic/core';
import { apiGet, apiPut, apiPost, apiDelete } from '../api';
import './Login.css';
import './PackerList.css';
import Layout from './Layout';

// ✅ UPDATED TYPE (API MATCH)
interface Packer {
    packer_id: number;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    availability_status: 'Active' | 'Inactive' | 'On Leave';
    is_deleted: number; // 1 = normal/active record, 0 = deactivated (soft-deleted)
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

const PackerList: React.FC = () => {
    const history = useHistory();

    const [packers, setPackers] = useState<Packer[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [query, setQuery] = useState('');
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', color: 'danger' });

    // Delete (deactivate) confirmation state
    const [deleteTarget, setDeleteTarget] = useState<Packer | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Activate confirmation state
    const [activateTarget, setActivateTarget] = useState<Packer | null>(null);
    const [activatingId, setActivatingId] = useState<number | null>(null);

    // ✅ LOAD DATA FIXED
    const loadPackers = useCallback(async () => {
        setPageError('');
        try {
            const res = await apiGet('/vendor/packers');
            setPackers(res.data ?? []);
        } catch (err) {
            setPageError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPackers();
    }, [loadPackers]);

    const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
        await loadPackers();
        e.detail.complete();
    };

    // ✅ STATUS TOGGLE (Active / Inactive)
    const handleToggleStatus = useCallback(async (packer: Packer, e?: React.MouseEvent) => {
        e?.stopPropagation(); // don't trigger card click navigation

        const nextStatus: Packer['availability_status'] =
            packer.availability_status === 'Active' ? 'Inactive' : 'Active';

        setTogglingId(packer.packer_id);

        try {
            await apiPut(`/vendor/packers/${packer.packer_id}/status`, {
                status: nextStatus,
            });

            setPackers((prev) =>
                prev.map((p) =>
                    p.packer_id === packer.packer_id
                        ? { ...p, availability_status: nextStatus }
                        : p
                )
            );

            setToast({
                open: true,
                message: `${packer.name} marked ${nextStatus}`,
                color: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: getErrorMessage(err), color: 'danger' });
        } finally {
            setTogglingId(null);
        }
    }, []);

    // ✅ VIEW particular packer's detail card
    const handleViewPacker = useCallback(
        (packer: Packer) => {
            history.push(`/packers/${packer.packer_id}`);
        },
        [history]
    );

    // ✅ EDIT packer
    const handleEditPacker = useCallback(
        (packer: Packer, e: React.MouseEvent) => {
            e.stopPropagation(); // don't trigger card click navigation
            history.push(`/packers/${packer.packer_id}/edit`);
        },
        [history]
    );

    // ✅ DELETE (deactivate) packer — open confirm dialog
    const askDeletePacker = useCallback((packer: Packer, e: React.MouseEvent) => {
        e.stopPropagation(); // don't trigger card click navigation
        setDeleteTarget(packer);
    }, []);

    // ✅ DELETE (deactivate) packer — confirmed
    const confirmDeletePacker = useCallback(async () => {
        if (!deleteTarget) return;
        const packer = deleteTarget;

        setDeletingId(packer.packer_id);
        setDeleteTarget(null);

        try {
            const res = await apiDelete(`/vendor/packers/${packer.packer_id}`);

            // Record list se hatta nahi — bas deactivated state mein update hota hai
            setPackers((prev) =>
                prev.map((p) =>
                    p.packer_id === packer.packer_id
                        ? {
                              ...p,
                              is_deleted: 0,
                              availability_status: res?.data?.availability_status ?? 'Inactive',
                          }
                        : p
                )
            );

            setToast({
                open: true,
                message: `${packer.name} deactivated`,
                color: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: getErrorMessage(err), color: 'danger' });
        } finally {
            setDeletingId(null);
        }
    }, [deleteTarget]);

    // ✅ ACTIVATE packer — open confirm dialog
    const askActivatePacker = useCallback((packer: Packer, e: React.MouseEvent) => {
        e.stopPropagation(); // don't trigger card click navigation
        setActivateTarget(packer);
    }, []);

    // ✅ ACTIVATE packer — confirmed
    const confirmActivatePacker = useCallback(async () => {
        if (!activateTarget) return;
        const packer = activateTarget;

        setActivatingId(packer.packer_id);
        setActivateTarget(null);

        try {
            const res = await apiPost(`/vendor/packers/${packer.packer_id}/restore`, {});

            setPackers((prev) =>
                prev.map((p) =>
                    p.packer_id === packer.packer_id
                        ? {
                              ...p,
                              is_deleted: 1,
                              availability_status: res?.data?.availability_status ?? 'Active',
                          }
                        : p
                )
            );

            setToast({
                open: true,
                message: `${packer.name} activated`,
                color: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: getErrorMessage(err), color: 'danger' });
        } finally {
            setActivatingId(null);
        }
    }, [activateTarget]);

    // ✅ SEARCH FIXED
    const filteredPackers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return packers;

        return packers.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.phone.includes(q) ||
                (p.city ?? '').toLowerCase().includes(q)
        );
    }, [packers, query]);

    return (
        <Layout title="Packers" activeNav="Packers">
            <IonContent fullscreen>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent />
                </IonRefresher>

                <div className="pl-list-root">

                    <div className="pl-list-header">
                        <div>
                            <p className="pl-list-title">Your Packers</p>
                            <p className="pl-list-subtitle">
                                {loading
                                    ? 'Loading…'
                                    : `${packers.length} packer${packers.length === 1 ? '' : 's'} registered`}
                            </p>
                        </div>

                        <button
                            className="pl-add-btn"
                            onClick={() => history.push('/packers/new')}
                        >
                            <IonIcon icon={addOutline} />
                            Add Packer
                        </button>
                    </div>

                    <div className="pl-search-wrapper">
                        <IonIcon icon={searchOutline} className="pl-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, city"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-search-input"
                        />
                    </div>

                    {pageError && (
                        <div className="error-banner">
                            <IonIcon icon={alertCircleOutline} />
                            <span>{pageError}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="pl-skeleton-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="pl-skeleton-card" />
                            ))}
                        </div>
                    ) : filteredPackers.length === 0 ? (
                        <div className="pl-empty-state">
                            <IonIcon icon={peopleOutline} className="pl-empty-icon" />
                            <p className="pl-empty-title">No packers found</p>
                        </div>
                    ) : (
                        <div className="pl-cards">
                            {filteredPackers.map((packer) => {
                                const isDeactivated = packer.is_deleted === 0;

                                return (
                                    <div key={packer.packer_id} className="pl-order-card">

                                        {/* Top row: avatar + name + id, status pill */}
                                        <div className="pl-order-card-top">
                                            <div className="pl-order-card-top-left">
                                                <div className="pl-packer-avatar">
                                                    {getInitials(packer.name)}
                                                </div>
                                                <div>
                                                    <p className="pl-order-packer-name">{packer.name}</p>
                                                    <p className="pl-order-packer-id">Packer #{packer.packer_id}</p>
                                                </div>
                                            </div>

                                            <span
                                                className={`pl-status-pill ${
                                                    isDeactivated
                                                        ? 'is-deleted'
                                                        : packer.availability_status === 'Active'
                                                        ? 'is-active'
                                                        : 'is-inactive'
                                                }`}
                                            >
                                                {isDeactivated ? 'DEACTIVATED' : packer.availability_status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Contact meta */}
                                        <div className="pl-order-card-meta">
                                            <span className="pl-meta-item">
                                                <IonIcon icon={callOutline} />
                                                {packer.phone || '—'}
                                            </span>
                                            <span className="pl-meta-item">
                                                <IonIcon icon={locationOutline} />
                                                {packer.city || '—'}
                                            </span>
                                        </div>

                                        {/* Availability box — deactivated packer ke liye hide */}
                                        {!isDeactivated && (
                                            <div className="pl-order-status-box">
                                                <span className="pl-order-status-box-label">Availability</span>
                                                <button
                                                    className="pl-assign-btn"
                                                    disabled={togglingId === packer.packer_id}
                                                    onClick={(e) => handleToggleStatus(packer, e)}
                                                >
                                                    {togglingId === packer.packer_id ? (
                                                        <span className="btn-spinner" />
                                                    ) : packer.availability_status === 'Active' ? (
                                                        'Mark Inactive'
                                                    ) : (
                                                        'Mark Active'
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Bottom actions row: View / Edit / Delete-or-Activate */}
                                        <div className="pl-order-actions-row">
                                            <button
                                                className="pl-order-action-link view"
                                                onClick={() => handleViewPacker(packer)}
                                            >
                                                <IonIcon icon={eyeOutline} />
                                                View
                                            </button>

                                            <button
                                                className="pl-order-action-link edit"
                                                onClick={(e) => handleEditPacker(packer, e)}
                                            >
                                                <IonIcon icon={createOutline} />
                                                Edit
                                            </button>

                                            {isDeactivated ? (
                                                <button
                                                    className="pl-order-action-link activate"
                                                    disabled={activatingId === packer.packer_id}
                                                    onClick={(e) => askActivatePacker(packer, e)}
                                                >
                                                    {activatingId === packer.packer_id ? (
                                                        <span className="btn-spinner" />
                                                    ) : (
                                                        <>
                                                            <IonIcon icon={checkmarkCircleOutline} />
                                                            Activate
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    className="pl-order-action-link delete"
                                                    disabled={deletingId === packer.packer_id}
                                                    onClick={(e) => askDeletePacker(packer, e)}
                                                >
                                                    {deletingId === packer.packer_id ? (
                                                        <span className="btn-spinner" />
                                                    ) : (
                                                        <>
                                                            <IonIcon icon={trashOutline} />
                                                            Delete
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
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

                {/* Delete (deactivate) confirmation */}
                <IonAlert
                    isOpen={!!deleteTarget}
                    header="Delete Packer"
                    message={
                        deleteTarget
                            ? `Are you sure you want to delete ${deleteTarget.name}? They will be marked inactive and can be reactivated later.`
                            : ''
                    }
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setDeleteTarget(null),
                        },
                        {
                            text: 'Delete',
                            role: 'destructive',
                            handler: confirmDeletePacker,
                        },
                    ]}
                    onDidDismiss={() => setDeleteTarget(null)}
                />

                {/* Activate confirmation */}
                <IonAlert
                    isOpen={!!activateTarget}
                    header="Activate Packer"
                    message={
                        activateTarget
                            ? `Activate ${activateTarget.name} again? They will become Active and visible for assignment.`
                            : ''
                    }
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setActivateTarget(null),
                        },
                        {
                            text: 'Activate',
                            handler: confirmActivatePacker,
                        },
                    ]}
                    onDidDismiss={() => setActivateTarget(null)}
                />
            </IonContent>
        </Layout>
    );
};

export default PackerList;