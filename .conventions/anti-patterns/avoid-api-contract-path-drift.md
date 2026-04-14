# Avoid API Contract Path Drift Between Frontend Stores and Laravel Routes

Store endpoints must mirror `backend/routes/api.php`. Do not invent near-match paths in frontend models.

## BAD

```ts
await apiClient.get(`/api/v1/hypotheses/${id}/committee`)
await apiClient.post(`/api/v1/hypotheses/${id}/committee/vote`, payload)
await apiClient.post(`/api/v1/hypotheses/${id}/committee/finalize`)
await apiClient.put(`/api/v1/hypotheses/${id}/deep-dive/stages/${stageId}`, body)
```

## GOOD

```ts
await apiClient.get(`/api/v1/hypotheses/${id}/votes`)
await apiClient.post(`/api/v1/hypotheses/${id}/votes`, payload)
await apiClient.post(`/api/v1/hypotheses/${id}/finalize-decision`)
await apiClient.put(`/api/v1/hypotheses/${id}/deep-dive/${stageId}`, body)
```

**Why:** Route drift breaks integration silently and causes false-positive frontend behavior in mock mode. `backend/routes/api.php` is canonical for path shape.
