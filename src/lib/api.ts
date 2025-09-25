const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access');
}

async function tryRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/accounts/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.access) localStorage.setItem('access', data.access);
    return !!data?.access;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  console.log('API Fetch:', `${API_BASE}${path}`, { headers });
  
  try {
    let res = await fetch(`${API_BASE}${path}`, { 
      ...options, 
      headers, 
      credentials: 'include',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    console.log('API Response:', res.status, res.statusText);
    
    if (res.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        const newToken = getToken();
        const retryHeaders = { ...headers };
        if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_BASE}${path}`, { 
          ...options, 
          headers: retryHeaders, 
          credentials: 'include',
          signal: AbortSignal.timeout(10000),
        });
      }
    }
    
    if (!res.ok) {
      const text = await res.text();
      console.error('API Error:', text);
      throw new Error(text || `HTTP ${res.status}`);
    }
    
    const ct = res.headers.get('content-type') || '';
    return (ct.includes('application/json') ? res.json() : (await res.text())) as T;
  } catch (error: any) {
    // Handle network errors and server connection issues
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK_CHANGED')) {
      throw new Error('Server is not available. Please check your connection and try again.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

export async function login(username: string, password: string) {
  const data = await apiFetch<{ access: string; refresh: string }>(
    '/accounts/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
        try {
          const me = await getMe();
          localStorage.setItem('role', (me as any).role || '');
          localStorage.setItem('username', (me as any).username || '');
          localStorage.setItem('user_id', (me as any).id || '');
          // Trigger auth change event to update Nav component
          window.dispatchEvent(new Event('auth-changed'));
        } catch {}
  }
  return data;
}

export async function register(payload: { email: string; username: string; password: string; role?: string }) {
  const data = await apiFetch('/accounts/register', { method: 'POST', body: JSON.stringify(payload) });
  if (typeof window !== 'undefined') {
    // Trigger auth change event to update Nav component
    window.dispatchEvent(new Event('auth-changed'));
  }
  return data;
}

export async function getBooks(page?: number, pageSize?: number) {
  if (page && pageSize) {
    return apiFetch(`/books?page=${page}&page_size=${pageSize}`);
  }
  return apiFetch('/books');
}

export async function getTranslationRequests() {
  return apiFetch('/translations/requests');
}

export async function getMe() {
  return apiFetch('/accounts/me');
}

export async function getTranslation(id: string) {
  return apiFetch(`/translations/${id}`);
}

export async function getSampleTranslation(id: string) {
  return apiFetch(`/translations/samples/${id}`);
}

export async function getBookPages(bookId: string, page?: number, pageSize?: number) {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('page_size', pageSize.toString());
  
  const queryString = params.toString();
  return apiFetch(`/books/${bookId}/pages${queryString ? `?${queryString}` : ''}`);
}

export async function getBookSamplePages(bookId: string) {
  return apiFetch(`/books/${bookId}/sample-pages`);
}

export async function whisperSTT(audioFile: File, language?: string) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  if (language) {
    formData.append('language', language);
  }
  
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const response = await fetch(`${API_BASE}/translations/whisper/stt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'STT request failed');
  }
  
  return response.json();
}

export async function whisperHealth() {
  return apiFetch('/translations/whisper/health');
}

// Translator Profile API functions
export async function getTranslatorProfile(username?: string) {
  if (username) {
    return apiFetch(`/translations/profile/${username}/`);
  }
  return apiFetch('/translations/profile/');
}

export async function updateTranslatorProfile(data: any) {
  return apiFetch('/translations/profile/', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}

export async function getTranslatorProfiles(params?: {
  search?: string;
  languages?: string[];
  specializations?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  min_experience?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }
  
  const queryString = queryParams.toString();
  return apiFetch(`/translations/profiles/${queryString ? `?${queryString}` : ''}`);
}

export async function getTranslatorStats() {
  return apiFetch('/translations/profile/stats/');
}

export async function getTranslatorSkills() {
  return apiFetch('/translations/profile/skills/');
}

export async function addTranslatorSkill(skill: any) {
  return apiFetch('/translations/profile/skills/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skill)
  });
}

export async function getTranslatorPortfolio() {
  return apiFetch('/translations/profile/portfolio/');
}

export async function addPortfolioItem(item: any) {
  return apiFetch('/translations/profile/portfolio/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item)
  });
}

export async function createTranslatorReview(data: {
  translator_id: string;
  translation_id: string;
  rating: number;
  comment?: string;
}) {
  return apiFetch('/translations/profile/review/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}

export async function getTranslationProgress(id: string) {
  return apiFetch(`/translations/${id}/progress`);
}

export async function submitSentence(payload: { translation: string; translated_text: string; original_page?: string; confidence_score?: number }) {
  return apiFetch('/translations/sentences', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateSentence(sentenceId: string, payload: { translated_text: string }) {
  return apiFetch(`/translations/sentences/${sentenceId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function getApplicationTranslations(applicationId: string) {
  return apiFetch(`/translations/application/${applicationId}`);
}

export async function reviewTranslation(id: string, status: 'approved' | 'rejected') {
  return apiFetch(`/translations/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function reviewSample(id: string, status: 'approved' | 'rejected') {
  return apiFetch(`/translations/samples/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function submitSample(payload: { book: string; page: string; original_text: string; translated_text: string }) {
  return apiFetch('/translations/samples', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listSamples(params?: { book?: string }) {
  const q = params?.book ? `?book=${encodeURIComponent(params.book)}` : '';
  return apiFetch(`/translations/samples/list${q}`);
}

export async function getUserSamplesForBook(bookId: string) {
  return apiFetch(`/translations/samples/list?book=${encodeURIComponent(bookId)}`);
}

// Milestone management
export async function createMilestone(payload: { contract: string; title: string; amount_cents: number }) {
  return apiFetch('/payments/milestones', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getContractMilestones(contractId: string) {
  return apiFetch(`/payments/contracts/${contractId}/milestones`);
}

export async function updateMilestone(milestoneId: string, payload: { title?: string; amount_cents?: number }) {
  return apiFetch(`/payments/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteMilestone(milestoneId: string) {
  return apiFetch(`/payments/milestones/${milestoneId}/delete`, { method: 'DELETE' });
}

// Translator applications
export async function applyToRequest(requestId: string, motivation?: string) {
  return apiFetch(`/translations/requests/${requestId}/apply`, { method: 'POST', body: JSON.stringify({ motivation }) });
}

// Delete translation request
export async function deleteTranslationRequest(requestId: string) {
  return apiFetch(`/translations/requests/${requestId}`, { method: 'DELETE' });
}

export async function listRequestApplications(requestId: string) {
  return apiFetch(`/translations/requests/${requestId}/applications`);
}

export async function checkUserApplication(requestId: string) {
  return apiFetch(`/translations/requests/${requestId}/my-application`);
}

export async function acceptApplication(applicationId: string, assignedPages?: number[], assignedBudgetCents?: number) {
  const body: any = {};
  if (assignedPages) body.assigned_pages = assignedPages;
  if (assignedBudgetCents) body.assigned_budget_cents = assignedBudgetCents;
  
  return apiFetch(`/translations/applications/${applicationId}/accept`, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  });
}

export async function deleteApplication(applicationId: string) {
  return apiFetch(`/translations/applications/${applicationId}/delete`, { method: 'DELETE' });
}

// Payments helpers
export async function getContracts() {
  return apiFetch('/payments/contracts');
}

export async function createContract(payload: { application: string; total_amount_cents: number }) {
  return apiFetch('/payments/contracts/create', { method: 'POST', body: JSON.stringify(payload) });
}

export async function signContract(contractId: string) {
  return apiFetch(`/payments/contracts/${contractId}/sign`, { method: 'PUT' });
}

export async function getEscrows() {
  return apiFetch('/payments/escrow');
}

export async function getReaderTranslations() {
  return apiFetch('/translations/reader-translations');
}

export async function fundEscrow(escrowId: string) {
  return apiFetch(`/payments/escrow/${escrowId}/fund`, { method: 'PUT' });
}

export async function releaseEscrow(escrowId: string) {
  return apiFetch(`/payments/escrow/${escrowId}/release`, { method: 'PUT' });
}

export async function completeMilestone(milestoneId: string) {
  return apiFetch(`/payments/milestones/${milestoneId}/complete`, { method: 'PUT' });
}

// Speech/TTS helpers
export async function speechStart() {
  return apiFetch('/speech/start', { method: 'POST' });
}

export async function speechStop() {
  return apiFetch('/speech/stop', { method: 'POST' });
}

export async function getTranscription(id: string) {
  return apiFetch(`/speech/${id}/transcription`);
}

export async function generateAudio(text: string): Promise<Blob> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/speech/audio/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to generate audio');
  return res.blob();
}

// Enhanced Profile API functions
export async function getProfile() {
  const response = await apiFetch('/accounts/profile/');
  return response;
}

export async function updateProfile(data: any) {
  const response = await apiFetch('/accounts/profile/', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response;
}

export async function getPublicProfile(username: string) {
  const response = await apiFetch(`/accounts/profile/${username}/`);
  return response;
}

export async function getProfiles(params?: { 
  role?: string; 
  location?: string; 
  languages?: string; 
  available_only?: boolean 
}) {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.location) queryParams.append('location', params.location);
  if (params?.languages) queryParams.append('languages', params.languages);
  if (params?.available_only) queryParams.append('available_only', params.available_only.toString());
  
  const response = await apiFetch(`/accounts/profiles/?${queryParams.toString()}`);
  return response;
}

export async function getProfileStats(username: string) {
  const response = await apiFetch(`/accounts/profiles/${username}/stats/`);
  return response;
}

export async function getWallet() {
  const response = await apiFetch('/accounts/wallet/');
  return response;
}

