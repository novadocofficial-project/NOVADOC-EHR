import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { AdminSettings } from "@/pages/AdminSettings";
import { QueueTokenSingle } from "@/pages/QueueTokenSingle";
import { QueueTokenPartitioned } from "@/pages/QueueTokenPartitioned";
import { QueueTokenMultiStep } from "@/pages/QueueTokenMultiStep";
import { FrontDeskUser } from "@/pages/FrontDeskUser";
import { NursingUser } from "@/pages/NursingUser";
import { DoctorUser } from "@/pages/DoctorUser";
import { LabUser } from "@/pages/LabUser";
import { AppointmentFrontDesk } from "@/pages/AppointmentFrontDesk";
import { PatientProfile } from "@/pages/PatientProfile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reports" component={Dashboard} />
      <Route path="/admin" component={AdminSettings} />
      <Route path="/queue/token/single" component={QueueTokenSingle} />
      <Route path="/queue/token/partitioned" component={QueueTokenPartitioned} />
      <Route path="/queue/token/multistep" component={QueueTokenMultiStep} />
      <Route path="/queue/frontdesk" component={FrontDeskUser} />
      <Route path="/queue/nursing" component={NursingUser} />
      <Route path="/queue/doctor" component={DoctorUser} />
      <Route path="/queue/lab" component={LabUser} />
      <Route path="/appointments/frontdesk">
        {() => <AppointmentFrontDesk key="frontdesk" role="frontdesk" />}
      </Route>
      <Route path="/appointments/nursing">
        {() => <AppointmentFrontDesk key="nursing" role="nursing" />}
      </Route>
      <Route path="/appointments/doctor/doc-1">
        {() => <AppointmentFrontDesk key="doctor-doc-1" role="doctor" lockedDoctorId="doc-1" />}
      </Route>
      <Route path="/appointments/doctor/doc-asif">
        {() => <AppointmentFrontDesk key="doctor-doc-asif" role="doctor" lockedDoctorId="doc-asif" />}
      </Route>
      <Route path="/patients/:id" component={PatientProfile} />
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
