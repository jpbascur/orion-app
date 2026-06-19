import { useEffect, useState } from 'react';

export const DEFAULT_SERVICE_ACCOUNT = 'ORION_SERVICE_ACCOUNT not configured';

export function useServiceAccount(initial = DEFAULT_SERVICE_ACCOUNT) {
  const [serviceAccount, setServiceAccount] = useState(initial);

  useEffect(() => {
    fetch('/api/config')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.service_account) setServiceAccount(d.service_account);
      })
      .catch(() => {});
  }, []);

  return serviceAccount;
}
