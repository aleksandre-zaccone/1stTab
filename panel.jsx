/* global React, ReactDOM, chrome */
const { useState } = React;

function PanelApp() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    React.createElement('div', { className: 'panel-root' },
      React.createElement('header', { className: 'panel-header' },
        React.createElement('span', { className: 'panel-logo' }, '1st'),
        React.createElement('span', { className: 'panel-title' }, 'Tab Panel'),
      ),

      React.createElement('nav', { className: 'panel-nav' },
        ['home', 'notes', 'recent'].map(tab =>
          React.createElement('button', {
            key: tab,
            className: `panel-nav-btn ${activeTab === tab ? 'active' : ''}`,
            onClick: () => setActiveTab(tab),
          }, tab.charAt(0).toUpperCase() + tab.slice(1))
        )
      ),

      React.createElement('main', { className: 'panel-body' },
        activeTab === 'home' && React.createElement(HomeTab),
        activeTab === 'notes' && React.createElement(NotesTab),
        activeTab === 'recent' && React.createElement(RecentTab),
      )
    )
  );
}

function HomeTab() {
  const items = [
    { label: 'GitHub', url: '#', icon: '⌥' },
    { label: 'Gmail',  url: '#', icon: '✉' },
    { label: 'Figma',  url: '#', icon: '◈' },
    { label: 'Docs',   url: '#', icon: '◻' },
    { label: 'Maps',   url: '#', icon: '⊕' },
    { label: 'Cal',    url: '#', icon: '▦' },
  ];

  return (
    React.createElement('div', { className: 'panel-section' },
      React.createElement('p', { className: 'panel-section-label' }, 'Quick access'),
      React.createElement('div', { className: 'panel-grid' },
        items.map(({ label, url, icon }) =>
          React.createElement('a', { key: label, href: url, className: 'panel-chip' },
            React.createElement('span', { className: 'panel-chip-icon' }, icon),
            React.createElement('span', null, label)
          )
        )
      ),
      React.createElement('p', { className: 'panel-section-label mt' }, 'Status'),
      React.createElement('div', { className: 'panel-card' },
        React.createElement('p', { className: 'panel-card-title' }, 'Coming soon'),
        React.createElement('p', { className: 'panel-card-body' },
          'This panel will show your pinned bookmarks, quick notes, and recent activity. Dummy content for now.'
        )
      )
    )
  );
}

function NotesTab() {
  return (
    React.createElement('div', { className: 'panel-section' },
      React.createElement('p', { className: 'panel-section-label' }, 'Quick notes'),
      React.createElement('textarea', {
        className: 'panel-textarea',
        placeholder: 'Type something to remember...',
        rows: 8,
      }),
      React.createElement('div', { className: 'panel-card mt' },
        React.createElement('p', { className: 'panel-card-title' }, 'Saved note (dummy)'),
        React.createElement('p', { className: 'panel-card-body' },
          'Remember to update the build script once the panel feature is finalized. Notes persist via chrome.storage in the real implementation.'
        )
      )
    )
  );
}

function RecentTab() {
  const items = [
    { title: 'Claude Code docs', time: '2m ago',  url: '#' },
    { title: 'Chrome Side Panel API', time: '14m ago', url: '#' },
    { title: '1stTab GitHub repo',   time: '1h ago',  url: '#' },
    { title: 'Figma design file',    time: '3h ago',  url: '#' },
    { title: 'Linear — sprint board',time: '5h ago',  url: '#' },
  ];

  return (
    React.createElement('div', { className: 'panel-section' },
      React.createElement('p', { className: 'panel-section-label' }, 'Recently visited'),
      items.map(({ title, time, url }) =>
        React.createElement('a', { key: title, href: url, className: 'panel-row' },
          React.createElement('span', { className: 'panel-row-title' }, title),
          React.createElement('span', { className: 'panel-row-meta' }, time)
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(PanelApp), document.getElementById('root'));
