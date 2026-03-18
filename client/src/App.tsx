import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Pontaj from "./pages/Pontaj";
import TimeTracking from "./pages/TimeTracking";
import Stiri from "./pages/Stiri";
import StireDetaliu from "./pages/StireDetaliu";
import Documente from "./pages/Documente";
import Procese from "./pages/Procese";
import ProcesDetaliu from "./pages/ProcesDetaliu";
import Propuneri from "./pages/Propuneri";
import Proiecte from "./pages/Proiecte";
import Profil from "./pages/Profil";
import PlaceholderPage from "./pages/PlaceholderPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pontaj" component={Pontaj} />
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/stiri" component={Stiri} />
        <Route path="/stiri/:id" component={StireDetaliu} />
        <Route path="/documente" component={Documente} />
        <Route path="/procese" component={Procese} />
        <Route path="/procese/:id" component={ProcesDetaliu} />
        <Route path="/propuneri" component={Propuneri} />
        <Route path="/proiecte" component={Proiecte} />
        <Route path="/profil" component={Profil} />
        <Route path="/cereri" component={() => <PlaceholderPage title="Cereri Concediu" />} />
        <Route path="/viziune" component={() => <PlaceholderPage title="Viziune & Valori" />} />
        <Route path="/regulament" component={() => <PlaceholderPage title="Regulament Intern" />} />
        <Route path="/organigrama" component={() => <PlaceholderPage title="Organigramă" />} />
        <Route path="/biblioteca" component={() => <PlaceholderPage title="Bibliotecă Tehnică" />} />
        <Route path="/formulare" component={() => <PlaceholderPage title="Formulare & Cereri" />} />
        <Route path="/notificari" component={() => <PlaceholderPage title="Notificări" />} />
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
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
