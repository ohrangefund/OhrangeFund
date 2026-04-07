import { useState } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { acceptInvite, removeMember } from '@/api/accountMembers';
import type { AccountMember } from '@/types/models';

interface Props {
  visible: boolean;
  invites: AccountMember[];
  onClose: () => void;
}

export function PendingInvitesModal({ visible, invites, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAccept(invite: AccountMember) {
    setLoadingId(invite.id);
    try {
      await acceptInvite(invite.id);
      onClose();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(invite: AccountMember) {
    setLoadingId(invite.id);
    try {
      await removeMember(invite.id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('sharing.pendingTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {invites.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('sharing.noPending')}
              </Text>
            </View>
          ) : (
            invites.map((invite) => {
              const busy = loadingId === invite.id;
              return (
                <View key={invite.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.accountDot, { backgroundColor: colors.primary + '22' }]}>
                      <Text style={[styles.accountInitial, { color: colors.primary }]}>
                        {(invite.account_name?.[0] ?? '?').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
                        {invite.account_name ?? invite.account_id}
                      </Text>
                      <Text style={[styles.ownerEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                        {invite.owner_email ?? ''}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.actions, { borderTopColor: colors.border }]}>
                    <Pressable
                      onPress={() => handleReject(invite)}
                      disabled={!!loadingId}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { borderColor: colors.border, opacity: pressed || !!loadingId ? 0.5 : 1 },
                      ]}
                    >
                      {busy
                        ? <ActivityIndicator size="small" color={colors.textSecondary} />
                        : <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t('sharing.rejectInvite')}</Text>
                      }
                    </Pressable>
                    <Pressable
                      onPress={() => handleAccept(invite)}
                      disabled={!!loadingId}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.acceptBtn,
                        { backgroundColor: colors.primary, opacity: pressed || !!loadingId ? 0.5 : 1 },
                      ]}
                    >
                      {busy
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Check size={14} color="#fff" />
                            <Text style={styles.acceptText}>{t('sharing.acceptInvite')}</Text>
                          </>
                      }
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 32, gap: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  card: { borderRadius: 16, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  accountDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accountInitial: { fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  ownerEmail: { fontSize: 12 },
  actions: { flexDirection: 'row', borderTopWidth: 1 },
  actionBtn: {
    flex: 1, paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  acceptBtn: { borderRadius: 0 },
  actionText: { fontSize: 14, fontWeight: '600' },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
