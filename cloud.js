const SUPABASE_JS_VERSION = '2.111.0';

const Cloud = {
  client: null,
  user: null,
  configured: false,
  systemProfiles: [],
  aiConnections: [],
  listeners: new Set(),

  emit(event, payload = {}) {
    for (const fn of this.listeners) {
      try { fn(event, payload); } catch {}
    }
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  async init() {
    let config;
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (!res.ok) throw new Error('config unavailable');
      config = await res.json();
    } catch {
      this.emit('unavailable', { reason: 'Kein Supabase-Deployment konfiguriert.' });
      return { configured: false };
    }

    if (!config?.supabaseUrl || !config?.supabasePublishableKey) {
      this.emit('unavailable', { reason: 'Supabase-Variablen fehlen.' });
      return { configured: false };
    }

    const { createClient } = await import(`https://esm.sh/@supabase/supabase-js@${SUPABASE_JS_VERSION}?bundle`);
    this.client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    this.configured = true;

    const { data } = await this.client.auth.getSession();
    this.user = data?.session?.user || null;
    this.client.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user || null;
      this.emit('auth', { user: this.user });
    });

    try { this.systemProfiles = await this.loadSystemProfiles(); } catch { this.systemProfiles = []; }
    this.emit('ready', { user: this.user, systemProfiles: this.systemProfiles });
    return { configured: true, user: this.user, systemProfiles: this.systemProfiles };
  },

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    return data;
  },

  async signUp(email, password) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
    this.user = null;
  },

  assertUser() {
    if (!this.user) throw new Error('Nicht angemeldet.');
    return this.user.id;
  },

  async authHeaders() {
    if (!this.client) return {};
    const { data } = await this.client.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async listAiConnections() {
    const userId = this.assertUser();
    const { data, error } = await this.client
      .from('sitebrief_ai_connections')
      .select('provider,last4,updated_at')
      .eq('user_id', userId)
      .order('provider', { ascending: true });
    if (error) throw error;
    this.aiConnections = data || [];
    return this.aiConnections;
  },

  async saveAiConnection(provider, secret) {
    this.assertUser();
    const { data, error } = await this.client.rpc('sitebrief_set_ai_connection', {
      p_provider: provider,
      p_secret: secret
    });
    if (error) throw error;
    await this.listAiConnections();
    return data;
  },

  async deleteAiConnection(provider) {
    this.assertUser();
    const { error } = await this.client.rpc('sitebrief_delete_ai_connection', { p_provider: provider });
    if (error) throw error;
    await this.listAiConnections();
  },

  async loadSystemProfiles() {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('sitebrief_system_profiles')
      .select('id,name,description,config,is_default,sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async loadUserBundle() {
    const userId = this.assertUser();
    const [settingsRes, profilesRes, templatesRes, modulesRes, skillsRes, projectsRes, connectionsRes] = await Promise.all([
      this.client.from('sitebrief_user_settings').select('data,active_profile_id').eq('user_id', userId).maybeSingle(),
      this.client.from('sitebrief_profiles').select('id,name,description,config,is_default,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      this.client.from('sitebrief_templates').select('id,name,tag,summary,prompt,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      this.client.from('sitebrief_modules').select('id,name,tag,summary,prompt,activation,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      this.client.from('sitebrief_agent_skills').select('id,name,agent,trigger,prompt,source_file,activation,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      this.client.from('sitebrief_projects').select('id,title,status,state,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(50),
      this.client.from('sitebrief_ai_connections').select('provider,last4,updated_at').eq('user_id', userId).order('provider', { ascending: true })
    ]);
    for (const result of [settingsRes, profilesRes, templatesRes, modulesRes, skillsRes, projectsRes, connectionsRes]) {
      if (result.error) throw result.error;
    }
    return {
      settings: settingsRes.data?.data || null,
      activeProfileId: settingsRes.data?.active_profile_id || '',
      profiles: profilesRes.data || [],
      templates: templatesRes.data || [],
      modules: modulesRes.data || [],
      skills: (skillsRes.data || []).map(x => ({ ...x, sourceFile: x.source_file || null })),
      projects: projectsRes.data || [],
      aiConnections: connectionsRes.data || []
    };
  },

  async saveUserSettings(data, activeProfileId = null) {
    const userId = this.assertUser();
    const { error } = await this.client.from('sitebrief_user_settings').upsert({
      user_id: userId,
      data,
      active_profile_id: activeProfileId || null,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async saveProfile(profile) {
    const userId = this.assertUser();
    const row = {
      user_id: userId,
      id: profile.id,
      name: profile.name,
      description: profile.description || '',
      config: profile.config || {},
      is_default: Boolean(profile.isDefault),
      updated_at: new Date().toISOString()
    };
    const { error } = await this.client.from('sitebrief_profiles').upsert(row);
    if (error) throw error;
  },

  async deleteProfile(id) {
    const userId = this.assertUser();
    const { error } = await this.client.from('sitebrief_profiles').delete().eq('user_id', userId).eq('id', id);
    if (error) throw error;
  },

  async saveLibraryItem(type, item) {
    const userId = this.assertUser();
    const table = { template: 'sitebrief_templates', module: 'sitebrief_modules', skill: 'sitebrief_agent_skills' }[type];
    if (!table) throw new Error('Unbekannter Bibliothekstyp.');
    let row;
    if (type === 'template') row = { user_id:userId,id:item.id,name:item.name,tag:item.tag||'',summary:item.summary||'',prompt:item.prompt,updated_at:new Date().toISOString() };
    if (type === 'module') row = { user_id:userId,id:item.id,name:item.name,tag:item.tag||'',summary:item.summary||'',prompt:item.prompt,activation:item.activation||'manual',updated_at:new Date().toISOString() };
    if (type === 'skill') row = { user_id:userId,id:item.id,name:item.name,agent:item.agent||'all',trigger:item.trigger||'',prompt:item.prompt,source_file:item.sourceFile||null,activation:item.activation||'manual',updated_at:new Date().toISOString() };
    const { error } = await this.client.from(table).upsert(row);
    if (error) throw error;
  },

  async deleteLibraryItem(type, id) {
    const userId = this.assertUser();
    const table = { template: 'sitebrief_templates', module: 'sitebrief_modules', skill: 'sitebrief_agent_skills' }[type];
    if (!table) throw new Error('Unbekannter Bibliothekstyp.');
    const { error } = await this.client.from(table).delete().eq('user_id', userId).eq('id', id);
    if (error) throw error;
  },

  async saveProject(projectId, title, state, status = 'draft') {
    const userId = this.assertUser();
    const { error } = await this.client.from('sitebrief_projects').upsert({
      user_id: userId,
      id: projectId,
      title: title || 'Unbenanntes Projekt',
      status,
      state,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async deleteProject(projectId) {
    const userId = this.assertUser();
    const { error } = await this.client.from('sitebrief_projects').delete().eq('user_id', userId).eq('id', projectId);
    if (error) throw error;
  },

  async uploadReference(projectId, imageId, dataUrl, filename = 'reference.jpg') {
    const userId = this.assertUser();
    if (!dataUrl?.startsWith('data:')) throw new Error('Ungültige Bilddaten.');
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Bildformat nicht unterstützt.');
    const mime = match[1];
    const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80) || `reference.${ext}`;
    const path = `${userId}/${projectId}/${imageId}-${safe.replace(/\.[^.]+$/, '')}.${ext}`;
    const { error } = await this.client.storage.from('sitebrief-references').upload(path, bytes, { contentType: mime, upsert: true });
    if (error) throw error;
    return path;
  },

  async signedReferenceUrl(path, expiresIn = 3600) {
    if (!path) return '';
    const { data, error } = await this.client.storage.from('sitebrief-references').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data?.signedUrl || '';
  },

  async removeReference(path) {
    if (!path) return;
    const { error } = await this.client.storage.from('sitebrief-references').remove([path]);
    if (error) throw error;
  }
};

window.SiteBriefCloud = Cloud;
window.SiteBriefCloudReady = Cloud.init().catch(error => {
  Cloud.emit('unavailable', { reason: error?.message || 'Supabase konnte nicht initialisiert werden.' });
  return { configured: false, error };
});
