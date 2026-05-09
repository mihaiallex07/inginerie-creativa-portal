import NotFound from "./pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Stiri from "./pages/Stiri";
import StireDetaliu from "./pages/StireDetaliu";
import StireNou from "./pages/StireNou";
import Documente from "./pages/Documente";
import Procese from "./pages/Procese";
import ProcesDetaliu from "./pages/ProcesDetaliu";
import Propuneri from "./pages/Propuneri";
import Proiecte from "./pages/Proiecte";
import Profil from "./pages/Profil";
import PlaceholderPage from "./pages/PlaceholderPage";
import AdminUtilizatori from "./pages/AdminUtilizatori";
import Organigrama from "./pages/Organigrama";
import ProfilColeg from "./pages/ProfilColeg";
import TimeTracking from "./pages/TimeTracking";
import ProiectDetaliu from "./pages/ProiectDetaliu";
import ProcessOverview from "./pages/ProcessOverview";
import Evenimente from "./pages/Evenimente";
import Notificari from "./pages/Notificari";
import AdminDocumente from "./pages/AdminDocumente";
import RegulamentIntern from "./pages/RegulamentIntern";
import ViziuneValori from "./pages/ViziuneValori";
import ProceseProceduri from "./pages/ProceseProceduri";
import BibliotecaTehnica from "./pages/BibliotecaTehnica";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/stiri" component={Stiri} />
        <Route path="/stiri/nou" component={StireNou} />
        <Route path="/stiri/:id" component={StireDetaliu} />
        <Route path="/documente" component={Documente} />
        <Route path="/procese" component={Procese} />
        <Route path="/procese/:id" component={ProcesDetaliu} />
        <Route path="/propuneri" component={Propuneri} />
        <Route path="/proiecte" component={Proiecte} />
        <Route path="/proiecte/:id" component={ProiectDetaliu} />
        <Route path="/process-overview" component={ProcessOverview} />
        <Route path="/evenimente" component={Evenimente} />
        <Route path="/profil" component={Profil} />
        <Route path="/organigrama" component={Organigrama} />
        <Route path="/coleg/:id" component={ProfilColeg} />
        <Route path="/viziune" component={ViziuneValori} />
        <Route path="/regulament" component={RegulamentIntern} />
        <Route path="/biblioteca" component={BibliotecaTehnica} />
        <Route path="/procese-proceduri" component={ProceseProceduri} />
        <Route path="/formulare" component={() => <PlaceholderPage title="Formulare & Cereri" />} />
        <Route path="/admin-utilizatori" component={AdminUtilizatori} />
        <Route path="/admin-documente" component={AdminDocumente} />
        <Route path="/notificari" component={Notificari} />
        <Route path="/setari" component={() => <PlaceholderPage title="Setări" />} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        
          <Toaster
            richColors
            position="top-right"
            offset={{ top: 56, right: 16 }}
            toastOptions={{ style: { maxWidth: '340px', fontSize: '13px' } }}
          />
          <Router />
        
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
