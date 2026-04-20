import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Dashboard } from "@/pages/Dashboard";
import { AdminSettings } from "@/pages/AdminSettings";
import { QueueTokenSingle } from "@/pages/QueueTokenSingle";
import { QueueTokenPartitioned } from "@/pages/QueueTokenPartitioned";
import { QueueTokenMultiStep } from "@/pages/QueueTokenMultiStep";
import { FrontDeskUser } from "@/pages/FrontDeskUser";
import { NursingUser } from "@/pages/NursingUser";
import { DoctorUser } from "@/pages/DoctorUser";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/admin" component={AdminSettings} />
      <Route path="/queue/token/single" component={QueueTokenSingle} />
      <Route path="/queue/token/partitioned" component={QueueTokenPartitioned} />
      <Route path="/queue/token/multistep" component={QueueTokenMultiStep} />
      <Route path="/queue/frontdesk" component={FrontDeskUser} />
      <Route path="/queue/nursing" component={NursingUser} />
      <Route path="/queue/doctor" component={DoctorUser} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
