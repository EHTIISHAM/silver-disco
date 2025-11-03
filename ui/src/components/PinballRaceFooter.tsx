import React from 'react';
import { 
  IoHomeOutline, 
  IoTrophyOutline, 
  IoBarChartOutline, 
  IoPersonOutline, 
  IoHome 
} from 'react-icons/io5';

// Define the shape of the props
interface FooterProps {
  activeTab: 'Home' | 'Winners' | 'Data' | 'Profile';
  onTabChange: (tab: 'Home' | 'Winners' | 'Data' | 'Profile') => void;
}

const PinballRaceFooter: React.FC<FooterProps> = ({ activeTab, onTabChange }) => {
  
  // Array defining the structure of the navigation items
  const navItems = [
    { name: 'Home', icon: IoHomeOutline, activeIcon: IoHome, tab: 'Home' },
    { name: 'Winners', icon: IoTrophyOutline, activeIcon: IoTrophyOutline, tab: 'Winners' },
    { name: 'Data', icon: IoBarChartOutline, activeIcon: IoBarChartOutline, tab: 'Data' },
    { name: 'Profile', icon: IoPersonOutline, activeIcon: IoPersonOutline, tab: 'Profile' },
  ];

  return (
    // Fixed positioning, bottom edge, full width, dark background, shadow, and rounded top corners
    <footer className="fixed bottom-0 left-0 right-0 bg-[#252525] p-2 shadow-2xl z-50 rounded-t-xl">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          // Use the filled icon only for 'Home' when active for the visual match
          const IconComponent = isActive && item.tab === 'Home' ? item.activeIcon : item.icon;
          
          return (
            <button
              key={item.name}
              onClick={() => onTabChange(item.tab as FooterProps['activeTab'])}
              className="flex flex-col items-center justify-center p-1 w-1/4 relative 
                         text-gray-400 hover:text-white transition-colors duration-200"
            >
              {/* Active Tab Indicator (the purple dot) */}
              {isActive && (
                <div className="absolute top-[-8px] w-1 h-1 rounded-full bg-purple-400"></div>
              )}
              
              {/* Icon */}
              <IconComponent 
                size={24} 
                className={isActive ? 'text-white' : 'text-gray-400'} 
              />
              
              {/* Text Label */}
              <span 
                className={`text-xs mt-1 font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default PinballRaceFooter;