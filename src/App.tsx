import { useState } from "react";
import { TabBar, type Tab } from "./components/TabBar";
import { Today } from "./pages/Today";
import { Add } from "./pages/Add";
import { Trends } from "./pages/Trends";
import { Settings } from "./pages/Settings";
import { Onboarding } from "./pages/Onboarding";
import { useStore } from "./state/store";
import { todayISO } from "./lib/dates";

export default function App() {
  const onboarded = useStore((s) => s.onboarded);
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState(todayISO());

  if (!onboarded) return <Onboarding />;

  return (
    <div className="app">
      <main className="main">
        {tab === "today" && <Today date={date} setDate={setDate} onAdd={() => setTab("add")} />}
        {tab === "add" && <Add date={date} onLogged={() => setTab("today")} />}
        {tab === "trends" && <Trends />}
        {tab === "settings" && <Settings />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
