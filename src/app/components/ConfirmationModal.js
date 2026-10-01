'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DialogContext = createContext(null);

export const useAppDialog = () => {
    const value = useContext(DialogContext);
    if (!value) throw new Error("useAppDialog must be used inside AppDialogProvider.");
    return value;
};

export function AppDialogProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const resolver = useRef(null);
    const trigger = useRef(null);
    const modal = useRef(null);

    const open = useCallback(options => new Promise(resolve => {
        if (resolver.current) {
            resolve(false);
            return;
        }
        trigger.current = document.activeElement;
        resolver.current = resolve;
        setDialog({
            title: "Confirm action",
            message: "This action cannot be undone.",
            confirmLabel: "Confirm",
            cancelLabel: "Cancel",
            cancelable: true,
            ...options,
        });
    }), []);

    const close = useCallback(result => {
        const resolve = resolver.current;
        resolver.current = null;
        setDialog(null);
        requestAnimationFrame(() => {
            if (trigger.current?.isConnected) trigger.current.focus();
            trigger.current = null;
            resolve?.(result);
        });
    }, []);

    const confirm = useCallback(options => open({ ...options, cancelable: true }), [open]);
    const notify = useCallback(options => open({ ...options, cancelable: false, confirmLabel: options?.confirmLabel || "Close" }), [open]);

    useEffect(() => {
        if (!dialog) return;
        modal.current?.focus();
    }, [dialog]);

    const handleKeyDown = event => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close(false);
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = [...(modal.current?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const modalView = dialog && typeof document !== "undefined" ? createPortal(
        <div className="planner-settings-backdrop confirmation-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && dialog.cancelable && close(false)}>
            <section ref={modal} className="card shadow confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" tabIndex="-1" onKeyDown={handleKeyDown}>
                <div className="card-body">
                    <h2 id="confirmation-title" className="h4">{dialog.title}</h2>
                    <p id="confirmation-message" className="mb-4">{dialog.message}</p>
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        {dialog.cancelable && <button type="button" className="btn btn-secondary" onClick={() => close(false)}>{dialog.cancelLabel}</button>}
                        <button type="button" className="btn btn-danger" onClick={() => close(true)}>{dialog.confirmLabel}</button>
                    </div>
                </div>
            </section>
        </div>,
        document.body,
    ) : null;

    return <DialogContext.Provider value={{ confirm, notify }}>
        <div className="app-dialog-content" inert={dialog ? true : undefined} aria-hidden={dialog ? "true" : undefined}>{children}</div>
        {modalView}
    </DialogContext.Provider>;
}
