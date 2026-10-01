export default function PeriodNavigator({ mode, label, dateTime, isCurrent, onPrevious, onCurrent, onNext, actions = null }) {
    const isYear = mode === "year";
    const unit = isYear ? "year" : "month";
    return <div className="period-navigator mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="btn-group" role="group" aria-label={`${isYear ? "Year" : "Month"} navigation`}>
                <button type="button" className="btn btn-outline-secondary period-arrow-button" aria-label={`Previous ${unit}`} onClick={onPrevious}>‹</button>
                <button type="button" className="btn btn-outline-primary" aria-label={`Go to current ${unit}`} disabled={isCurrent} onClick={onCurrent}>{isYear ? "This Year" : "Today"}</button>
                <button type="button" className="btn btn-outline-secondary period-arrow-button" aria-label={`Next ${unit}`} onClick={onNext}>›</button>
            </div>
            <time className="fw-semibold period-label" dateTime={dateTime}>{label}</time>
        </div>
        {actions && <div className="period-actions">{actions}</div>}
    </div>;
}
