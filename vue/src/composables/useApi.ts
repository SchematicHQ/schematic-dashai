export interface CreditBalance {
  allocation: number
  usage: number
}

export interface TeamMember {
  id: string
  email: string
  name: string
  role: string
  initials: string
}

export interface DataSource {
  id: string
  name: string
  type: string
  status: string
  icon: string
}

export async function getAccessToken(): Promise<{ accessToken: string }> {
  const res = await fetch('/api/accessToken')
  if (!res.ok) throw new Error('Failed to fetch access token')
  return res.json()
}

export async function getCreditBalance(): Promise<CreditBalance | null> {
  const res = await fetch('/api/credit-balance')
  if (!res.ok) throw new Error('Failed to fetch credit balance')
  return res.json()
}

export async function getUsers(): Promise<TeamMember[]> {
  const res = await fetch('/api/users', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function addUser(user: {
  name: string
  email: string
  role: string
}): Promise<TeamMember> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Failed to add user')
  }
  return res.json()
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Failed to delete user')
  }
}

export async function getDataSources(): Promise<DataSource[]> {
  const res = await fetch('/api/data-sources', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch data sources')
  return res.json()
}

export async function addDataSource(source: {
  name: string
  type: string
  icon: string
}): Promise<DataSource> {
  const res = await fetch('/api/data-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Failed to add data source')
  }
  return res.json()
}

export async function deleteDataSource(id: string): Promise<void> {
  const res = await fetch(`/api/data-sources?id=${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Failed to remove data source')
  }
}
