
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

const Dashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <DashboardWidgets />
    </div>
  );
};

export default Dashboard;
