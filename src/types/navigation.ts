import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Accounts: undefined;
  Scheduled: undefined;
  Analytics: undefined;
  Categories: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type AccountsStackParamList = {
  AccountsMain: undefined;
  TransfersHistory: undefined;
};

export type ScheduledStackParamList = {
  ScheduledMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Visuals: undefined;
  Language: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsMain: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabsParamList> =
  BottomTabScreenProps<MainTabsParamList, T>;
