import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Collections from "@/pages/Collections";
import Quiz from "@/pages/Quiz";
import Summary from "@/pages/Summary";
import NotFound from "@/pages/not-found";
import { Sidebar } from "./components/layout/Sidebar";

function Router() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/upload" component={Upload} />
          <Route path="/collections" component={Collections} />
          <Route path="/collections/:id" component={Collections} />
          <Route path="/quiz/:id" component={Quiz} />
          <Route path="/summary" component={Summary} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
