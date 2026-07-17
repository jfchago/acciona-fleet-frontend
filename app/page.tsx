'use client';

import { FormEvent, useState } from 'react';
import { api } from '../src/lib/api';

export default function Home() {
  const [value, setValue] = useState('local sample');
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    const response = await api.POST('/api/v1/examples', { body: { value } });
    if (response.error) setError(response.error.detail ?? 'No se pudo crear');
    else setResult(response.data);
  }

  return <main><h1>Backend API First</h1><p>Next.js + TypeScript contra Spring Boot.</p><form onSubmit={submit}><label htmlFor="value">Valor</label><br /><input id="value" value={value} maxLength={255} onChange={event => setValue(event.target.value)} /><br /><button type="submit">Crear ejemplo</button></form>{error && <p role="alert">{error}</p>}{result !== undefined && <pre>{JSON.stringify(result, null, 2)}</pre>}</main>;
}
