import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';

interface DrawerContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  activeTab: string;
  navigateTo: (screen: string) => void;
  registerNavigate: (fn: (screen: string) => void) => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  activeTab: 'Home',
  navigateTo: () => {},
  registerNavigate: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const navigateRef = useRef<(screen: string) => void>(() => {});

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const navigateTo = useCallback((screen: string) => {
    navigateRef.current(screen);
    setActiveTab(screen);
    setIsOpen(false);
  }, []);

  const registerNavigate = useCallback((fn: (screen: string) => void) => {
    navigateRef.current = fn;
  }, []);

  return (
    <DrawerContext.Provider value={{ isOpen, open, close, activeTab, navigateTo, registerNavigate }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
