import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjetsList from './pages/projets/ProjetsList'
import ProjetDetail from './pages/projets/ProjetDetail'
import Planning from './pages/planning/Planning'
import Budget from './pages/budget/Budget'
import SuiviChantier from './pages/suivi-chantier/SuiviChantier'
import Ressources from './pages/ressources/Ressources'
import Documents from './pages/documents/Documents'
import Approvisionnement from './pages/approvisionnement/Approvisionnement'
import Facturation from './pages/facturation/Facturation';
import Utilisateurs from './pages/admin/Utilisateurs';
import Profil from './pages/profil/Profil';
import Parametres from './pages/profil/Parametres';
import AssistantIA from './pages/assistant/AssistantIA';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<Login />} />

          {/* Routes protégées, avec Sidebar + Topbar (Layout) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/projets" element={<ProjetsList />} />
            <Route path="/projets/:id" element={<ProjetDetail />} />
            <Route path="/planning" element={<Planning />} />
            <Route
              path="/budget"
              element={
                <ProtectedRoute roles={['directeur_general', 'directeur_technique', 'responsable_admin_fin']}>
                  <Budget />
                </ProtectedRoute>
              }
            />
            <Route path="/suivi" element={<SuiviChantier />} />
            <Route path="/ressources" element={<Ressources />} />
            <Route path="/documents" element={<Documents />} />
            <Route
              path="/approvisionnement"
              element={
                <ProtectedRoute roles={['directeur_general', 'directeur_technique', 'responsable_admin_fin', 'magasinier']}>
                  <Approvisionnement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facturation"
              element={
                <ProtectedRoute roles={['directeur_general', 'directeur_technique', 'responsable_admin_fin']}>
                  <Facturation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/utilisateurs"
              element={
                <ProtectedRoute roles={['directeur_general', 'directeur_technique']}>
                  <Utilisateurs />
                </ProtectedRoute>
              }
            />
            <Route path="/profil" element={<Profil />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/assistant" element={<AssistantIA />} />


          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)