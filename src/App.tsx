import { Dashboard } from "@/components/Dashboard";

function App() {
  const handleSettingsClick = () => {
    // TODO: Open settings modal/window
    console.log("Settings clicked");
  };

  return (
    <div className="h-screen w-full">
      <Dashboard onSettingsClick={handleSettingsClick} />
    </div>
  );
}

export default App;
