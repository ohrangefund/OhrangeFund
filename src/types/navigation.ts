import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  AccountDetail: { accountId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Categories: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabsParamList> =
  BottomTabScreenProps<MainTabsParamList, T>;
