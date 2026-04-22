import React from 'react';

const ApiState = ({ loading, error, onRetry, loadingText = 'Loading...' }) => {
  if (!loading && !error) {
    return null;
  }

  return (
    <div className="api-state">
      {loading ? <p className="api-state-loading">{loadingText}</p> : null}
      {error ? (
        <div className="api-state-error">
          <p>{error}</p>
          {onRetry ? (
            <button type="button" className="btn-primary" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ApiState;
