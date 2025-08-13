interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  counts?: { [key: string]: number };
}

export function Tabs({ tabs, activeTab, onTabChange, counts }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {counts && counts[tab.id] !== undefined && counts[tab.id] > 0 && (
            <span className="tab-count">{counts[tab.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
