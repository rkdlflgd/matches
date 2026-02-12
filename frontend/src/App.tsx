import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Card,
  CircularProgress,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Tooltip
} from '@mui/material';
import {
  LayoutDashboard,
  Cpu,
  Settings,
  Bell,
  CircleUser,
  Image as ImageIcon,
  CheckCircle,
  RefreshCcw,
  Trash2,
  Eye,
  Download,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Modal, Backdrop, Fade, Stepper, Step, StepLabel } from '@mui/material';
import en from './locales/en.json';
import tr from './locales/tr.json';

const translations: any = { en, tr };

// Premium Emerald/Zinc Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#09090b',
      paper: '#121214',
    },
    primary: {
      main: '#10b981', // Emerald Green
    },
    secondary: {
      main: '#27272a',
    },
    text: {
      primary: '#fafafa',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #27272a',
          backgroundColor: 'rgba(18, 18, 20, 0.8)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }
      }
    }
  },
});

const App: React.FC = () => {
  // -- Language & Tutorial State --
  const [lang, setLang] = useState<'tr' | 'en'>(
    (localStorage.getItem('lang') as any) || 'tr'
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const t = (path: string) => {
    const keys = path.split('.');
    let result = translations[lang];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };

  const [activeTab, setActiveTab] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Maclar.psd');
  const [logs, setLogs] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'manual' | 'live'>('manual');
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, time: timestamp }].slice(-50));
  };

  useEffect(() => {
    addLog(t('automation.terminal_ready'), 'info');
  }, [lang]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const toggleLanguage = () => {
    const newLang = lang === 'tr' ? 'en' : 'tr';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  // Dynamic API Base URL
  const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : '';

  // Track page visit on mount (for Vercel analytics)
  useEffect(() => {
    axios.get(`${API_BASE}/api/v1/analytics/track`, {
      params: { path: window.location.pathname, ref: document.referrer || undefined }
    }).catch(() => { });
  }, []);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/v1/analytics/stats`);
      if (response.data.status === 'success') {
        setAnalyticsData(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchFixtures();
    } else if (activeTab === 1) {
      fetchPreviews();
    } else if (activeTab === 3) {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchFixtures = async () => {
    setFixturesLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/v1/automation/fixtures`);
      if (response.data.status === 'success') {
        setFixtures(response.data.fixtures);
      }
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    } finally {
      setFixturesLoading(false);
    }
  };

  const addFixtureToInput = (fixture: any) => {
    // Format: Team A vs Team B 1.85 3.20 4.10 | 19:30 14 ŞUBAT
    const text = `${fixture.home} vs ${fixture.away} 2.15 3.40 3.20 | ${fixture.time} ${fixture.date || ''}`;
    setInputText(prev => prev ? `${prev}\n${text.trim()}` : text.trim());
  };

  const fetchPreviews = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/automation/previews`);
      setPreviews(response.data.previews);
    } catch (error) {
      console.error("Error fetching previews:", error);
    }
  };

  const handleDeleteAsset = async (filename: string) => {
    if (!window.confirm(t('gallery.confirm_delete') || "Are you sure you want to delete this asset?")) return;

    try {
      addLog(`SYSTEM: Deleting asset ${filename}...`, 'info');
      await axios.delete(`${API_BASE}/api/v1/automation/previews/${filename}`);
      addLog(`SUCCESS: Asset ${filename} removed.`, 'success');
      fetchPreviews();
    } catch (error) {
      addLog(`ERROR: Could not delete ${filename}`, 'error');
    }
  };

  const [renderingMatches, setRenderingMatches] = useState<Record<number, boolean>>({});

  const handleRender = async (match: any, index: number) => {
    setRenderingMatches(prev => ({ ...prev, [index]: true }));
    addLog(`Rendering started: ${match.home_team} vs ${match.away_team}`, 'info');
    try {
      const response = await axios.post(`${API_BASE}/api/v1/automation/render`, {
        match,
        template: selectedTemplate
      });
      if (response.data.status === 'success') {
        confetti({ particleCount: 100, spread: 70, colors: ['#10b981'] });
        addLog(`SUCCESS: ${match.home_team} rendered to /Mac/${match.filename || 'result'}.png`, 'success');
        fetchPreviews();
      } else {
        addLog(`RENDER ERROR: ${response.data.message}`, 'error');
      }
    } catch (error) {
      addLog(`SYSTEM ERROR: Photoshop connection lost`, 'error');
    } finally {
      setRenderingMatches(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSearch = async () => {
    if (!inputText) return;
    setLoading(true);
    addLog(`Parsing fixture data... lines: ${inputText.split('\n').length}`, 'info');

    const lines = inputText.split('\n').filter(l => l.trim());
    const matchInputs = lines.map(line => {
      const [mainPart, manualDT] = line.split('|');
      const parts = mainPart.split(/ vs /i);
      if (parts.length < 2) return null;
      const home = parts[0].trim();
      const rest = parts[1].trim().split(' ');
      return {
        home_team: home,
        away_team: rest[0],
        odds_1: rest[1] || '',
        odds_x: rest[2] || '',
        odds_2: rest[3] || '',
        manual_datetime: manualDT ? manualDT.trim() : undefined
      };
    }).filter(Boolean);

    try {
      addLog(`Requesting ${matchInputs.length} matches from automation core...`, 'info');
      const response = await axios.post(`${API_BASE}/api/v1/automation/execute`, {
        matches: matchInputs,
        boost_odds: false,
        subtract_day_for_night: false
      });

      const results = response.data.results;
      setMatches(results);
      addLog(`Pipeline connected: ${results.length} matches optimized. Starting rendering engine...`, 'success');

      // Auto-trigger rendering for each match sequentially for stability
      for (let i = 0; i < results.length; i++) {
        await handleRender(results[i], i);
      }

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4']
      });
    } catch (error) {
      addLog("ENGINE ERROR: Could not sync with TheSportsDB/Gemini API", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className="sidebar" style={{ backgroundColor: '#09090b', borderRight: '1px solid #1a1a1e' }}>
          <Box sx={{ px: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px' }}>
              <Cpu size={20} color="white" />
            </div>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Match<span style={{ color: '#10b981' }}>Auto</span>
            </Typography>
          </Box>

          <div className="nav-section">
            <div className={`nav-item ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
              <LayoutDashboard size={18} />
              {t('sidebar.automation')}
            </div>
            <div className={`nav-item ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
              <ImageIcon size={18} />
              {t('sidebar.gallery')}
            </div>
            <div className={`nav-item ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
              <Settings size={18} />
              {t('sidebar.templates')}
            </div>
            <div className={`nav-item ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
              <BarChart3 size={18} />
              {t('sidebar.analytics')}
            </div>
          </div>

          <Box sx={{ mt: 'auto', p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontSize: '0.8rem', mb: 2 }}
              onClick={toggleLanguage}
            >
              {lang === 'tr' ? '🇬🇧 English' : '🇹🇷 Türkçe'}
            </Button>

            <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed #27272a' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>System Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <div className="status-indicator status-online"></div>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Photoshop Connected</Typography>
              </Box>
            </Card>
          </Box>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
                {activeTab === 0 ? t('automation.title') : activeTab === 1 ? t('gallery.title') : activeTab === 2 ? t('templates.title') : t('analytics.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {activeTab === 0 ? t('automation.subtitle') : activeTab === 1 ? t('gallery.subtitle') : activeTab === 2 ? t('templates.subtitle') : t('analytics.subtitle')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Tooltip title="Notifications">
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid #27272a' }}><Bell size={20} /></IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<CircleUser size={20} />}
                sx={{ borderColor: '#27272a', color: 'text.primary' }}
              >
                Operator
              </Button>
            </Box>
          </Box>

          {activeTab === 0 ? (
            <div className="hub-grid fade-in">
              {/* LEFT PANEL: Inputs */}
              <div className="tech-card">
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 2, display: 'block' }}>
                  {t('automation.source_files')}
                </Typography>

                <Box
                  sx={{
                    border: '1px dashed #334155',
                    borderRadius: 4,
                    p: 2,
                    mb: 3,
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#10b981' }
                  }}
                  onClick={() => setActiveTab(2)}
                >
                  <img src="https://img.icons8.com/color/48/adobe-photoshop.png" alt="psd" style={{ marginBottom: '8px' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('automation.template_box')}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.4 }}>{selectedTemplate}</Typography>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('automation.data_box')}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant={inputMode === 'manual' ? 'contained' : 'text'}
                        sx={{ fontSize: '0.6rem', py: 0 }}
                        onClick={() => setInputMode('manual')}
                      >
                        Manual
                      </Button>
                      <Button
                        size="small"
                        variant={inputMode === 'live' ? 'contained' : 'text'}
                        sx={{ fontSize: '0.6rem', py: 0 }}
                        onClick={() => { setInputMode('live'); fetchFixtures(); }}
                      >
                        Live Feed
                      </Button>
                    </Box>
                  </Box>

                  {inputMode === 'manual' ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      placeholder={t('automation.placeholder')}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      variant="outlined"
                      className="cyber-input"
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                        '& .MuiInputBase-input': { fontSize: '0.8rem', fontFamily: 'monospace' }
                      }}
                    />
                  ) : (
                    <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid #1e293b', borderRadius: 3, p: 1 }}>
                      {fixturesLoading ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={20} /></Box>
                      ) : fixtures.map((f, i) => (
                        <Box
                          key={i}
                          onClick={() => { addFixtureToInput(f); setInputMode('manual'); }}
                          sx={{
                            p: 1, mb: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', border: '1px solid transparent',
                            '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.05)' }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{f.home} vs {f.away}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.6rem' }}>{f.league} • {f.time}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </div>

              {/* CENTER PANEL: Engine */}
              <div className="tech-card" style={{ position: 'relative' }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 2, display: 'block', textAlign: 'center' }}>
                  {t('automation.engine_center')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                  <Button
                    className="neon-button"
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{ height: '80px', fontSize: '1.2rem !important' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('automation.launch_batch')}
                  </Button>

                  <div className="terminal-window" ref={terminalRef}>
                    {logs.map((log, i) => (
                      <div key={i} className={`terminal-line ${log.type}`}>
                        <span className="terminal-line prefix">[{log.time}]</span>
                        {log.msg}
                      </div>
                    ))}
                  </div>

                  {loading && (
                    <div className="progress-container">
                      <Typography variant="caption" sx={{ color: '#10b981', mb: 1, display: 'block' }}>EXECUTING SMART-FLOW SCRIPTS...</Typography>
                      <CircularProgress variant="indeterminate" sx={{ color: '#10b981' }} size={20} />
                    </div>
                  )}
                </Box>
              </div>

              {/* RIGHT PANEL: Outputs */}
              <div className="tech-card">
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, mb: 2, display: 'block' }}>
                  {t('automation.outputs')}
                </Typography>

                <div className="output-grid">
                  {matches.length > 0 ? (
                    matches.map((match, idx) => {
                      const home = (match.home_team || match.home || 'A').trim();
                      const away = (match.away_team || match.away || 'B').trim();
                      const outputName = `Match_${home}_vs_${away}.png`;

                      // Aggressive normalization and matching
                      const normOutput = outputName.normalize('NFC').toLowerCase();
                      const isRendered = previews.some(p => p.normalize('NFC').toLowerCase() === normOutput);

                      const displaySrc = isRendered
                        ? `http://localhost:8000/static/previews/${encodeURIComponent(outputName)}?v=${Date.now()}`
                        : (match.home_badge || `https://via.placeholder.com/320x180/09090b/1e293b?text=${encodeURIComponent(home)}`);

                      return (
                        <Box
                          key={idx}
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            opacity: renderingMatches[idx] ? 0.5 : 1,
                            transition: 'all 0.3s ease',
                            '&:hover .output-delete-btn': { opacity: 1 }
                          }}
                          onClick={() => !renderingMatches[idx] && handleRender(match, idx)}
                        >
                          <img
                            src={displaySrc}
                            className="output-thumb"
                            style={{
                              width: '100%',
                              borderRadius: '12px',
                              border: isRendered ? '2px solid #10b981' : '1.5px dashed #334155',
                              boxShadow: isRendered ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
                              aspectRatio: '16/9',
                              objectFit: 'cover',
                              background: '#09090b'
                            }}
                            alt={home}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180/09090b/10b981?text=Awaiting+Render';
                            }}
                          />

                          {/* Sidebar Delete Icon (Visible on Hover) */}
                          {isRendered && !renderingMatches[idx] && (
                            <div
                              className="output-delete-btn"
                              style={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                opacity: 0,
                                transition: 'opacity 0.2s ease',
                                zIndex: 30
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAsset(outputName);
                              }}
                            >
                              <div className="action-btn-circle" style={{ width: '26px', height: '26px', background: 'rgba(0,0,0,0.7)', color: '#ef4444' }}>
                                <Trash2 size={14} />
                              </div>
                            </div>
                          )}

                          {renderingMatches[idx] && (
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                              <CircularProgress size={24} sx={{ color: '#10b981' }} />
                            </Box>
                          )}
                          {isRendered && !renderingMatches[idx] && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: '#10b981', borderRadius: '50%', p: 0.2, display: 'flex' }}>
                              <CheckCircle size={14} color="white" />
                            </Box>
                          )}
                          <Typography variant="caption" sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            display: 'block',
                            mt: 1,
                            opacity: isRendered ? 1 : 0.6,
                            color: isRendered ? '#10b981' : 'inherit'
                          }}>
                            {home} vs {away}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 8, opacity: 0.2 }}>
                      <ImageIcon size={48} />
                      <Typography variant="body2">No active renders</Typography>
                    </Box>
                  )}
                </div>

                <Button
                  fullWidth
                  variant="outlined"
                  disabled={matches.length === 0}
                  sx={{ mt: 'auto', border: '1px dashed #334155' }}
                >
                  Download All (.ZIP)
                </Button>
              </div>
            </div>
          ) : activeTab === 1 ? (
            <div className="fade-in">
              <div className="preview-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Button
                  startIcon={<RefreshCcw size={16} />}
                  onClick={fetchPreviews}
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: '#27272a' }}
                >
                  {t('gallery.refresh')}
                </Button>
              </div>

              <div className="asset-grid">
                {previews.map((file, idx) => (
                  <div key={idx} className="asset-card fade-in">
                    <div className="asset-image-container">
                      <img
                        src={`http://localhost:8000/static/previews/${file}`}
                        alt={file}
                        className="asset-image"
                        onClick={() => window.open(`http://localhost:8000/static/previews/${file}`, '_blank')}
                      />
                      <div className="asset-overlay">
                        <div className="action-btn-circle" onClick={() => window.open(`http://localhost:8000/static/previews/${file}`, '_blank')}>
                          <Eye size={18} />
                        </div>
                        <a
                          href={`http://localhost:8000/static/previews/${file}`}
                          download
                          className="action-btn-circle"
                          style={{ textDecoration: 'none' }}
                        >
                          <Download size={18} />
                        </a>
                        <div
                          className="action-btn-circle"
                          style={{ color: '#ef4444' }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteAsset(file); }}
                        >
                          <Trash2 size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="asset-footer">
                      <div className="asset-name">{file}</div>
                      <div className="asset-meta">
                        <div className="status-dot"></div>
                        <span>Ready for Production</span>
                      </div>
                    </div>
                  </div>
                ))}

                {previews.length === 0 && (
                  <div className="empty-state">
                    <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <Typography>{t('gallery.no_assets') || "No production assets found."}</Typography>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {[
                  {
                    id: 'Maclar.psd',
                    name: t('templates.standard'),
                    desc: t('templates.standard_desc'),
                    type: 'Soccer',
                    res: '1080 x 1350',
                    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'
                  },
                  {
                    id: 'Maclar1.psd',
                    name: t('templates.minimal'),
                    desc: t('templates.minimal_desc'),
                    type: 'Soccer',
                    res: '1080 x 1080',
                    img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800'
                  },
                  {
                    id: 'Basketbol.psd',
                    name: t('templates.basketball'),
                    desc: t('templates.basketball_desc'),
                    type: 'Basketball',
                    res: '1080 x 1350',
                    img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800'
                  }
                ].map((temp) => (
                  <div
                    key={temp.id}
                    className={`template-card ${selectedTemplate === temp.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(temp.id)}
                  >
                    {selectedTemplate === temp.id && (
                      <div className="selected-indicator">
                        <CheckCircle size={16} />
                      </div>
                    )}

                    <div className="template-preview-container">
                      <img src={temp.img} alt={temp.name} className="template-preview-image" />
                      <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 1 }}>
                        <Chip
                          label={temp.type}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: temp.type === 'Basketball' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: temp.type === 'Basketball' ? '#f97316' : '#10b981',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid currentColor'
                          }}
                        />
                        <Chip
                          label={temp.res}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        />
                      </Box>
                    </div>

                    <div className="template-content">
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
                        {temp.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem', lineHeight: 1.4 }}>
                        {temp.desc}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="template-id-badge">ID: {temp.id}</div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="status-dot"></div>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.65rem' }}>STABLE</Typography>
                        </div>
                      </Box>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 3 ? (
          <div className="fade-in">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                startIcon={<RefreshCcw size={16} />}
                onClick={fetchAnalytics}
                variant="outlined"
                size="small"
                sx={{ borderColor: '#27272a' }}
              >
                {t('analytics.refresh')}
              </Button>
            </Box>

            {analyticsLoading ? (
              <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress sx={{ color: '#10b981' }} /></Box>
            ) : analyticsData ? (
              <>
                {/* Stat Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
                  {[
                    { label: t('analytics.total_visits'), value: analyticsData.total_visits, icon: <Globe size={22} />, color: '#10b981' },
                    { label: t('analytics.unique_visitors'), value: analyticsData.unique_visitors, icon: <Users size={22} />, color: '#06b6d4' },
                    { label: t('analytics.today'), value: analyticsData.today_visits, icon: <TrendingUp size={22} />, color: '#f59e0b' },
                    { label: t('analytics.avg_daily'), value: analyticsData.daily.length > 0 ? Math.round(analyticsData.total_visits / Math.max(analyticsData.daily.length, 1)) : 0, icon: <Activity size={22} />, color: '#8b5cf6' }
                  ].map((stat, i) => (
                    <Card key={i} sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                      <Box sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.15, color: stat.color }}>{stat.icon}</Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>{stat.label}</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: stat.color, mt: 1, letterSpacing: '-2px' }}>{stat.value.toLocaleString()}</Typography>
                    </Card>
                  ))}
                </Box>

                {/* Daily Chart + Hourly Heatmap */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 4 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#10b981', fontWeight: 800, display: 'block', mb: 2 }}>{t('analytics.daily_chart')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 180, overflowX: 'auto', pb: 3, position: 'relative' }}>
                      {analyticsData.daily.length > 0 ? analyticsData.daily.map((d: any, i: number) => {
                        const max = Math.max(...analyticsData.daily.map((x: any) => x.count), 1);
                        const h = Math.max((d.count / max) * 150, 4);
                        return (
                          <Tooltip key={i} title={`${d.date}: ${d.count} ${t('analytics.visits')}`}>
                            <Box sx={{
                              width: analyticsData.daily.length > 20 ? 10 : 24,
                              minWidth: 6,
                              height: h,
                              bgcolor: '#10b981',
                              borderRadius: '4px 4px 0 0',
                              opacity: 0.7 + (d.count / max) * 0.3,
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              '&:hover': { opacity: 1, bgcolor: '#34d399', transform: 'scaleY(1.05)' }
                            }} />
                          </Tooltip>
                        );
                      }) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', m: 'auto' }}>{t('analytics.no_data')}</Typography>
                      )}
                    </Box>
                  </Card>

                  <Card sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#06b6d4', fontWeight: 800, display: 'block', mb: 2 }}>{t('analytics.hourly_heatmap')}</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                      {Array.from({ length: 24 }, (_, h) => {
                        const hourData = analyticsData.hourly_heatmap.find((x: any) => x.hour === h);
                        const count = hourData ? hourData.count : 0;
                        const maxH = Math.max(...analyticsData.hourly_heatmap.map((x: any) => x.count), 1);
                        const intensity = count / maxH;
                        return (
                          <Tooltip key={h} title={`${String(h).padStart(2, '0')}:00 — ${count} ${t('analytics.visits')}`}>
                            <Box sx={{
                              aspectRatio: '1',
                              borderRadius: '6px',
                              bgcolor: count === 0 ? 'rgba(255,255,255,0.03)' : `rgba(6, 182, 212, ${0.15 + intensity * 0.85})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              color: count > 0 ? '#fff' : 'rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': { transform: 'scale(1.1)', boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)' }
                            }}>
                              {String(h).padStart(2, '0')}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Card>
                </Box>

                {/* Top Referrers + Recent Visits */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#f59e0b', fontWeight: 800, display: 'block', mb: 2 }}>{t('analytics.top_referrers')}</Typography>
                    {analyticsData.top_referrers.length > 0 ? analyticsData.top_referrers.map((r: any, i: number) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{r.referrer}</Typography>
                        <Chip label={r.count} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }} />
                      </Box>
                    )) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>{t('analytics.no_referrers')}</Typography>
                    )}
                  </Card>

                  <Card sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#8b5cf6', fontWeight: 800, display: 'block', mb: 2 }}>{t('analytics.recent_visits')}</Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {analyticsData.recent_visits.map((v: any, i: number) => (
                        <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                          <Clock size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', display: 'block' }}>
                              {v.ip} — {v.path}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                              {new Date(v.timestamp).toLocaleString()} • {v.user_agent?.slice(0, 50)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 10, opacity: 0.3 }}>
                <BarChart3 size={48} />
                <Typography variant="body2" sx={{ mt: 2 }}>{t('analytics.no_data')}</Typography>
              </Box>
            )}
          </div>
          ) : null}
        </div>

        {/* --- TUTORIAL MODAL --- */}
        <Modal
          open={showTutorial}
          onClose={handleCloseTutorial}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
        >
          <Fade in={showTutorial}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', md: 600 },
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: 24,
              p: 4,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              outline: 'none'
            }}>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, color: '#10b981' }}>
                {t('tutorial.welcome')}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#f59e0b', fontWeight: 700, mb: 2 }}>
                {t('tutorial.ps_warning')}
              </Typography>

              <Stepper activeStep={tutorialStep} sx={{ my: 4 }}>
                {[0, 1, 2, 3].map(i => (
                  <Step key={i}>
                    <StepLabel />
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ minHeight: '160px', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {t(`tutorial.step${tutorialStep + 1}_title`)}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  {t(`tutorial.step${tutorialStep + 1}_desc`)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={toggleLanguage} variant="text" sx={{ color: '#10b981' }}>
                  {lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç'}
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {tutorialStep < 3 ? (
                    <Button variant="contained" onClick={() => setTutorialStep(v => v + 1)}>
                      {t('tutorial.next')}
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleCloseTutorial}>
                      {t('tutorial.start')}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Fade>
        </Modal>
      </div>
    </ThemeProvider >
  );
};

export default App;
